const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  let token = null;

  // Priority: accessToken cookie > bearer token > old token cookie (rétrocompatibilité)
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token; // Rétrocompatibilité
  }

  if (!token) {
    return res.status(401).json({ message: 'Token requis.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Configuration serveur invalide: JWT_SECRET manquant.' });
    }
    const decoded = jwt.verify(token, secret || 'secret');
    const userId = decoded.id || decoded._id || decoded.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Token invalide.' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user || user.isDisabled || user.deletedAt) {
      return res.status(401).json({ message: 'Utilisateur introuvable ou désactivé.' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (err) {
    // Si le token est expiré, suggérer le refresh
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré.', needsRefresh: true });
    }
    return res.status(401).json({ message: 'Token invalide.' });
  }
}

module.exports = authMiddleware;