const adminUserService = require('../services/adminUser.service');
const logger = require('../utils/logger');

exports.getUsers = async (req, res) => {
  try {
    const { page, limit, search, role, gender, subscriptionTier, sortBy, sortOrder } = req.query;
    const result = await adminUserService.getAllUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
      role,
      gender,
      subscriptionTier,
      sortBy,
      sortOrder,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Erreur getUsers:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const stats = await adminUserService.getUserStats();
    res.json({ success: true, stats });
  } catch (err) {
    logger.error('Erreur getUserStats:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    await adminUserService.banUser(req.params.userId, reason);
    res.json({ success: true, message: 'Utilisateur banni.' });
  } catch (err) {
    logger.error('Erreur banUser:', err);
    const status = err.message.includes('introuvable') ? 404 : err.message.includes('admin') ? 403 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    await adminUserService.unbanUser(req.params.userId);
    res.json({ success: true, message: 'Utilisateur débanni.' });
  } catch (err) {
    logger.error('Erreur unbanUser:', err);
    res.status(err.message.includes('introuvable') ? 404 : 500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await adminUserService.deleteUser(req.params.userId);
    res.json({ success: true, message: 'Utilisateur supprimé.' });
  } catch (err) {
    logger.error('Erreur deleteUser:', err);
    const status = err.message.includes('introuvable') ? 404 : err.message.includes('admin') ? 403 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Rôle requis.' });
    const user = await adminUserService.changeUserRole(req.params.userId, role);
    res.json({ success: true, message: `Rôle changé en ${role}.`, user: { role: user.role } });
  } catch (err) {
    logger.error('Erreur changeRole:', err);
    res.status(err.message.includes('invalide') ? 400 : 500).json({ success: false, message: err.message });
  }
};

exports.changeTier = async (req, res) => {
  try {
    const { tier } = req.body;
    if (!tier) return res.status(400).json({ success: false, message: 'Tier requis.' });
    const user = await adminUserService.changeSubscriptionTier(req.params.userId, tier);
    res.json({ success: true, message: `Abonnement changé en ${tier}.`, user: { subscriptionTier: user.subscriptionTier } });
  } catch (err) {
    logger.error('Erreur changeTier:', err);
    res.status(err.message.includes('invalide') ? 400 : 500).json({ success: false, message: err.message });
  }
};

exports.giveXp = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Montant XP invalide.' });
    const result = await adminUserService.giveXp(req.params.userId, parseInt(amount));
    res.json({ success: true, message: `${result.added} XP ajoutés.`, ...result });
  } catch (err) {
    logger.error('Erreur giveXp:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
