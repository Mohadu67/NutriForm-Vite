const ChatMessage = require('../models/ChatMessage');
const SupportTicket = require('../models/SupportTicket');
const AIConversation = require('../models/AIConversation');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger.js');
const { notifyAdmins: notifyAdminsService } = require('../services/adminNotification.service');
const openaiService = require('../services/openai.service');
const { SYSTEM_PROMPT, ESCALATE_KEYWORDS, ESCALATE_CONFIRMATION } = require('../constants/chatPrompts');
const { findFallbackResponse, containsAny } = require('../constants/fallbackResponses');

// Wrapper pour compatibilite avec l'ancienne signature
async function notifyAdmins(title, message, link, metadata = {}, io = null) {
  return notifyAdminsService({
    title,
    message,
    link,
    type: 'support',
    metadata,
    io,
    icon: '/assets/icons/notif-support.svg'
  });
}

/**
 * Creer une reponse fallback et la sauvegarder en base
 */
async function createFallbackResponse(userId, conversationId, userMessage) {
  const reply = findFallbackResponse(userMessage);
  return await ChatMessage.create({
    userId,
    conversationId,
    role: 'bot',
    content: reply,
    metadata: { confidence: 0.6 }
  });
}

/**
 * Envoyer un message et recevoir une reponse
 * POST /api/chat/send
 */
async function sendMessage(req, res) {
  try {
    const { message, conversationId } = req.body;
    const userId = req.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message vide.' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message trop long (max 2000 caractères).' });
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

      // Notifier les admins du nouveau message (avec WebSocket temps réel)
      const user = await User.findById(userId);
      const userName = user?.pseudo || user?.prenom || 'Utilisateur';
      const io = req.app.get('io');
      await notifyAdmins(
        '💬 Nouveau message support',
        `${userName}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        '/admin/support-tickets',
        { ticketId: ticket._id, conversationId: convId, userId },
        io
      );

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

    // Compter les messages de cette conversation pour déterminer si on affiche le bouton escalade
    const messageCount = await ChatMessage.countDocuments({ conversationId: convId });
    const showEscalateButton = messageCount >= 3; // Afficher après 3 messages (inclut celui qu'on vient d'ajouter)

    // Detecter demande explicite de parler a un agent AVANT de generer une reponse
    const explicitEscalateRequest = containsAny(message, ESCALATE_KEYWORDS);

    if (explicitEscalateRequest) {
      // L'utilisateur demande explicitement un agent -> escalader immédiatement
      shouldEscalate = true;
      const io = req.app.get('io');
      await escalateToHuman(userId, convId, message, 'Demande explicite utilisateur', io);

      botResponse = await ChatMessage.create({
        userId,
        conversationId: convId,
        role: 'bot',
        content: ESCALATE_CONFIRMATION,
        metadata: { confidence: 1, escalated: true }
      });

      // Sauvegarder la conversation
      await AIConversation.findOneAndUpdate(
        { userId, conversationId: convId },
        {
          userId,
          conversationId: convId,
          lastMessage: botResponse.content.substring(0, 100),
          escalated: true,
          ticketId: (await SupportTicket.findOne({ conversationId: convId }))?._id,
          isActive: true
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        conversationId: convId,
        message: userMessage,
        botResponse,
        escalated: true,
        showEscalateButton: true
      });
    }

    if (openaiService.isAvailable()) {
      // Mode avec OpenAI
      try {
        const history = await ChatMessage.find({ conversationId: convId })
          .sort({ createdAt: 1 })
          .limit(10);

        const result = await openaiService.generateResponse(message, history);
        const reply = result.content;
        confidence = result.confidence;

        // Detecter si le bot veut escalader
        if (openaiService.shouldEscalate(reply)) {
          shouldEscalate = true;
          confidence = 0.3;
        }

        botResponse = await ChatMessage.create({
          userId,
          conversationId: convId,
          role: 'bot',
          content: reply,
          metadata: { confidence }
        });

      } catch (error) {
        logger.error('Erreur OpenAI:', error);
        // Fallback vers reponse generique
        botResponse = await createFallbackResponse(userId, convId, message);
      }
    } else {
      // Mode sans OpenAI (reponses predefinies)
      botResponse = await createFallbackResponse(userId, convId, message);
    }

    // Si escalade nécessaire, créer un ticket
    if (shouldEscalate) {
      const io = req.app.get('io');
      await escalateToHuman(userId, convId, message, '', io);
    }

    // Sauvegarder/mettre à jour la conversation IA dans la base de données
    // Utiliser la réponse du bot comme dernier message (ou le message user si escaladé)
    const lastMessageContent = botResponse?.content || botResponse || message.trim();
    await AIConversation.findOneAndUpdate(
      { userId, conversationId: convId },
      {
        userId,
        conversationId: convId,
        lastMessage: lastMessageContent.substring(0, 100) + (lastMessageContent.length > 100 ? '...' : ''),
        escalated: shouldEscalate,
        ticketId: shouldEscalate ? (await SupportTicket.findOne({ conversationId: convId }))?._id : null,
        isActive: true
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      conversationId: convId,
      message: userMessage,
      botResponse,
      escalated: shouldEscalate,
      showEscalateButton,
      messageCount
    });

  } catch (error) {
    logger.error('Erreur sendMessage:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message.' });
  }
}


/**
 * Récupérer l'historique d'une conversation (avec pagination)
 * GET /api/chat/history/:conversationId?limit=20&before=messageId
 */
async function getChatHistory(req, res) {
  try {
    const { conversationId } = req.params;
    const { limit = 20, before } = req.query;
    const userId = req.userId;

    const query = { userId, conversationId };

    // Si "before" est fourni, charger les messages plus anciens que ce message
    if (before) {
      const beforeMessage = await ChatMessage.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    // Récupérer les messages (triés du plus récent au plus ancien pour pagination)
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('adminId', 'pseudo prenom');

    // Inverser pour afficher du plus ancien au plus récent
    messages.reverse();

    // Compter le total de messages pour savoir s'il y en a plus
    const totalCount = await ChatMessage.countDocuments({ userId, conversationId });
    const hasMore = before
      ? messages.length === parseInt(limit)
      : totalCount > parseInt(limit);

    res.status(200).json({
      messages,
      hasMore,
      totalCount
    });
  } catch (error) {
    logger.error('Erreur getChatHistory:', error);
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

    // Créer le ticket (avec WebSocket temps réel)
    const io = req.app.get('io');
    ticket = await escalateToHuman(userId, conversationId, lastMessage?.content || 'Demande d\'aide', reason, io);

    res.status(200).json({
      message: 'Conversation escaladée vers le support.',
      ticket
    });
  } catch (error) {
    logger.error('Erreur escalateConversation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'escalade.' });
  }
}

/**
 * Fonction helper pour créer un ticket support
 */
async function escalateToHuman(userId, conversationId, lastMessage, reason = '', io = null) {
  const user = await User.findById(userId);
  const userName = user?.pseudo || user?.prenom || user?.email || 'Utilisateur';

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

  // Notifier les admins (avec WebSocket temps réel si disponible)
  await notifyAdmins(
    '🎫 Nouveau ticket support',
    `${userName} demande de l'aide: "${lastMessage.substring(0, 50)}${lastMessage.length > 50 ? '...' : ''}"`,
    `/admin/support-tickets?ticket=${ticket._id}`,
    { ticketId: ticket._id, conversationId, userId },
    io
  );

  logger.info(`🎫 Ticket créé : ${ticket._id} pour user ${userName}`);

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

