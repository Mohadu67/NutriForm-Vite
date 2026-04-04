const dashboardService = require('../services/dashboard.service');
const logger = require('../utils/logger');

exports.getOverview = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardOverview(req.user._id);
    res.json({ success: true, ...data });
  } catch (error) {
    logger.error('Erreur dashboard overview:', error);
    res.status(500).json({ message: 'Erreur lors du chargement du dashboard.' });
  }
};
