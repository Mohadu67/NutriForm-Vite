/**
 * Utilitaire pour formater les réponses API de manière standardisée
 * Format uniforme: { success, data, error?, pagination? }
 */

/**
 * Crée une réponse de succès standardisée
 * @param {*} data - Les données à retourner
 * @param {Object} pagination - Optionnel: informations de pagination
 * @returns {Object} Réponse formatée
 */
function successResponse(data, pagination = null) {
  const response = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = {
      total: pagination.total || 0,
      page: pagination.page || 1,
      pageSize: pagination.pageSize || pagination.limit || 10,
      pages: pagination.pages || Math.ceil((pagination.total || 0) / (pagination.pageSize || pagination.limit || 10)),
      hasMore: pagination.hasMore !== undefined ? pagination.hasMore : false,
    };
  }

  return response;
}

/**
 * Crée une réponse d'erreur standardisée
 * @param {string} code - Code d'erreur (ex: 'validation_error', 'not_found')
 * @param {string} message - Message d'erreur lisible
 * @param {number} statusCode - Code HTTP (optionnel, pour référence)
 * @returns {Object} Réponse d'erreur formatée
 */
function errorResponse(code, message, statusCode = null) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(statusCode && { statusCode }),
    },
  };
}

/**
 * Helper pour envoyer une réponse de succès
 * @param {Object} res - Objet response Express
 * @param {*} data - Données à retourner
 * @param {number} statusCode - Code HTTP (défaut: 200)
 * @param {Object} pagination - Optionnel: informations de pagination
 */
function sendSuccess(res, data, statusCode = 200, pagination = null) {
  return res.status(statusCode).json(successResponse(data, pagination));
}

/**
 * Helper pour envoyer une réponse d'erreur
 * @param {Object} res - Objet response Express
 * @param {string} code - Code d'erreur
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP (défaut: 400)
 */
function sendError(res, code, message, statusCode = 400) {
  return res.status(statusCode).json(errorResponse(code, message, statusCode));
}

module.exports = {
  successResponse,
  errorResponse,
  sendSuccess,
  sendError,
};
