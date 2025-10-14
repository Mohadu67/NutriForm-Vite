const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  let token = null;


  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
    console.log('[AUTH] Token found in accessToken cookie');
  } else if (authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
    console.log('[AUTH] Token found in Bearer header');
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('[AUTH] Token found in legacy token cookie');
  } else {
    console.log('[AUTH] No token found - cookies:', Object.keys(req.cookies || {}), '- headers:', req.headers['authorization'] || 'none');
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
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré.', needsRefresh: true });
    }
    return res.status(401).json({ message: 'Token invalide.' });
  }
}

module.exports = authMiddleware;