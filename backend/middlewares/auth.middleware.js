const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger.js');

const isDev = process.env.NODE_ENV !== 'production';

async function authMiddleware(req, res, next) {
  // Logs de debug uniquement en dev (contiennent des infos sensibles)
  if (isDev) {
    logger.debug('🔐 Auth middleware - Path:', req.path);
    logger.debug('🍪 Cookies présents:', !!req.cookies?.token);
    logger.debug('📋 Header Authorization présent:', !!req.headers['authorization']);
  }

  let token = null;

  // Priorité 1: Cookie httpOnly (sécurisé contre XSS)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Priorité 2: Header Authorization (pour API/mobile)
  else {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Token requis.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET manquant dans les variables d\'environnement');
      return res.status(500).json({ message: 'Configuration serveur invalide.' });
    }
    const decoded = jwt.verify(token, secret);
    const userId = decoded.id || decoded._id || decoded.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Token invalide.' });
    }

    const user = await User.findById(userId).select('-motdepasse');
    if (!user || user.isDisabled || user.deletedAt) {
      return res.status(401).json({ message: 'Utilisateur introuvable ou désactivé.' });
    }

    req.userId = user.id;
    req.user = user; 
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

// Middleware d'authentification optionnel (ne bloque pas si pas de token)
async function optionalAuthMiddleware(req, res, next) {
  let token = null;

  // Priorité 1: Cookie httpOnly
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Priorité 2: Header Authorization
  else {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  // Si pas de token, continuer sans authentifier
  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(); // Pas de JWT_SECRET, continuer sans auth
    }
    const decoded = jwt.verify(token, secret);
    const userId = decoded.id || decoded._id || decoded.sub;

    if (userId) {
      const user = await User.findById(userId).select('-motdepasse');
      if (user && !user.isDisabled && !user.deletedAt) {
        req.userId = user.id;
        req.user = user;
      }
    }
  } catch (err) {
    // En cas d'erreur de token, continuer sans authentifier
    logger.debug('Token invalide dans optionalAuth, continuant sans auth');
  }

  next();
}

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuthMiddleware;