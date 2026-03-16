function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Privilèges admin requis.'
    });
  }
  next();
}

module.exports = adminMiddleware;
