const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
  createCheckoutSession,
  handleWebhook,
  getSubscriptionStatus,
  cancelSubscription,
  createCustomerPortalSession
} = require('../controllers/subscription.controller');

/**
 * IMPORTANT: Le webhook doit recevoir le raw body (pas de JSON parsing)
 * Configuré dans server.js avec express.raw({ type: 'application/json' })
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

/**
 * Routes protégées (authentification requise)
 */
router.post('/create-checkout-session', auth, createCheckoutSession);
router.get('/status', auth, getSubscriptionStatus);
router.post('/cancel', auth, cancelSubscription);
router.post('/customer-portal', auth, createCustomerPortalSession);

module.exports = router;
