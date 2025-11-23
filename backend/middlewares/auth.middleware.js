const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  console.log('🔐 Auth middleware - Path:', req.path);
  console.log('🍪 Cookies:', req.cookies);
  console.log('📋 Headers Authorization:', req.headers['authorization']);

  let token = null;

  // Priorité 1: Cookie httpOnly (sécurisé contre XSS)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('✅ Token trouvé dans cookie');
  }
  // Priorité 2: Header Authorization (pour API/mobile)
  else {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
      console.log('✅ Token trouvé dans header');
    }
  }

  if (!token) {
    console.log('❌ Aucun token trouvé');
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
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

module.exports = authMiddleware;