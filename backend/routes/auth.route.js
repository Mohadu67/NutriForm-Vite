const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const auth = require('../middlewares/auth.middleware');
const verifyCaptcha = require('../middlewares/recaptcha.middleware');
const { login, register, me, updateProfile, changePassword, logout, resendVerificationEmail, getWsToken, getNotificationPreferences, updateNotificationPreferences } = require('../controllers/auth.controller.js');

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 tentatives
  skipSuccessfulRequests: true, // Ne compte que les échecs (status 4xx/5xx)
  skipFailedRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    });
  }
});

// Rate limiting pour le renvoi d'email de vérification
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Max 3 tentatives par heure
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Trop de tentatives. Veuillez réessayer dans 1 heure.'
    });
  }
});

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, verifyCaptcha, register);
router.post('/resend-verification', resendLimiter, resendVerificationEmail);
router.post('/logout', logout);
router.get('/me', auth, me);
router.get('/ws-token', auth, getWsToken); // Token pour WebSocket
router.put('/update-profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

// Preferences de notifications
router.get('/notification-preferences', auth, getNotificationPreferences);
router.put('/notification-preferences', auth, updateNotificationPreferences);

module.exports = router;
