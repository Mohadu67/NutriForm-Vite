function partnerMiddleware(req, res, next) {
  if (!req.user || (req.user.role !== 'partner' && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Privilèges partenaire requis.'
    });
  }
  next();
}

module.exports = partnerMiddleware;
