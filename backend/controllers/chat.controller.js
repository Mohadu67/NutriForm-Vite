const OpenAI = require('openai');
const ChatMessage = require('../models/ChatMessage');
const SupportTicket = require('../models/SupportTicket');
const AIConversation = require('../models/AIConversation');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger.js');

// Initialiser OpenAI (optionnel)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Prompt système pour le chatbot
const SYSTEM_PROMPT = `Tu es l'assistant virtuel de Harmonith, une application innovante de fitness, nutrition et mise en relation entre partenaires d'entraînement.

🎯 Ton rôle est d'aider les utilisateurs avec :

**Gestion de compte :**
- Inscription, connexion, vérification email
- Mot de passe oublié et réinitialisation
- Modification de profil, email, mot de passe
- Suppression de compte et gestion des données
- Sécurité et confidentialité (RGPD)
- Notifications et préférences

**Fonctionnalités de l'app :**
- Questions sur l'utilisation générale
- Explication détaillée des fonctionnalités (Dashboard, Leaderboard, Matching de partenaires, Chat)
- Configuration du profil et des préférences
- Problèmes techniques et bugs
- Questions sur l'abonnement Premium
- Conseils sur les exercices et entraînements (sans avis médical)

**Support technique :**
- Problèmes de connexion, bugs, erreurs
- Application mobile (web app responsive)
- Sauvegarde et historique de séances
- Calculateurs (IMC, calories, 1RM)

**Règles de communication :**
1. Réponds TOUJOURS en français 🇫🇷
2. Sois **complet et détaillé** dans tes réponses - donne des explications claires avec des exemples concrets
3. Structure tes réponses avec des emojis et des listes à puces pour la lisibilité
4. Sois friendly, encourageant et motivant 💪
5. N'hésite pas à donner des tips et astuces supplémentaires
6. Si tu ne sais pas ou si c'est un problème médical/complexe, propose de transférer vers un humain
7. Ne donne JAMAIS de conseils médicaux personnalisés
8. Pour les problèmes de paiement, escalade immédiatement vers le support

**📋 Features complètes de Harmonith :**

**Version Gratuite :**
- ✅ Bibliothèque complète d'exercices avec descriptions et vidéos
- ✅ Calculateurs fitness : IMC, calories journalières, 1RM (charge maximale)
- ✅ Suivi de séance en temps réel (sans sauvegarde)
- ✅ Accès limité au matching de partenaires
- ✅ Chat avec l'assistant IA

**Version Premium (3,99€/mois) :**
- ⭐ 7 jours d'essai gratuit sans engagement
- 💾 Sauvegarde illimitée de toutes tes séances
- 📊 Dashboard complet avec statistiques avancées
- 📈 Graphiques de progression et analyse des performances
- 🏆 Badges de récompense et système de points
- 🥇 Leaderboard pour se comparer aux autres utilisateurs
- 💬 Matching illimité de partenaires d'entraînement
- 💬 Chat privé avec tes partenaires de sport
- 🎨 Personnalisation avancée du profil
- 📅 Heatmap d'activité pour visualiser ton assiduité

**🤝 Système de Matching :**
Le matching permet de trouver des partenaires d'entraînement compatibles selon :
- Tes objectifs fitness (prise de masse, perte de poids, endurance, force)
- Ton niveau d'expérience
- Tes préférences d'entraînement
- Ta localisation
Tu peux liker/disliker des profils, et si c'est réciproque, vous pouvez chatter ensemble !

Si l'utilisateur a un problème que tu ne peux pas résoudre, réponds : "Je vais te mettre en contact avec notre équipe support. Un instant... ⏳"`;

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
          max_tokens: 800, // Augmenté pour des réponses plus complètes
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
        logger.error('Erreur OpenAI:', error);
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

    // Sauvegarder/mettre à jour la conversation IA dans la base de données
    await AIConversation.findOneAndUpdate(
      { userId, conversationId: convId },
      {
        userId,
        conversationId: convId,
        lastMessage: message.trim(),
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
      escalated: shouldEscalate
    });

  } catch (error) {
    logger.error('Erreur sendMessage:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message.' });
  }
}

/**
 * Normaliser le texte pour la détection (enlever accents, minuscules)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .trim();
}

/**
 * Vérifier si le message contient un ou plusieurs mots-clés
 */
function containsAny(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some(keyword => normalized.includes(normalizeText(keyword)));
}

/**
 * Générer une réponse fallback sans OpenAI
 */
