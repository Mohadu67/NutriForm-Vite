const OpenAI = require('openai');
const ChatMessage = require('../models/ChatMessage');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Initialiser OpenAI (optionnel)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Prompt système pour le chatbot
const SYSTEM_PROMPT = `Tu es l'assistant virtuel de NutriForm, une application de fitness et nutrition.

Ton rôle est d'aider les utilisateurs avec :
- Questions sur l'utilisation de l'app
- Explication des fonctionnalités (Dashboard, Leaderboard, abonnement Premium)
- Problèmes techniques basiques
- Questions sur l'abonnement (prix : 3,99€/mois, 7 jours d'essai gratuit)
- Questions sur les exercices et entraînements

Règles importantes :
1. Réponds TOUJOURS en français
2. Sois concis et clair (max 3-4 phrases)
3. Sois friendly et encourageant
4. Si tu ne sais pas ou si c'est complexe, propose de transférer vers un humain
5. Ne donne JAMAIS de conseils médicaux
6. Ne traite PAS les problèmes de paiement (escalade immédiate)

Features de NutriForm à connaître :
- Gratuit : Bibliothèque exercices, calculateurs (IMC, calories, 1RM), suivi séance sans sauvegarde
- Premium (3,99€/mois) : Sauvegarde illimitée, Dashboard complet, statistiques, badges, leaderboard
- 7 jours d'essai gratuit Premium

Si l'utilisateur a un problème que tu ne peux pas résoudre, réponds : "Je vais te mettre en contact avec notre équipe. Un instant..."`;

/**
 * Envoyer un message et recevoir une réponse
 * POST /api/chat/send
 */
async function sendMessage(req, res) {
  try {
    const { message, conversationId } = req.body;
    const userId = req.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message vide.' });
    }

    // Générer un conversationId si c'est un nouveau chat
    const convId = conversationId || uuidv4();

    // Sauvegarder le message user
    const userMessage = await ChatMessage.create({
      userId,
      conversationId: convId,
      role: 'user',
      content: message.trim()
    });

    // Vérifier si cette conversation a déjà été escaladée
    const ticket = await SupportTicket.findOne({ conversationId: convId });

    if (ticket && ticket.isOpen()) {
      // Conversation déjà escaladée -> pas de bot, juste sauvegarder le message
      ticket.lastUserMessage = message.trim();
      ticket.lastUserMessageAt = new Date();
      ticket.messageCount += 1;
      await ticket.save();

      return res.status(200).json({
        conversationId: convId,
        message: userMessage,
        botResponse: null,
        escalated: true,
        ticketStatus: ticket.status
      });
    }

    // Sinon, générer réponse bot
    let botResponse = null;
    let shouldEscalate = false;
    let confidence = 0;

    if (openai) {
      // Mode avec OpenAI
      try {
        const history = await ChatMessage.find({ conversationId: convId })
          .sort({ createdAt: 1 })
          .limit(10); // 10 derniers messages pour contexte

        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
          }))
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Modèle rapide et économique
          messages,
          max_tokens: 300,
          temperature: 0.7
        });

        const reply = completion.choices[0].message.content;

        // Détecter si le bot veut escalader
        if (reply.includes('mettre en contact') || reply.includes('notre équipe')) {
          shouldEscalate = true;
          confidence = 0.3;
        } else {
          confidence = 0.8; // Confiance par défaut
        }

        botResponse = await ChatMessage.create({
          userId,
          conversationId: convId,
          role: 'bot',
          content: reply,
          metadata: { confidence }
        });

      } catch (error) {
        console.error('Erreur OpenAI:', error);
        // Fallback vers réponse générique
        botResponse = await generateFallbackResponse(userId, convId, message);
      }
    } else {
      // Mode sans OpenAI (réponses prédéfinies)
      botResponse = await generateFallbackResponse(userId, convId, message);
    }

    // Si escalade nécessaire, créer un ticket
    if (shouldEscalate) {
      await escalateToHuman(userId, convId, message);
    }

    res.status(200).json({
      conversationId: convId,
      message: userMessage,
      botResponse,
      escalated: shouldEscalate
    });

  } catch (error) {
    console.error('Erreur sendMessage:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message.' });
  }
}

/**
 * Générer une réponse fallback sans OpenAI
 */
