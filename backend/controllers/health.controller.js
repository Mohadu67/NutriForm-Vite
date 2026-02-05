const logger = require('../utils/logger.js');
const DailyHealthData = require('../models/DailyHealthData.js');

/**
 * POST /api/health/sync
 * Sync daily health data from phone (Apple Health / Google Fit)
 */
async function syncDailyHealthData(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const { date, caloriesBurned, steps, distance, source } = req.body;

    // Validate required fields
    if (!date || typeof caloriesBurned !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'date et caloriesBurned sont requis'
      });
    }

    // Validate date is not in the future
    const providedDate = new Date(date);
    providedDate.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (providedDate > today) {
      return res.status(400).json({
        success: false,
        message: 'La date ne peut pas être dans le futur'
      });
    }

    // Validate caloriesBurned is non-negative
    if (caloriesBurned < 0) {
      return res.status(400).json({
        success: false,
        message: 'caloriesBurned doit être positif'
      });
    }

    // Upsert the daily health data
    const updateData = {
      caloriesBurned,
      syncedAt: new Date()
    };

    if (typeof steps === 'number' && steps >= 0) {
      updateData.steps = steps;
    }

    if (typeof distance === 'number' && distance >= 0) {
      updateData.distance = distance;
    }

    if (source && ['healthkit', 'googlefit'].includes(source)) {
      updateData.source = source;
    }

    const result = await DailyHealthData.findOneAndUpdate(
      { userId, date: providedDate },
      updateData,
      { upsert: true, new: true }
    );

    // Calculate total calories from all daily health data
    const allDailyData = await DailyHealthData.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalCalories: { $sum: '$caloriesBurned' } } }
    ]);

    const totalCalories = allDailyData[0]?.totalCalories || 0;

    return res.json({
      success: true,
      message: 'Données de santé synchronisées',
      data: {
        date: result.date,
        caloriesBurned: result.caloriesBurned,
        steps: result.steps,
        distance: result.distance,
        source: result.source,
        syncedAt: result.syncedAt
      },
      totalCaloriesBurned: totalCalories
    });
  } catch (error) {
    logger.error('Erreur lors de la synchronisation des données de santé:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation'
    });
  }
}

/**
 * GET /api/health/total
 * Get total calories burned from DailyHealthData
 */
async function getTotalCaloriesBurned(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const result = await DailyHealthData.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalCalories: { $sum: '$caloriesBurned' } } }
    ]);

    const totalCalories = result[0]?.totalCalories || 0;

    return res.json({
      success: true,
      totalCaloriesBurned: totalCalories
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des calories totales:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
}

/**
 * GET /api/health/daily/:date
 * Get daily health data for a specific date
 */
async function getDailyHealthData(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const { date } = req.params;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date est requis'
      });
    }

    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);

    const data = await DailyHealthData.findOne({
      userId,
      date: queryDate
    });

    if (!data) {
      return res.json({
        success: true,
        data: null,
        message: 'Pas de données pour ce jour'
      });
    }

    return res.json({
      success: true,
      data: {
        date: data.date,
        caloriesBurned: data.caloriesBurned,
        steps: data.steps,
        distance: data.distance,
        source: data.source,
        syncedAt: data.syncedAt
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des données quotidiennes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
}

/**
 * GET /api/health/range?startDate=...&endDate=...
 * Get health data for a date range
 */
async function getHealthDataRange(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate et endDate sont requis'
      });
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const data = await DailyHealthData.find({
      userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });

    return res.json({
      success: true,
      data: data.map(d => ({
        date: d.date,
        caloriesBurned: d.caloriesBurned,
        steps: d.steps,
        distance: d.distance,
        source: d.source,
        syncedAt: d.syncedAt
      }))
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des données par plage:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
}

module.exports = {
  syncDailyHealthData,
  getTotalCaloriesBurned,
  getDailyHealthData,
  getHealthDataRange
};