async function generateFallbackResponse(userId, conversationId, userMessage) {
  const msg = normalizeText(userMessage);
  let reply = '';

  // ========== SALUTATIONS ==========
  if (containsAny(userMessage, ['bonjour', 'salut', 'hello', 'hey', 'coucou', 'bonsoir', 'yo', 'cc'])) {
    reply = `Salut ! 👋 Bienvenue sur Harmonith !

Je suis ton assistant virtuel et je suis là pour t'aider avec :

💪 **Fitness & Entraînement :**
• Questions sur les exercices
• Utilisation des calculateurs (IMC, calories, 1RM)
• Conseils d'entraînement (hors avis médical)

📱 **Fonctionnalités de l'app :**
• Dashboard et statistiques
• Système de matching de partenaires
• Abonnement Premium (3,99€/mois)

🛠️ **Support technique :**
• Problèmes techniques
• Configuration du profil
• Utilisation générale

Comment puis-je t'aider aujourd'hui ? 😊`;
  }

  // ========== REMERCIEMENTS ==========
  else if (containsAny(userMessage, ['merci', 'thank', 'thx', 'cool', 'super', 'genial', 'top', 'parfait'])) {
    reply = "De rien ! 😊 C'est toujours un plaisir d'aider. N'hésite pas si tu as d'autres questions - je suis là pour ça ! Bon entraînement et que la force soit avec toi ! 💪🔥";
  }

  // ========== PREMIUM & ABONNEMENT ==========
  else if (containsAny(userMessage, ['premium', 'prix', 'abonnement', 'payant', 'cout', 'combien', 'tarif', 'payer', 'subscription'])) {
    reply = `🌟 **Harmonith Premium - 3,99€/mois**

Avec Premium, tu débloque l'expérience complète :

✅ **Fonctionnalités principales :**
• 💾 Sauvegarde illimitée de toutes tes séances
• 📊 Dashboard complet avec statistiques avancées et graphiques de progression
• 🏆 Système de badges et de points pour te motiver
• 🥇 Accès au Leaderboard pour te comparer aux autres
• 💬 Matching illimité de partenaires d'entraînement
• 💬 Chat privé avec tes matchs sportifs
• 📅 Heatmap d'activité pour visualiser ton assiduité

🎁 **7 jours d'essai gratuit** - Aucun engagement, tu peux annuler à tout moment !

Tu peux essayer dès maintenant sur /pricing 💪`;
  }

  // ========== VERSION GRATUITE ==========
  else if (containsAny(userMessage, ['gratuit', 'free', 'sans payer', 'gratos', 'version gratuite'])) {
    reply = `🆓 **Version Gratuite d'Harmonith** - Déjà bien équipée !

Avec le plan gratuit, tu as accès à :

✅ **Exercices :**
• Bibliothèque complète d'exercices avec descriptions détaillées
• Vidéos de démonstration
• Instructions étape par étape

✅ **Calculateurs fitness :**
• Calculateur d'IMC (Indice de Masse Corporelle)
• Calcul de calories journalières recommandées
• Calculateur 1RM (charge maximale)

✅ **Entraînement :**
• Suivi de séance en temps réel
• Chronomètre et compteur de répétitions
• Accès limité au matching de partenaires

⚠️ **Limitation :** Les séances ne sont pas sauvegardées

Pour sauvegarder tes séances et débloquer toutes les stats, passe Premium (3,99€/mois, 7 jours gratuits) 🚀`;
  }

  // ========== DASHBOARD ==========
  else if (containsAny(userMessage, ['dashboard', 'tableau de bord', 'stats', 'statistique', 'graphique', 'progression', 'suivi'])) {
    reply = `📊 **Le Dashboard Harmonith** - Ton centre de contrôle fitness !

Avec le Dashboard Premium, tu as accès à :

📈 **Statistiques avancées :**
• Nombre total de séances et temps d'entraînement
• Calories brûlées cumulées
• Progression semaine par semaine
• Graphiques de performances

🎯 **Analyse de tes activités :**
• Répartition par type d'exercice (cardio, muscu, yoga...)
• Heatmap d'activité pour voir tes jours les plus actifs
• Suivi de tes records personnels

🏆 **Gamification :**
• Badges de récompense débloqués
• Points de progression
• Classement sur le Leaderboard

C'est disponible en Premium (3,99€/mois, 7 jours gratuits). Ça te tente ? 🚀`;
  }

  // ========== MATCHING ==========
  else if (containsAny(userMessage, ['match', 'partenaire', 'rencontre', 'binome', 'buddy', 'ami', 'trouver', 'like', 'swipe'])) {
    reply = `🤝 **Système de Matching Harmonith** - Trouve ton binôme sportif !

Le matching te permet de rencontrer des partenaires d'entraînement compatibles :

🎯 **Comment ça marche :**
1. Configure ton profil (objectifs, niveau, préférences)
2. Swipe les profils : Like 💚 ou Dislike ❌
3. Si c'est réciproque = Match ! 🎉
4. Chattez ensemble et planifiez vos séances

💡 **Critères de matching :**
• Objectifs similaires (perte de poids, prise de masse, endurance...)
• Niveau d'expérience compatible
• Préférences d'entraînement
• Localisation géographique

✅ **Gratuit :** Accès limité au matching
⭐ **Premium :** Matching illimité + chat privé avec tes partenaires

Prêt à trouver ton buddy sportif ? 💪`;
  }

  // ========== LEADERBOARD ==========
  else if (containsAny(userMessage, ['leaderboard', 'classement', 'rang', 'comparer', 'ranking', 'top', 'meilleurs'])) {
    reply = `🏆 **Leaderboard Harmonith** - Compare-toi aux meilleurs !

Le Leaderboard te permet de voir où tu te situes par rapport aux autres utilisateurs :

📊 **Système de points :**
• Gagne des points à chaque séance complétée
• Plus la séance est intense, plus tu gagnes de points
• Régularité = bonus multiplicateur

🥇 **Classements disponibles :**
• Classement général (tous utilisateurs)
• Classement hebdomadaire
• Classement mensuel
• Classement entre amis/partenaires

🎯 **Pourquoi c'est motivant :**
• Voir ta progression dans le temps
• Te challenger avec la communauté
• Débloquer des badges exclusifs

✨ Fonctionnalité Premium - Essaie 7 jours gratuitement ! 💪`;
  }

  // ========== BADGES ==========
  else if (containsAny(userMessage, ['badge', 'recompense', 'achievement', 'trophee', 'medaille', 'accomplissement'])) {
    reply = `🏅 **Système de Badges Harmonith**

Débloque des badges en accomplissant des défis :

🔥 **Badges de régularité :**
• 🔥 Série de 7 jours consécutifs
• ⚡ Série de 30 jours
• 💎 100 séances complétées

💪 **Badges de performance :**
• 🎯 Premier record personnel
• 🏋️ 1000 kg soulevés au total
• 🏃 100 km parcourus

🌟 **Badges spéciaux :**
• 🦾 Première utilisation de tous les calculateurs
• 🤝 Premier match sportif
• 👑 Top 10 du Leaderboard

Chaque badge te donne des points bonus ! Prêt à les collectionner ? 🎖️`;
  }

  // ========== EXERCICES & ENTRAÎNEMENT ==========
  else if (containsAny(userMessage, ['exercice', 'mouvement', 'entrainement', 'workout', 'seance', 'training'])) {
    reply = `🏋️ **Bibliothèque d'exercices Harmonith**

Tu as accès à une bibliothèque complète d'exercices classés par :

📋 **Catégories principales :**
• 💪 Musculation (pectoraux, dos, jambes, bras...)
• 🏃 Cardio (course, vélo, natation, HIIT...)
• 🧘 Stretching & Yoga
• 🥊 Sports de combat et entraînement fonctionnel

✅ **Pour chaque exercice :**
• Description détaillée de l'exécution
• Vidéo de démonstration
• Muscles ciblés
• Conseils de sécurité
• Variantes (débutant, intermédiaire, avancé)

Tu cherches un type d'exercice en particulier ? Je peux te guider ! 🎯`;
  }

  // ========== MOTIVATION ==========
  else if (containsAny(userMessage, ['motiv', 'encouragement', 'flemme', 'pas envie', 'fatigue', 'courage', 'demotiv', 'envie'])) {
    reply = `💪 **Boost de motivation incoming !**

Tu te sens démotivé ? C'est normal, ça arrive à tout le monde ! Voici quelques tips :

🔥 **Techniques anti-flemme :**
• Commence par 5 minutes - souvent, tu continueras après
• Mets ta tenue de sport, ça te mettra dans l'ambiance
• Écoute une playlist ultra motivante 🎵
• Rappelle-toi POURQUOI tu as commencé
• Visualise comment tu te sentiras APRÈS la séance

💡 **Astuce Harmonith :**
• Trouve un partenaire via le Matching - c'est plus difficile de zapper quand quelqu'un compte sur toi !
• Regarde tes progrès sur le Dashboard
• Vise un badge ou un objectif du Leaderboard

🎯 **Citation du jour :**
"Le seul entraînement raté, c'est celui que tu n'as pas fait."

Allez, let's go champion ! Tu vas le regretter si tu ne le fais pas, mais jamais si tu le fais ! 🔥💪`;
  }

  // ========== NUTRITION ==========
  else if (containsAny(userMessage, ['nutrition', 'manger', 'alimentation', 'regime', 'calorie', 'nourriture', 'diet', 'repas'])) {
    reply = `🍎 **Nutrition & Harmonith**

Harmonith se concentre principalement sur le fitness, mais on a quelques outils nutritionnels :

✅ **Ce qu'on propose :**
• Calculateur de calories journalières recommandées
• Estimation des calories brûlées par séance
• Conseils généraux d'alimentation équilibrée

🥗 **Principes de base :**
• Protéines : 1,6-2g par kg de poids corporel (pour la masse musculaire)
• Glucides : Source d'énergie principale pour l'entraînement
• Lipides : 20-30% de ton apport calorique total
• Hydratation : 2-3L d'eau par jour

⚠️ **Important :**
Pour un plan nutritionnel personnalisé, je recommande de consulter un nutritionniste ou diététicien qualifié.

💡 **Astuce :** Utilise notre calculateur de calories dans la section "Outils" ! 📊`;
  }

  // ========== MUSCLES SPÉCIFIQUES ==========
  else if (containsAny(userMessage, ['pectoraux', 'pecs', 'poitrine', 'chest', 'torse'])) {
    reply = `💪 **Entraînement des Pectoraux**

Dans la bibliothèque d'exercices, retrouve les meilleurs mouvements pour les pecs :

🏋️ **Exercices recommandés :**
• Développé couché (barbell bench press)
• Pompes et variantes
• Écarté aux haltères
• Dips pour les pecs
• Développé incliné

📊 **Programme type :**
• 3-4 exercices par séance
• 8-12 répétitions par série
• 3-4 séries par exercice
• 2-3 séances par semaine

💡 **Conseil pro :** Varie les angles (incliné, décliné, plat) pour un développement complet !

Retrouve tous les détails avec vidéos dans la section Exercices 🎯`;
  }
  else if (containsAny(userMessage, ['dos', 'dorsaux', 'lats', 'back', 'tractions'])) {
    reply = `🔥 **Entraînement du Dos**

Un dos massif, c'est la base d'un physique équilibré !

🏋️ **Exercices essentiels :**
• Tractions (pull-ups) - le roi du dos
• Rowing barre / haltères
• Tirage vertical
• Soulevé de terre (deadlift)
• Tirage horizontal

📊 **Structure d'entraînement :**
• 4-5 exercices par séance
• 8-12 répétitions
• Focus sur la connexion esprit-muscle
• 2 séances par semaine minimum

🎯 **Astuce :** Tire avec tes coudes, pas avec tes mains, pour mieux activer les dorsaux !

Tous les tutos vidéos sont dans la bibliothèque d'exercices 💪`;
  }
  else if (containsAny(userMessage, ['jambes', 'cuisses', 'legs', 'quadri', 'squat', 'mollets'])) {
    reply = `🦵 **Entraînement des Jambes**

Never skip leg day ! 💀

🏋️ **Exercices de base :**
• Squat (roi des exercices)
• Presse à cuisses
• Fentes (lunges)
• Leg curl & leg extension
• Soulevé de terre jambes tendues

📊 **Programme type :**
• 5-6 exercices par séance
• 10-15 répétitions (les jambes aiment le volume)
• 4 séries par exercice
• 1-2 séances par semaine

💡 **Fun fact :** Les jambes représentent 50% de ta masse musculaire. Les entraîner booste ta production d'hormones de croissance !

Check les vidéos détaillées dans l'app 🔥`;
  }

  // ========== OBJECTIFS ==========
  else if (containsAny(userMessage, ['perte de poids', 'maigrir', 'perdre', 'secher', 'mincir', 'kilos', 'weight loss'])) {
    reply = `🔥 **Perte de poids & Sèche**

Pour perdre du poids efficacement :

📊 **Principe de base :**
• Déficit calorique : consomme moins de calories que tu n'en dépenses
• Vise 300-500 kcal de déficit par jour

🏃 **Entraînement recommandé :**
• Cardio : 3-5x par semaine (course, vélo, HIIT)
• Musculation : 2-3x par semaine (maintenir la masse musculaire)
• Étirements : pour la récupération

💡 **Tips Harmonith :**
• Utilise le calculateur de calories dans l'app
• Track tes séances pour voir ta progression
• Le Dashboard Premium te montre tes calories brûlées

⚠️ **Important :** Vise 0,5-1 kg par semaine maximum pour une perte durable !

Tu peux le faire ! 💪🔥`;
  }
  else if (containsAny(userMessage, ['prise de masse', 'muscle', 'grossir', 'prendre du poids', 'muscler', 'mass', 'gonfler'])) {
    reply = `💪 **Prise de Masse Musculaire**

Tu veux prendre du muscle ? Voici le plan :

📊 **Principes fondamentaux :**
• Surplus calorique : +300-500 kcal par jour
• Protéines : 1,8-2g par kg de poids corporel
• Entraînement en force : 8-12 répétitions

🏋️ **Programme type :**
• Musculation : 4-5x par semaine
• Exercices composés (squat, développé couché, deadlift)
• Progression progressive (surcharge progressive)
• Repos : 7-9h de sommeil par nuit

💡 **Astuce Harmonith :**
• Utilise le calculateur 1RM pour suivre ta force
• Track toutes tes séances en Premium
• Suis ta progression sur le Dashboard

🎯 **Patience :** Vise 0,5-1kg par mois de muscle de qualité !

Let's grow ! 💪🔥`;
  }

  // ========== DÉBUTANT ==========
  else if (msg.includes('débutant') || msg.includes('commencer') || msg.includes('débuter') || msg.includes('nouveau')) {
    reply = `🌱 **Bienvenue dans le monde du fitness !**

Félicitations pour ta décision de commencer ! 🎉

📋 **Par où commencer :**
1. **Semaine 1-2 :** Familiarise-toi avec les mouvements basiques
2. **Semaine 3-4 :** Augmente progressivement l'intensité
3. **Mois 2+ :** Établis une routine régulière

🏋️ **Programme débutant type :**
• 3 séances par semaine (lundi, mercredi, vendredi)
• Corps complet (full body)
• 30-45 minutes par séance
• Focus sur la technique avant la charge

💡 **Conseils essentiels :**
• Échauffe-toi toujours (5-10 min)
• Commence léger, maîtrise la forme
• Écoute ton corps, évite les blessures
• La régularité > l'intensité au début

🎯 **Harmonith t'accompagne :**
• Vidéos explicatives pour chaque exercice
• Variantes débutant disponibles
• Calculateurs pour personnaliser ton parcours

Tu as toutes les cartes en main ! Allez, c'est parti ! 🚀💪`;
  }

  // ========== TEMPS D'ENTRAÎNEMENT ==========
  else if (msg.includes('combien de temps') || msg.includes('durée') || msg.includes('minutes') || msg.includes('heures')) {
    reply = `⏱️ **Durée d'entraînement optimale**

Ça dépend de ton niveau et tes objectifs :

🏋️ **Musculation :**
• Débutant : 30-45 minutes
• Intermédiaire : 45-60 minutes
• Avancé : 60-90 minutes

🏃 **Cardio :**
• HIIT : 15-30 minutes
• Cardio modéré : 30-60 minutes
• Endurance : 60+ minutes

💡 **Règle d'or :**
Plus long ≠ meilleur ! L'intensité compte plus que la durée.

🎯 **Recommandation générale :**
• 3-5 séances par semaine
• 45-60 minutes par séance
• + 5-10 min d'échauffement
• + 5-10 min d'étirements

⚡ **Astuce Harmonith :** Le chronomètre intégré t'aide à tracker ton temps d'entraînement !

Qualité > Quantité ! 💪`;
  }

  // ========== RÉCUPÉRATION & SOMMEIL ==========
  else if (msg.includes('repos') || msg.includes('récupération') || msg.includes('sommeil') || msg.includes('dormir') || msg.includes('courbatures')) {
    reply = `😴 **Récupération & Repos**

La récupération, c'est où le muscle se construit vraiment !

🛌 **Sommeil :**
• 7-9 heures par nuit minimum
• Le sommeil = hormone de croissance
• Mauvais sommeil = mauvaise récupération

⏸️ **Jours de repos :**
• Minimum 1-2 jours complets par semaine
• Repos actif possible (marche, yoga léger)
• Écoute ton corps !

💆 **Techniques de récupération :**
• Étirements post-séance
• Hydratation (2-3L d'eau/jour)
• Alimentation adaptée (protéines + glucides)
• Bain chaud ou douche froide
• Massage ou foam roller

🩹 **Courbatures :**
• Normal après entraînement intense
• Disparaissent en 24-72h
• Léger mouvement aide (marche, vélo doux)
• Ne t'entraîne pas à fond sur un muscle courbaturé

💡 **Astuce :** Sur Harmonith, la heatmap Premium te montre si tu t'entraînes trop ou pas assez ! 📊

Le repos fait partie de l'entraînement ! 💪😴`;
  }

  // ========== BLESSURES ==========
  else if (msg.includes('blessure') || msg.includes('douleur') || msg.includes('mal') || msg.includes('tendinite')) {
    reply = `🩹 **Prévention des blessures**

⚠️ **IMPORTANT :** En cas de douleur persistante, consulte un médecin ou kiné !

🛡️ **Prévention :**
• Toujours s'échauffer correctement
• Maîtrise la technique avant d'augmenter la charge
• Progression progressive (augmente de 5-10% max par semaine)
• Écoute ton corps - douleur ≠ normal
• Étire-toi régulièrement

🚨 **Signes d'alerte :**
• Douleur aiguë ou soudaine
• Douleur qui persiste après 48-72h
• Gonflement ou rougeur
• Perte de mobilité

💡 **Douleur vs Inconfort :**
• Inconfort musculaire = OK (courbatures)
• Douleur articulaire = PAS OK
• Douleur qui empire = STOP immédiatement

🎯 **En cas de blessure mineure :**
1. RICE : Repos, Glace, Compression, Élévation
2. Arrête l'exercice concerné
3. Laisse le temps de guérir complètement

⚠️ Je ne peux pas remplacer un avis médical. En cas de doute, consulte un professionnel !

Prends soin de toi ! 💪`;
  }

  // ========== CALCULATEURS ==========
  else if (msg.includes('imc') || msg.includes('indice de masse')) {
    reply = `📊 **Calculateur IMC**

L'IMC (Indice de Masse Corporelle) évalue ton poids par rapport à ta taille.

📐 **Formule :**
IMC = Poids (kg) / Taille² (m)

📊 **Interprétation :**
• < 18,5 : Insuffisance pondérale
• 18,5 - 24,9 : Poids normal
• 25 - 29,9 : Surpoids
• > 30 : Obésité

⚠️ **Limites de l'IMC :**
L'IMC ne prend pas en compte la masse musculaire. Un athlète très musclé peut avoir un IMC élevé tout en étant en excellente forme !

💡 **Harmonith :** Utilise notre calculateur IMC dans la section Outils pour un calcul instantané !

L'IMC est un indicateur parmi d'autres, pas une vérité absolue ! 📊`;
  }
  else if (msg.includes('1rm') || msg.includes('charge max')) {
    reply = `🏋️ **Calculateur 1RM (Charge Maximale)**

Le 1RM = la charge maximale que tu peux soulever pour 1 seule répétition.

📊 **Pourquoi c'est utile :**
• Suivre ta progression en force
• Programmer tes charges d'entraînement
• Te comparer avec tes perfs précédentes

💡 **Comment l'utiliser :**
• Rentre un poids que tu peux faire pour X répétitions
• L'outil estime ton 1RM
• Exemple : 80kg x 8 reps ≈ 100kg de 1RM

🎯 **Programmation basée sur 1RM :**
• Force : 80-90% du 1RM (3-6 reps)
• Hypertrophie : 70-80% (8-12 reps)
• Endurance : 60-70% (12-20 reps)

⚠️ **Sécurité :** Ne teste JAMAIS ton vrai 1RM seul. Utilise toujours notre calculateur !

Retrouve le calculateur 1RM dans la section Outils 💪`;
  }

  // ========== ÉQUIPEMENT ==========
  else if (msg.includes('équipement') || msg.includes('matériel') || msg.includes('haltères') || msg.includes('banc')) {
    reply = `🏋️ **Équipement & Matériel**

Harmonith propose des exercices pour TOUS les niveaux d'équipement :

🏡 **Sans équipement (poids du corps) :**
• Pompes, tractions, squats, fentes
• Planche, burpees, mountain climbers
• Parfait pour débuter !

🏋️ **Équipement de base :**
• Haltères ajustables (très polyvalent)
• Tapis de sol
• Barre de traction
• Élastiques de résistance

🏢 **Salle de sport :**
• Machines guidées
• Poids libres (barres, disques)
• Équipements cardio
• Accès à tout !

💡 **Astuce Harmonith :**
Dans chaque exercice, on propose des alternatives selon ton équipement disponible !

🎯 **Tu débutes :** Commence au poids du corps, tu progresseras déjà énormément !

Pas besoin de beaucoup pour commencer ! 💪`;
  }

  // ========== HIIT ==========
  else if (msg.includes('hiit') || msg.includes('interval') || msg.includes('cardio intense')) {
    reply = `🔥 **HIIT - High Intensity Interval Training**

Le HIIT = alternance entre efforts intenses et récupération courte. Super efficace !

⚡ **Avantages :**
• Brûle des calories APRÈS l'entraînement (effet afterburn)
• Séances courtes (15-30 min)
• Améliore le cardio rapidement
• Préserve la masse musculaire

📊 **Exemple de séance HIIT :**
• Échauffement : 5 min
• 30 sec sprint / 30 sec repos x 10-15 rounds
• Récupération : 5 min
• Total : 20-30 minutes

🏃 **Exercices possibles :**
• Sprint, burpees, jumping jacks
• Mountain climbers, squat jumps
• Vélo stationnaire, rameur

⚠️ **Attention :**
• Pas pour les débutants complets
• Max 2-3x par semaine
• Demande beaucoup de récupération

Retrouve des séances HIIT complètes dans la bibliothèque d'exercices ! 🔥💪`;
  }

  // ========== YOGA & STRETCHING ==========
  else if (msg.includes('yoga') || msg.includes('stretch') || msg.includes('souplesse') || msg.includes('étirement')) {
    reply = `🧘 **Yoga & Stretching**

La souplesse et la mobilité sont essentielles pour éviter les blessures !

🌟 **Bienfaits du stretching :**
• Réduit les courbatures
• Améliore la mobilité articulaire
• Prévient les blessures
• Réduit le stress
• Améliore la posture

📋 **Types d'étirements :**
• **Statiques :** Tenir 30-60 sec (après l'entraînement)
• **Dynamiques :** Mouvements contrôlés (avant l'entraînement)
• **Yoga :** Combine respiration, force et souplesse

⏰ **Quand s'étirer :**
• Avant : étirements dynamiques (5 min)
• Après : étirements statiques (10 min)
• Séance dédiée : 20-30 min (1-2x par semaine)

💡 **Harmonith :**
On a toute une section Yoga & Stretching avec des routines guidées :
• Yoga débutant
• Stretching post-workout
• Mobilité articulaire
• Relaxation et respiration

Souplesse = Performance ! 🧘‍♂️✨`;
  }

  // ========== QUESTIONS DRÔLES ==========
  else if (msg.includes('😂') || msg.includes('😅') || msg.includes('lol') || msg.includes('mdr')) {
    reply = "😄 Content de te voir de bonne humeur ! Ça te tente une petite séance de fitness pour garder ce sourire ? Allez, on transpire et on rigole ! 💪😂";
  }
  else if (msg.includes('superman') || msg.includes('hulk') || msg.includes('super-héros')) {
    reply = `🦸‍♂️ Devenir un super-héros ? Challenge accepted !

Avec Harmonith, on ne promet pas de te donner des super-pouvoirs... MAIS :

💪 Un corps d'acier comme Superman
🔥 L'énergie de Flash
🏋️ La force de Hulk (version contrôlée)
🧘 La zen-attitude de Wonder Woman

Ton costume de super-héros ? Ta tenue de sport.
Ton super-pouvoir ? La régularité.

Let's make you a hero ! 🦸‍♀️💪🔥`;
  }
  else if (msg.includes('pizza') || msg.includes('burger') || msg.includes('mcdonald')) {
    reply = `🍕 Alors... la pizza et les burgers, c'est délicieux, on ne va pas se mentir ! 😋

💡 **Balance 80/20 :**
• 80% du temps : alimentation clean et équilibrée
• 20% du temps : enjoy tes plaisirs sans culpabilité !

Un cheat meal de temps en temps, c'est OK (et même bon pour le mental) ! 🍔

🔥 **Fun fact :** Une grosse pizza = environ 2h de cardio intense. Ça calme, hein ? 😅

L'équilibre, c'est la clé ! Tu peux tout à fait manger une pizza ET être fit ! 💪🍕`;
  }

  // ========== BUGS & PROBLÈMES TECHNIQUES ==========
  else if (containsAny(userMessage, ['bug', 'erreur', 'marche pas', 'probleme', 'crash', 'fonctionne pas', 'broken', 'casse', 'plante'])) {
    reply = `😕 Oh non, désolé pour ce problème !

Pour t'aider au mieux, j'aurais besoin de plus d'informations :

🔍 **Détails à préciser :**
• Sur quelle page/section le problème se produit-il ?
• Quel message d'erreur vois-tu (si applicable) ?
• Le problème se produit sur mobile ou ordinateur ?
• As-tu essayé de rafraîchir la page (F5) ?

💡 **Solutions rapides :**
• Vide ton cache navigateur
• Essaie en navigation privée
• Vérifie ta connexion internet
• Essaie de te déconnecter/reconnecter

Si le problème persiste, je peux te mettre en contact avec notre équipe technique qui pourra investiguer en profondeur. Tu veux que je fasse ça ? 🛠️`;
  }

  // ========== PAIEMENT (escalade immédiate) ==========
  else if (containsAny(userMessage, ['paiement', 'carte', 'facturation', 'remboursement', 'facture', 'paye', 'cb', 'stripe'])) {
    reply = "💳 Je vais te mettre en contact avec notre équipe support pour t'aider avec ton paiement. Ils pourront accéder à ton compte de manière sécurisée. Un instant... ⏳";
  }

  // ========== MOT DE PASSE OUBLIÉ ==========
  else if (containsAny(userMessage, ['mdp', 'mot de passe', 'password', 'oubli', 'reinitialis', 'reset', 'pw', 'pass'])) {
    reply = `🔐 **Mot de passe oublié ? Pas de panique !**

Voici comment réinitialiser ton mot de passe :

📋 **Procédure simple :**
1. Va sur la page de connexion (http://localhost:5173/)
2. Clique sur **"Mot de passe oublié ?"** sous le formulaire
3. Entre l'adresse email associée à ton compte
4. Tu recevras un email avec un lien de réinitialisation
5. Clique sur le lien (valide 1 heure)
6. Crée ton nouveau mot de passe

✅ **Si tu ne reçois pas l'email :**
• Vérifie tes spams/courriers indésirables
• Assure-toi d'utiliser le bon email
• Attends 2-3 minutes (ça peut prendre un peu de temps)
• Si toujours rien, je peux te mettre en contact avec le support

🔒 **Sécurité :**
Ton nouveau mot de passe doit contenir :
• Au moins 8 caractères
• Une majuscule et une minuscule
• Un chiffre
• Un caractère spécial recommandé

Tu as d'autres problèmes de connexion ? Dis-moi ! 😊`;
  }

  // ========== CONNEXION / COMPTE ==========
  else if (containsAny(userMessage, ['connecter', 'connexion', 'login', 'se connecter', 'log in', 'acceder'])) {
    reply = `🔑 **Connexion à Harmonith**

Pour te connecter :

📋 **Étapes :**
1. Va sur http://localhost:5173/
2. Clique sur "Se connecter" en haut à droite
3. Entre ton email et mot de passe
4. Clique sur "Connexion"

❓ **Problèmes courants :**

🔴 **"Email ou mot de passe incorrect" :**
• Vérifie que tu utilises le bon email
• Assure-toi de ne pas avoir activé Caps Lock
• Clique sur "Mot de passe oublié" pour réinitialiser

🔴 **"Compte non vérifié" :**
• Vérifie ta boîte mail (+ spams)
• Clique sur le lien de vérification
• Le lien expire après 24h

🔴 **"Impossible de se connecter" :**
• Vide le cache de ton navigateur
• Essaie en navigation privée
• Vérifie ta connexion internet

💡 **Première visite ?** Crée un compte gratuitement ! Clique sur "S'inscrire" 🚀

Besoin d'aide supplémentaire ? Je suis là ! 💪`;
  }

  // ========== INSCRIPTION ==========
  else if (containsAny(userMessage, ['inscription', 'inscrire', 'creer compte', 'compte', 'register', 'sign up', 'nouveau compte'])) {
    reply = `🎉 **Inscription sur Harmonith**

Bienvenue ! Créer ton compte est super simple :

📋 **Étapes d'inscription :**
1. Va sur http://localhost:5173/
2. Clique sur **"S'inscrire"** en haut à droite
3. Remplis le formulaire :
   • Email valide
   • Mot de passe sécurisé (8+ caractères)
   • Pseudo unique
   • Prénom
4. Accepte les conditions d'utilisation
5. Clique sur "Créer mon compte"

📧 **Vérification email :**
• Tu recevras un email de confirmation
• Clique sur le lien pour activer ton compte
• Le lien expire après 24h
• Vérifie tes spams si tu ne le vois pas

✅ **Après inscription :**
• Tu as accès à toutes les fonctionnalités gratuites
• Tu peux essayer Premium gratuitement pendant 7 jours
• Configure ton profil pour le matching

🆓 **C'est 100% gratuit !** Aucune carte bancaire requise pour commencer.

Prêt à rejoindre la communauté Harmonith ? Let's go ! 💪🚀`;
  }

  // ========== VÉRIFICATION EMAIL ==========
  else if (containsAny(userMessage, ['verification', 'verifier', 'activer', 'activation', 'email', 'confirmer', 'confirmation', 'valider'])) {
    reply = `📧 **Vérification de ton email**

Pour activer ton compte, tu dois vérifier ton email :

✅ **Procédure normale :**
1. Consulte ta boîte mail (celle utilisée lors de l'inscription)
2. Cherche un email de "Harmonith" ou "noreply@harmonith.com"
3. Clique sur le lien "Vérifier mon email"
4. Tu seras redirigé et ton compte sera activé !

❌ **Tu ne reçois pas l'email ?**

💡 **Solutions :**
• **Vérifie tes spams/courriers indésirables** (90% du temps, il est là)
• Attends 5-10 minutes (délai de livraison)
• Vérifie que tu as bien utilisé le bon email
• Ajoute noreply@harmonith.com à tes contacts

🔄 **Renvoyer l'email de vérification :**
1. Va sur la page de connexion
2. Clique sur "Renvoyer l'email de vérification"
3. Entre ton email
4. Un nouveau lien sera envoyé

⏰ **Important :** Le lien de vérification expire après 24h. Si expiré, demande un nouveau lien.

Toujours rien ? Je peux contacter le support pour toi ! 🛠️`;
  }

  // ========== ANNULATION ==========
  else if (containsAny(userMessage, ['annuler', 'resilier', 'desabonner', 'cancel', 'arreter', 'stopper abonnement'])) {
    reply = `🔄 **Annulation de l'abonnement Premium**

Pas de souci, tu peux annuler à tout moment :

📋 **Procédure :**
1. Va sur ton Dashboard
2. Clique sur ton profil en haut à droite
3. Sélectionne "Gérer mon abonnement"
4. Clique sur "Annuler l'abonnement"

✅ **Important à savoir :**
• Tu garderas l'accès Premium jusqu'à la fin de ta période payée
• Tes données restent sauvegardées (tu ne perds rien !)
• Tu peux te réabonner à tout moment
• Aucune pénalité ou frais d'annulation

Tu rencontres un problème pour annuler ? Je peux t'aider ! 😊`;
  }

  // ========== PROFIL ==========
  else if (containsAny(userMessage, ['profil', 'photo', 'pseudo', 'modifier', 'changer', 'avatar', 'bio', 'profile'])) {
    reply = `👤 **Gestion de ton profil Harmonith**

🎨 **Personnalise ton profil :**
1. Va dans les Paramètres (icône ⚙️)
2. Sélectionne "Mon profil"
3. Tu peux modifier :
   • Photo de profil
   • Pseudo
   • Bio
   • Objectifs fitness
   • Niveau d'expérience
   • Préférences d'entraînement

💡 **Pourquoi c'est important :**
• Le matching utilise tes infos pour trouver des partenaires compatibles
• Un profil complet = meilleurs matchs
• La communauté peut mieux te connaître

✨ **Premium :** Plus d'options de personnalisation (badge, thème, etc.)

Créer un profil qui te ressemble, c'est le début de l'aventure ! 🚀`;
  }

  // ========== HEATMAP ==========
  else if (msg.includes('heatmap') || msg.includes('assiduité') || msg.includes('régularité')) {
    reply = `📅 **Heatmap d'activité Harmonith**

La heatmap visualise ton assiduité d'entraînement sur l'année :

🎨 **Comment ça marche :**
• Chaque jour d'entraînement = case colorée
• Plus tu t'entraînes, plus c'est intense (du vert clair au vert foncé)
• Voir les trous = jours sans entraînement

💡 **Pourquoi c'est motivant :**
• Visualise ta régularité en un coup d'œil
• Repère tes périodes de creux
• Challenge-toi à garder la chaîne verte !
• Compare mois par mois

🔥 **Objectif :** Essaie de garder au moins 3-4 jours verts par semaine !

✨ Fonctionnalité Premium - Essaie 7 jours gratuitement !

La régularité bat l'intensité. Every. Single. Time. 💪📊`;
  }

  // ========== SÉANCES SAUVEGARDÉES ==========
  else if (msg.includes('sauvegarder') || msg.includes('historique') || msg.includes('séances passées')) {
    reply = `💾 **Sauvegarde de séances**

📊 **Version Gratuite :**
• Tu peux faire des séances en temps réel
• MAIS elles ne sont pas sauvegardées
• Idéal pour tester l'app !

⭐ **Version Premium :**
• Sauvegarde ILLIMITÉE de toutes tes séances
• Historique complet accessible à tout moment
• Statistiques détaillées (volume, intensité, calories...)
• Export de tes données

💡 **Ce que tu peux faire avec l'historique :**
• Refaire une ancienne séance
• Voir ta progression sur plusieurs mois
• Analyser ce qui fonctionne le mieux pour toi
• Partager tes performances

🎁 Premium = 3,99€/mois avec 7 jours gratuits. Ça vaut le coup si tu t'entraînes régulièrement ! 💪`;
  }

  // ========== SUPPRIMER COMPTE ==========
  else if (msg.includes('supprimer') || msg.includes('suppression') || msg.includes('effacer') || msg.includes('delete')) {
    reply = `⚠️ **Suppression**

Tu veux supprimer quelque chose ? Précise ce que tu veux supprimer :

🗑️ **Options :**
• Supprimer ton compte Harmonith
• Supprimer une conversation chat
• Supprimer l'historique de séances

💬 **Supprimer ton compte ?**

❌ **Conséquences :**
• Toutes tes données seront définitivement supprimées
• Historique de séances perdu
• Badges et progression effacés
• Matchs et conversations supprimés
• Action irréversible

📋 **Procédure :**
1. Va dans Paramètres ⚙️
2. Clique sur "Mon compte"
3. Défile vers le bas
4. Clique sur "Supprimer mon compte"
5. Confirme ton mot de passe
6. Confirme la suppression

💡 **Alternatives :**
• **Pause Premium :** Annule juste ton abonnement, garde tes données
• **Désactiver les notifications :** Reste inscrit mais en mode silencieux
• **Compte gratuit :** Repasse en version gratuite

⚠️ Si tu supprimes ton compte, tu devras créer un nouveau compte pour revenir.

Tu es sûr de vouloir partir ? 😢 On peut t'aider autrement ?`;
  }

  // ========== CHANGER EMAIL ==========
  else if (msg.includes('changer') && msg.includes('email') || msg.includes('modifier') && msg.includes('email')) {
    reply = `📧 **Changer ton adresse email**

Tu veux modifier l'email associé à ton compte :

📋 **Procédure :**
1. Va dans Paramètres ⚙️
2. Clique sur "Mon compte"
3. Section "Email"
4. Clique sur "Modifier"
5. Entre ton nouveau email
6. Confirme avec ton mot de passe
7. Vérifie le nouvel email (lien de confirmation)

✅ **Important :**
• Tu devras vérifier le nouvel email pour valider le changement
• Ton ancien email restera actif jusqu'à la vérification
• Tu recevras une notification sur les deux emails

⚠️ **Problème ?**
Si tu n'as plus accès à ton ancien email, je peux te mettre en contact avec le support pour une vérification manuelle.

Besoin d'aide pour le changement ? Dis-moi ! 😊`;
  }

  // ========== DÉSACTIVER NOTIFICATIONS ==========
  else if (msg.includes('notification') || msg.includes('notif') || msg.includes('email') && msg.includes('stop') || msg.includes('spam')) {
    reply = `🔔 **Gestion des notifications**

Tu reçois trop d'emails ou de notifications ? On peut arranger ça !

📋 **Gérer tes notifications :**
1. Va dans Paramètres ⚙️
2. Section "Notifications"
3. Active/Désactive selon tes préférences :

📧 **Notifications par email :**
• Newsletter hebdomadaire
• Nouveaux matchs
• Messages de partenaires
• Rappels d'entraînement
• Badges débloqués
• Actualités Harmonith

🔔 **Notifications push (app) :**
• Messages reçus
• Nouveaux likes
• Rappels personnalisés
• Défis et challenges

💡 **Recommandation :**
Garde au minimum les notifications de messages pour ne pas rater tes partenaires d'entraînement !

🚫 **Se désabonner complètement :**
En bas de chaque email, tu as un lien "Se désabonner" pour stopper tous les emails.

Configure comme tu veux ! 🎯`;
  }

  // ========== SÉCURITÉ / CONFIDENTIALITÉ ==========
  else if (msg.includes('sécurité') || msg.includes('confidentialité') || msg.includes('données personnelles') || msg.includes('rgpd') || msg.includes('vie privée')) {
    reply = `🔒 **Sécurité & Confidentialité sur Harmonith**

Ta vie privée est importante pour nous !

🛡️ **Sécurité :**
• Mots de passe cryptés (hachage bcrypt)
• Connexion HTTPS sécurisée
• Authentification par token
• Aucune donnée bancaire stockée (gestion Stripe)

🔐 **Tes données personnelles :**
• Email et infos de profil
• Historique d'entraînement
• Préférences et objectifs
• Photos uploadées (profil)

✅ **Tes droits (RGPD) :**
• **Accès :** Télécharge toutes tes données
• **Rectification :** Modifie tes infos à tout moment
• **Suppression :** Supprime ton compte quand tu veux
• **Portabilité :** Exporte tes données (format JSON)

👥 **Visibilité du profil :**
• Ton profil est visible uniquement par les utilisateurs Harmonith
• Tu contrôles ce que tu partages sur ton profil public
• Les matchs voient ton profil complet
• Tu peux bloquer des utilisateurs

📊 **Données de matching :**
• On ne partage JAMAIS tes données avec des tiers
• Algorithme de matching basé sur compatibilité sportive
• Tu contrôles qui peut te contacter

💡 Pour plus d'infos : consulte notre Politique de Confidentialité dans Paramètres ⚙️

Des questions sur la protection de tes données ? 🔐`;
  }

  // ========== APPLICATION MOBILE ==========
  else if (msg.includes('app') || msg.includes('mobile') || msg.includes('télécharger') || msg.includes('ios') || msg.includes('android') || msg.includes('smartphone')) {
    reply = `📱 **Application Mobile Harmonith**

Harmonith est actuellement disponible en version web responsive !

🌐 **Version Web :**
• Accès depuis n'importe quel navigateur
• Fonctionne sur mobile, tablette et ordinateur
• Interface responsive optimisée
• Aucune installation nécessaire

📲 **Utiliser sur mobile :**
Tu peux ajouter Harmonith à ton écran d'accueil :

**Sur iPhone (Safari) :**
1. Ouvre harmonith.com sur Safari
2. Appuie sur le bouton Partager (carré avec flèche)
3. Sélectionne "Sur l'écran d'accueil"
4. Valide

**Sur Android (Chrome) :**
1. Ouvre harmonith.com sur Chrome
2. Appuie sur les 3 points (menu)
3. Sélectionne "Ajouter à l'écran d'accueil"
4. Valide

💡 **Ça ressemblera à une vraie app !**

🚀 **Application native :**
On travaille sur une app iOS et Android native. Elle arrivera bientôt avec encore plus de fonctionnalités !

En attendant, la version web est ultra performante ! 💪`;
  }

  // ========== LANGUE / TRADUCTION ==========
  else if (msg.includes('anglais') || msg.includes('english') || msg.includes('langue') || msg.includes('traduction')) {
    reply = `🌍 **Langues disponibles**

Actuellement, Harmonith est disponible uniquement en **français** 🇫🇷

🚀 **Bientôt disponible :**
On travaille sur la version multilingue avec :
• 🇬🇧 Anglais
• 🇪🇸 Espagnol
• 🇩🇪 Allemand
• 🇮🇹 Italien

📅 **Quand ?**
On prévoit le support multilingue pour les prochains mois. Inscris-toi à la newsletter pour être notifié !

💡 En attendant, l'interface est assez visuelle et intuitive même si tu ne parles pas français couramment.

Tu as besoin d'aide en anglais ? Je peux essayer de t'aider en anglais si nécessaire ! 😊`;
  }

  // ========== RÉPONSE GÉNÉRIQUE (catch-all) ==========
  else {
    reply = `👋 Salut ! Je suis l'assistant Harmonith.

Je peux t'aider avec :
• 🏋️ Entraînement et exercices
• 🤝 Matching de partenaires sportifs
• 📊 Dashboard et statistiques
• 💎 Abonnement Premium (3,99€/mois)
• 🔐 Compte et connexion
• 🛠️ Problèmes techniques

Pose-moi ta question ! 😊`;
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

    // Créer le ticket
    ticket = await escalateToHuman(userId, conversationId, lastMessage?.content || 'Demande d\'aide', reason);

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

  logger.info(`🎫 Ticket créé : ${ticket._id} pour user ${user.pseudo || user.email}`);

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
