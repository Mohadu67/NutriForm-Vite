const Subscription = require('../models/Subscription');
const logger = require('../utils/logger.js');

/**
 * Middleware pour vérifier que l'utilisateur a un abonnement Premium actif
 * Doit être utilisé APRÈS authMiddleware
 */
async function requirePremium(req, res, next) {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentification requise.'
      });
    }

    // Vérifier le tier dans User model
    if (req.user.subscriptionTier === 'premium') {
      return next();
    }

    // Si tier est 'free', vérifier s'il y a une subscription active en DB
    // (cas où le webhook n'a pas encore mis à jour le User)
    const subscription = await Subscription.findOne({ userId: req.userId });

    if (subscription && subscription.isActive()) {
      // Mettre à jour le tier dans User si nécessaire
      if (req.user.subscriptionTier !== 'premium') {
        req.user.subscriptionTier = 'premium';
        await req.user.save();
      }
      return next();
    }

    // L'utilisateur est free et n'a pas d'abonnement actif
    return res.status(403).json({
      error: 'premium_required',
      message: 'Cette fonctionnalité nécessite un abonnement Premium.',
      upgradeUrl: '/pricing'
    });
  } catch (error) {
    logger.error('Erreur requirePremium middleware:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Erreur lors de la vérification de l\'abonnement.'
    });
  }
}

/**
 * Middleware optionnel pour enrichir req avec les informations de subscription
 * N'empêche pas l'accès, ajoute juste req.subscription
 */
async function attachSubscription(req, res, next) {
  try {
    if (req.userId) {
      const subscription = await Subscription.findOne({ userId: req.userId });
      req.subscription = subscription || null;
    }
    next();
  } catch (error) {
    logger.error('Erreur attachSubscription middleware:', error);
    next(); // Ne pas bloquer en cas d'erreur
  }
}

module.exports = {
  requirePremium,
  attachSubscription
};