async function generateFallbackResponse(userId, conversationId, userMessage) {
  const msg = userMessage.toLowerCase();
  let reply = '';

  // Détection d'intention basique
  if (msg.includes('premium') || msg.includes('prix') || msg.includes('abonnement') || msg.includes('payant')) {
    reply = "NutriForm Premium coûte 3,99€/mois avec 7 jours d'essai gratuit ! Tu débloqueras la sauvegarde illimitée, le dashboard complet, les statistiques et bien plus. Tu peux essayer sans engagement sur /pricing 💪";
  } else if (msg.includes('dashboard') || msg.includes('tableau de bord')) {
    reply = "Le Dashboard te permet de suivre tes progrès : statistiques, badges, heatmap d'activité... C'est une feature Premium (3,99€/mois). Tu veux en savoir plus ?";
  } else if (msg.includes('gratuit') || msg.includes('free')) {
    reply = "Avec le plan gratuit, tu as accès à la bibliothèque d'exercices, aux calculateurs (IMC, calories, 1RM) et au suivi de séance en direct. Pour sauvegarder tes séances, il faut passer Premium (3,99€/mois, 7 jours gratuits) 🚀";
  } else if (msg.includes('bug') || msg.includes('erreur') || msg.includes('marche pas') || msg.includes('problème')) {
    reply = "Oh non ! Peux-tu me décrire le problème plus précisément ? (Quelle page, quel message d'erreur...) Si c'est urgent, je peux te mettre en contact avec notre équipe.";
  } else if (msg.includes('paiement') || msg.includes('carte') || msg.includes('facturation')) {
    // Escalade immédiate pour paiement
    reply = "Je vais te mettre en contact avec notre équipe pour t'aider avec ton paiement. Un instant...";
  } else if (msg.includes('annuler') || msg.includes('résilier')) {
    reply = "Tu peux annuler ton abonnement à tout moment depuis ton Dashboard → Gérer mon abonnement. Tu garderas l'accès Premium jusqu'à la fin de ta période payée. Besoin d'aide ?";
  } else if (msg.includes('bonjour') || msg.includes('salut') || msg.includes('hello')) {
    reply = "Salut ! 👋 Je suis l'assistant NutriForm. Comment puis-je t'aider aujourd'hui ?";
  } else if (msg.includes('merci')) {
    reply = "De rien ! N'hésite pas si tu as d'autres questions. Bon entraînement ! 💪";
  } else {
    // Réponse générique
    reply = "Je peux t'aider avec des questions sur NutriForm, l'abonnement Premium, ou l'utilisation de l'app. Que veux-tu savoir ? Si tu préfères, je peux aussi te mettre en contact avec notre équipe.";
  }

  return await ChatMessage.create({
    userId,
    conversationId,
    role: 'bot',
    content: reply,
    metadata: { confidence: 0.6 }
  });
}

/**
 * Récupérer l'historique d'une conversation
 * GET /api/chat/history/:conversationId
 */
async function getChatHistory(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const messages = await ChatMessage.find({
      userId,
      conversationId
    })
      .sort({ createdAt: 1 })
      .populate('adminId', 'pseudo prenom');

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Erreur getChatHistory:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
  }
}

/**
 * Escalader vers support humain
 * POST /api/chat/escalate
 */
async function escalateConversation(req, res) {
  try {
    const { conversationId, reason } = req.body;
    const userId = req.userId;

    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId requis.' });
    }

    // Vérifier si déjà escaladé
    let ticket = await SupportTicket.findOne({ conversationId });
    if (ticket) {
      return res.status(400).json({ error: 'Conversation déjà escaladée.', ticket });
    }

    // Récupérer le dernier message user
    const lastMessage = await ChatMessage.findOne({
      conversationId,
      role: 'user'
    }).sort({ createdAt: -1 });

    // Créer le ticket
    ticket = await escalateToHuman(userId, conversationId, lastMessage?.content || 'Demande d\'aide', reason);

    res.status(200).json({
      message: 'Conversation escaladée vers le support.',
      ticket
    });
  } catch (error) {
    console.error('Erreur escalateConversation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'escalade.' });
  }
}

/**
 * Fonction helper pour créer un ticket support
 */
async function escalateToHuman(userId, conversationId, lastMessage, reason = '') {
  const user = await User.findById(userId);

  const ticket = await SupportTicket.create({
    userId,
    conversationId,
    subject: lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : ''),
    lastUserMessage: lastMessage,
    lastUserMessageAt: new Date(),
    priority: reason === 'billing' ? 'high' : 'medium',
    category: detectCategory(lastMessage)
  });

  // Marquer tous les messages de cette conversation comme escaladés
  await ChatMessage.updateMany(
    { conversationId },
    { $set: { escalated: true } }
  );

  console.log(`🎫 Ticket créé : ${ticket._id} pour user ${user.pseudo || user.email}`);

  return ticket;
}

/**
 * Détecter la catégorie d'un message
 */
function detectCategory(message) {
  const msg = message.toLowerCase();

  if (msg.includes('paiement') || msg.includes('carte') || msg.includes('facture') || msg.includes('abonnement')) {
    return 'billing';
  } else if (msg.includes('compte') || msg.includes('mot de passe') || msg.includes('email')) {
    return 'account';
  } else if (msg.includes('bug') || msg.includes('erreur') || msg.includes('marche pas')) {
    return 'technical';
  } else if (msg.includes('feature') || msg.includes('fonctionnalité') || msg.includes('idée')) {
    return 'feature_request';
  }

  return 'other';
}

module.exports = {
  sendMessage,
  getChatHistory,
  escalateConversation
};
