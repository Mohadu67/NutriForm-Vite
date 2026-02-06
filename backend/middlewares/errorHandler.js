const logger = require('../utils/logger');

/**
 * Middleware centralisé de gestion des erreurs
 * Standardise toutes les réponses d'erreur de l'API
 */
function errorHandler(err, req, res, next) {
  // Log l'erreur avec le logger centralisé
  logger.error('Error handled by middleware:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Déterminer le code HTTP
  const statusCode = err.statusCode || err.status || 500;

  // Déterminer le code d'erreur et le message
  let errorCode = err.code || 'server_error';
  let errorMessage = err.message || 'Une erreur interne est survenue';

  // Gestion des erreurs spécifiques MongoDB
  if (err.name === 'ValidationError') {
    errorCode = 'validation_error';
    errorMessage = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
  } else if (err.name === 'CastError') {
    errorCode = 'invalid_id';
    errorMessage = 'ID invalide';
  } else if (err.code === 11000) {
    errorCode = 'duplicate_key';
    errorMessage = 'Une entrée avec ces valeurs existe déjà';
  }

  // Gestion des erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    errorCode = 'invalid_token';
    errorMessage = 'Token invalide';
  } else if (err.name === 'TokenExpiredError') {
    errorCode = 'token_expired';
    errorMessage = 'Token expiré';
  }

  // Ne pas exposer les détails internes en production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorMessage = 'Une erreur interne est survenue';
  }

  // Envoyer la réponse standardisée
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'route_not_found';
  next(error);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
