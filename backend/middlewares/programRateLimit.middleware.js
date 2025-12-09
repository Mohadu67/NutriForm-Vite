const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger.js');

const createProgramLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Trop de programmes créés. Réessayez dans 1 heure.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
  keyGenerator: (req) => req.user?.id || 'anonymous',
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour création programme - User: ${req.user?.id}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop de programmes créés. Réessayez dans 1 heure.'
    });
  }
});

const proposeProgramLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: 'Trop de propositions envoyées. Réessayez demain.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
  keyGenerator: (req) => req.user?.id || 'anonymous',
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour proposition - User: ${req.user?.id}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop de propositions envoyées. Réessayez demain.'
    });
  }
});

const rateProgramLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Trop de notes envoyées. Réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
  keyGenerator: (req) => req.user?.id || 'anonymous',
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour rating - User: ${req.user?.id}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop de notes envoyées. Réessayez plus tard.'
    });
  }
});

const favoriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Trop d\'actions sur les favoris. Réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
  keyGenerator: (req) => req.user?.id || 'anonymous',
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour favoris - User: ${req.user?.id}`);
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Trop d\'actions sur les favoris. Réessayez plus tard.'
    });
  }
});

const modifyProgramLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Trop de modifications. Réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
  keyGenerator: (req) => req.user?.id || 'anonymous',
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
