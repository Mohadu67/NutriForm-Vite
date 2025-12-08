const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger.js');

/**
 * Rate limiter pour la création de programmes
 * Limite: 5 programmes par heure par utilisateur
 */
const createProgramLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  message: 'Trop de programmes créés. Réessayez dans 1 heure.',
  standardHeaders: true,
  legacyHeaders: false,
  // Utiliser userId comme clé (au lieu de IP)
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour création programme - User: ${req.user?.id}, IP: ${req.ip}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop de programmes créés. Réessayez dans 1 heure.'
    });
  }
});

/**
 * Rate limiter pour les propositions au public
 * Limite: 3 propositions par jour par utilisateur
 */
const proposeProgramLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 heures
  max: 3,
  message: 'Trop de propositions envoyées. Réessayez demain.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour proposition - User: ${req.user?.id}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop de propositions envoyées. Réessayez demain.'
    });
  }
});

/**
 * Rate limiter pour les notes/ratings
 * Limite: 10 ratings par heure par utilisateur
 */
const rateProgramLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  message: 'Trop de notes envoyées. Réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour rating - User: ${req.user?.id}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop de notes envoyées. Réessayez plus tard.'
    });
  }
});

/**
 * Rate limiter pour les favoris
 * Limite: 20 actions (add/remove) par heure
 */
const favoriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  message: 'Trop d\'actions sur les favoris. Réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour favoris - User: ${req.user?.id}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop d\'actions sur les favoris. Réessayez plus tard.'
    });
  }
});

/**
 * Rate limiter général pour updates/deletes
 * Limite: 30 modifications par heure par utilisateur
 */
const modifyProgramLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 30,
  message: 'Trop de modifications. Réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour modifications - User: ${req.user?.id}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop de modifications. Réessayez plus tard.'
    });
  }
});

module.exports = {
  createProgramLimiter,
  proposeProgramLimiter,
  rateProgramLimiter,
  favoriteLimiter,
  modifyProgramLimiter
};
