const { computeRecoveryStatus } = require('../services/recovery.service');
const logger = require('../utils/logger');

async function getRecoveryStatus(req, res) {
  try {
    const userId = req.userId;
    const result = await computeRecoveryStatus(userId);
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Erreur récupération recovery status:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

module.exports = { getRecoveryStatus };
