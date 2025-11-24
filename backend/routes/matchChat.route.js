const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { requirePremium: premium } = require('../middlewares/subscription.middleware');
const {
  getConversations,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  blockConversation,
  deleteConversation
} = require('../controllers/matchChat.controller');

/**
 * Routes pour le chat P2P entre matches
 * Toutes les routes nécessitent authentification + abonnement Premium
 */

// Récupérer toutes les conversations
router.get('/conversations', auth, premium, getConversations);

// Récupérer ou créer une conversation pour un match
router.get('/conversation/:matchId', auth, premium, getOrCreateConversation);

// Envoyer un message dans une conversation
router.post('/:conversationId/messages', auth, premium, sendMessage);

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

module.exports = router;
