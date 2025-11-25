const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  createCustomerPortalSession
} = require('../controllers/subscription.controller');

/**
 * IMPORTANT: La route webhook est définie directement dans server.js
 * AVANT express.json() pour recevoir le raw body nécessaire à Stripe
 */

/**
 * Routes protégées (authentification requise)
 */
router.post('/create-checkout-session', auth, createCheckoutSession);
router.get('/status', auth, getSubscriptionStatus);
router.post('/cancel', auth, cancelSubscription);
router.post('/customer-portal', auth, createCustomerPortalSession);

module.exports = router;
