const rateLimit = require('express-rate-limit');

/**
 * Rate limiter strict pour l'envoi de messages
 * Limite: 30 messages par minute par utilisateur
 */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Maximum 30 messages par minute
  message: 'Trop de messages envoyés. Veuillez patienter avant de réessayer.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  // Utiliser l'userId au lieu de l'IP pour un rate limit par utilisateur
  keyGenerator: (req) => {
    if (req.userId) return req.userId.toString();
    // Utiliser le header X-Forwarded-For ou l'IP directe
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
    return ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de messages envoyés. Veuillez patienter avant de réessayer.',
      retryAfter: 60
    });
  }
});

module.exports = { messageLimiter };