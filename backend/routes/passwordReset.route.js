const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { requestPasswordReset, verifyResetToken, resetPassword } = require('../controllers/passwordReset.controller');

// Rate limiting pour prévenir spam et énumération d'utilisateurs
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 tentatives
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Trop de tentatives de réinitialisation. Veuillez réessayer dans 15 minutes.'
    });
  }
});

router.post('/forgot-password', resetLimiter, requestPasswordReset);
router.get('/reset-password/validate', verifyResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;