const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const [scheme, token] = authHeader.split(' ');
  if (!token || String(scheme).toLowerCase() !== 'bearer') {
    return res.status(401).json({ message: 'Token requis.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // Normalise les infos utilisateur sur la requête
    req.userId = decoded.id || decoded._id || decoded.sub || null;
    req.user = decoded; // utile si on veut plus d’infos plus tard
    if (!req.userId) return res.status(401).json({ message: 'Token invalide.' });
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token invalide.' });
  }
}

module.exports = authMiddleware;