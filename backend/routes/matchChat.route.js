const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { requirePremium: premium } = require('../middlewares/subscription.middleware');
const { messageLimiter } = require('../middlewares/messageRateLimit.middleware');
const {
  getConversations,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  blockConversation,
  deleteConversation,
  getUnreadCount,
  updateConversationSettings
} = require('../controllers/matchChat.controller');

/**
 * Routes pour le chat P2P entre matches
 * Toutes les routes nécessitent authentification + abonnement Premium
 */

// Récupérer toutes les conversations
router.get('/conversations', auth, premium, getConversations);

// Récupérer uniquement le compteur de messages non lus (plus rapide)
router.get('/unread-count', auth, premium, getUnreadCount);

// Récupérer ou créer une conversation pour un match
router.get('/conversation/:matchId', auth, premium, getOrCreateConversation);

// Envoyer un message dans une conversation (avec rate limiting strict)
router.post('/:conversationId/messages', auth, premium, messageLimiter, sendMessage);

// Récupérer les messages d'une conversation
router.get('/:conversationId/messages', auth, premium, getMessages);

// Marquer les messages comme lus
router.put('/:conversationId/read', auth, premium, markAsRead);

// Supprimer un message (soft delete)
router.delete('/messages/:messageId', auth, premium, deleteMessage);

// Bloquer une conversation
router.post('/:conversationId/block', auth, premium, blockConversation);

// Supprimer une conversation complète
router.delete('/conversation/:conversationId', auth, premium, deleteConversation);

// Mettre à jour les paramètres d'une conversation
router.patch('/conversation/:conversationId/settings', auth, premium, updateConversationSettings);

module.exports = router;
