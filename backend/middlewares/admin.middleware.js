const authMiddleware = require('./auth.middleware');

/**
 * Middleware pour vérifier que l'utilisateur est admin
 * Doit être utilisé APRÈS authMiddleware
 */
async function adminMiddleware(req, res, next) {
  // D'abord vérifier l'authentification
  await authMiddleware(req, res, () => {
    // Ensuite vérifier le rôle admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Privilèges admin requis.'
      });
    }
    next();
  });
}

module.exports = adminMiddleware;