/**
 * Récupérer toutes les conversations IA de l'utilisateur
 * GET /api/chat/ai-conversations
 */
async function getAIConversations(req, res) {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 20; // Limite par défaut de 20 conversations IA

    const conversations = await AIConversation.find({ userId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({ conversations });
  } catch (error) {
    logger.error('Erreur getAIConversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations.' });
  }
}

/**
 * Supprimer une conversation IA
 * DELETE /api/chat/ai-conversation/:conversationId
 */
async function deleteAIConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Vérifier que la conversation appartient à l'utilisateur
    const conversation = await AIConversation.findOne({
      userId,
      conversationId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée.' });
    }

    // Marquer comme inactive (soft delete)
    conversation.isActive = false;
    await conversation.save();

    // Supprimer tous les messages associés
    await ChatMessage.deleteMany({ conversationId });

    res.status(200).json({ message: 'Conversation supprimée avec succès.' });
  } catch (error) {
    logger.error('Erreur deleteAIConversation:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la conversation.' });
  }
}

/**
 * Résoudre un ticket support et auto-supprimer la conversation IA
 * POST /api/chat/resolve-ticket/:ticketId
 */
async function resolveTicket(req, res) {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé.' });
    }

    // Marquer le ticket comme résolu
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    await ticket.save();

    // Auto-supprimer la conversation IA associée
    if (ticket.conversationId) {
      await AIConversation.findOneAndUpdate(
        { conversationId: ticket.conversationId },
        { isActive: false }
      );

      // Supprimer les messages
      await ChatMessage.deleteMany({ conversationId: ticket.conversationId });

      logger.info(`✅ Conversation ${ticket.conversationId} supprimée après résolution du ticket`);
    }

    res.status(200).json({
      message: 'Ticket résolu et conversation supprimée.',
      ticket
    });
  } catch (error) {
    logger.error('Erreur resolveTicket:', error);
    res.status(500).json({ error: 'Erreur lors de la résolution du ticket.' });
  }
}

module.exports = {
  sendMessage,
  getChatHistory,
  escalateConversation,
  getAIConversations,
  deleteAIConversation,
  resolveTicket
};
