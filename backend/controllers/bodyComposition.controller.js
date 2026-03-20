const bodyCompositionService = require('../services/bodyComposition.service');
const WeightLog = require('../models/WeightLog');
const UserProfile = require('../models/UserProfile');
const logger = require('../utils/logger');

/**
 * GET /api/body-composition/summary?days=7
 * Retourne l'analyse de composition corporelle sur la période
 */
async function getSummary(req, res) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
    const result = await bodyCompositionService.computeBodyComposition(req.user._id, days);
    res.json(result);
  } catch (err) {
    logger.error('Erreur body composition summary:', err);
    res.status(500).json({ error: 'Erreur lors du calcul de composition corporelle.' });
  }
}

/**
 * GET /api/body-composition/trend?weeks=4
 * Retourne la tendance sur plusieurs semaines
 */
async function getTrend(req, res) {
  try {
    const weeks = Math.min(Math.max(parseInt(req.query.weeks) || 4, 1), 12);
    const result = await bodyCompositionService.getCompositionTrend(req.user._id, weeks);
    res.json(result);
  } catch (err) {
    logger.error('Erreur body composition trend:', err);
    res.status(500).json({ error: 'Erreur lors du calcul de tendance.' });
  }
}

/**
 * POST /api/body-composition/weight
 * Log un poids pour une date donnée
 */
async function logWeight(req, res) {
  try {
    const { weight, bodyFatPercent, date } = req.body;

    if (!weight || weight < 20 || weight > 400) {
      return res.status(400).json({ error: 'Poids invalide (20-400 kg).' });
    }

    const logDate = date ? new Date(date) : new Date();
    logDate.setUTCHours(0, 0, 0, 0);

    // Upsert : un seul log par jour
    const weightLog = await WeightLog.findOneAndUpdate(
      { userId: req.user._id, date: logDate },
      {
        userId: req.user._id,
        date: logDate,
        weight,
        bodyFatPercent: bodyFatPercent || null,
        source: 'manual',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Mettre à jour le poids dans le profil
    await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { weight, ...(bodyFatPercent ? { bodyFatPercent } : {}) },
      { upsert: true }
    );

    res.json(weightLog);
  } catch (err) {
    logger.error('Erreur log weight:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du poids.' });
  }
}

/**
 * GET /api/body-composition/weight?days=30
 * Historique des pesées
 */
async function getWeightHistory(req, res) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const logs = await WeightLog.find({
      userId: req.user._id,
      date: { $gte: startDate },
    }).sort({ date: 1 }).lean();

    res.json(logs);
  } catch (err) {
    logger.error('Erreur weight history:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
  }
}

/**
 * DELETE /api/body-composition/weight/:id
 */
async function deleteWeightLog(req, res) {
  try {
    const log = await WeightLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!log) {
      return res.status(404).json({ error: 'Entrée non trouvée.' });
    }

    res.json({ message: 'Entrée supprimée.' });
  } catch (err) {
    logger.error('Erreur delete weight log:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
}

/**
 * PUT /api/body-composition/metrics
 * Mettre à jour les mensurations (poids, taille, % gras) dans le profil
 */
async function updateMetrics(req, res) {
  try {
    const { weight, height, bodyFatPercent } = req.body;
    const update = {};

    if (weight != null) {
      if (weight < 20 || weight > 400) return res.status(400).json({ error: 'Poids invalide.' });
      update.weight = weight;
    }
    if (height != null) {
      if (height < 80 || height > 280) return res.status(400).json({ error: 'Taille invalide.' });
      update.height = height;
    }
    if (bodyFatPercent != null) {
      if (bodyFatPercent < 2 || bodyFatPercent > 60) return res.status(400).json({ error: '% gras invalide.' });
      update.bodyFatPercent = bodyFatPercent;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour.' });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      update,
      { new: true, upsert: true }
    );

    res.json({
      weight: profile.weight,
      height: profile.height,
      bodyFatPercent: profile.bodyFatPercent,
    });
  } catch (err) {
    logger.error('Erreur update metrics:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
}

module.exports = {
  getSummary,
  getTrend,
  logWeight,
  getWeightHistory,
  deleteWeightLog,
  updateMetrics,
};
