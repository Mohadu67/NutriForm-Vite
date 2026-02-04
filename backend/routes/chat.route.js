const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { messageLimiter } = require('../middlewares/messageRateLimit.middleware');
const {
  sendMessage,
  getChatHistory,
  escalateConversation,
  getAIConversations,
  deleteAIConversation,
  resolveTicket
} = require('../controllers/chat.controller');

/**
 * Routes chat (authentification requise)
 */
router.post('/send', auth, messageLimiter, sendMessage);
router.get('/history/:conversationId', auth, getChatHistory);
router.post('/escalate', auth, escalateConversation);

// Gestion des conversations IA
router.get('/ai-conversations', auth, getAIConversations);
router.delete('/ai-conversation/:conversationId', auth, deleteAIConversation);

// Résolution de ticket (auto-supprime la conversation)
router.post('/resolve-ticket/:ticketId', auth, resolveTicket);

module.exports = router;
