const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
  sendMessage,
  getChatHistory,
  escalateConversation
} = require('../controllers/chat.controller');

/**
 * Routes chat (authentification requise)
 */
router.post('/send', auth, sendMessage);
router.get('/history/:conversationId', auth, getChatHistory);
router.post('/escalate', auth, escalateConversation);

module.exports = router;
