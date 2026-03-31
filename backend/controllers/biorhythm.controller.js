const logger = require('../utils/logger.js');
const SleepLog = require('../models/SleepLog.js');
const UserProfile = require('../models/UserProfile.js');
const WorkoutSession = require('../models/WorkoutSession.js');
const biorhythmService = require('../services/biorhythm.service.js');

/**
 * POST /api/biorhythm/sync-sleep
 * Sync sleep data from phone (Apple Health / Google Fit / manual)
 */
async function syncSleep(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const {
      date,
      sleepDuration,
      deepSleepMinutes,
      remSleepMinutes,
      lightSleepMinutes,
      awakeMinutes,
      sleepStart,
      sleepEnd,
      heartRateResting,
      hrv,
      source
    } = req.body;

    // Validate required fields
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date est requis'
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

    // Build update data
    const updateData = {
      syncedAt: new Date()
    };

    if (typeof sleepDuration === 'number' && sleepDuration >= 0) {
      updateData.sleepDuration = sleepDuration;
    }
    if (typeof deepSleepMinutes === 'number' && deepSleepMinutes >= 0) {
      updateData.deepSleepMinutes = deepSleepMinutes;
    }
    if (typeof remSleepMinutes === 'number' && remSleepMinutes >= 0) {
      updateData.remSleepMinutes = remSleepMinutes;
    }
    if (typeof lightSleepMinutes === 'number' && lightSleepMinutes >= 0) {
      updateData.lightSleepMinutes = lightSleepMinutes;
    }
    if (typeof awakeMinutes === 'number' && awakeMinutes >= 0) {
      updateData.awakeMinutes = awakeMinutes;
    }
    if (sleepStart) {
      updateData.sleepStart = new Date(sleepStart);
    }
    if (sleepEnd) {
      updateData.sleepEnd = new Date(sleepEnd);
    }
    if (typeof heartRateResting === 'number' && heartRateResting >= 0) {
      updateData.heartRateResting = heartRateResting;
    }
    if (typeof hrv === 'number' && hrv >= 0) {
      updateData.hrv = hrv;
    }
    if (source && ['healthkit', 'googlefit', 'manual'].includes(source)) {
      updateData.source = source;
    }

    // Upsert the sleep data
    const result = await SleepLog.findOneAndUpdate(
      { userId, date: providedDate },
      updateData,
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Données de sommeil synchronisées',
      data: {
        date: result.date,
        sleepDuration: result.sleepDuration,
        deepSleepMinutes: result.deepSleepMinutes,
        remSleepMinutes: result.remSleepMinutes,
        lightSleepMinutes: result.lightSleepMinutes,
        awakeMinutes: result.awakeMinutes,
        sleepStart: result.sleepStart,
        sleepEnd: result.sleepEnd,
        heartRateResting: result.heartRateResting,
        hrv: result.hrv,
        source: result.source,
        syncedAt: result.syncedAt
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la synchronisation des données de sommeil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation'
    });
  }
}

/**
 * GET /api/biorhythm/readiness
 * Get readiness score for a given date (defaults to today)
 */
async function getReadiness(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Parse target date
    const targetDate = new Date(req.query.date || new Date());
    targetDate.setUTCHours(0, 0, 0, 0);

    // 1. Fetch SleepLog for the date
    const sleepLog = await SleepLog.findOne({ userId, date: targetDate });

    // 2. Fetch UserProfile
    const profile = await UserProfile.findOne({ userId });

    // 3. Fetch WorkoutSessions from last 48h
    const fortyEightHoursAgo = new Date(targetDate.getTime() - 48 * 60 * 60 * 1000);
    const recentWorkouts = await WorkoutSession.find({
      userId,
      status: 'finished',
      endedAt: { $gte: fortyEightHoursAgo, $lte: targetDate }
    }).sort({ endedAt: -1 });

    // 4. Fetch recent sleep logs for consistency (last 7 days)
    const sevenDaysAgo = new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSleepLogs = await SleepLog.find({
      userId,
      date: { $gte: sevenDaysAgo, $lt: targetDate }
    }).sort({ date: -1 });

    // 5. Calculate readiness score
    const readiness = biorhythmService.calculateReadinessScore({
      sleepLog,
      profile,
      recentWorkouts,
      recentSleepLogs
    });

    return res.json({
      success: true,
      data: {
        date: targetDate,
        hasRealData: !!sleepLog,
        ...readiness
      }
    });
  } catch (error) {
    logger.error('Erreur lors du calcul du score de readiness:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du score'
    });
  }
}

/**
 * GET /api/biorhythm/readiness/history
 * Returns readiness scores for last N days
 */
async function getReadinessHistory(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const days = Math.min(parseInt(req.query.days) || 7, 30);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch all sleep logs for the period + 7 extra days for consistency calc
    const extendedStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const allSleepLogs = await SleepLog.find({
      userId,
      date: { $gte: extendedStart, $lte: today }
    }).sort({ date: -1 });

    // Fetch profile once
    const profile = await UserProfile.findOne({ userId });

    // Fetch all workouts in the extended period
    const allWorkouts = await WorkoutSession.find({
      userId,
      status: 'finished',
      endedAt: { $gte: extendedStart, $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }).sort({ endedAt: -1 });

    const history = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      date.setUTCHours(0, 0, 0, 0);

      const sleepLog = allSleepLogs.find(log => log.date.getTime() === date.getTime());

      // Workouts in the 48h before this date
      const dateMs = date.getTime();
      const recentWorkouts = allWorkouts.filter(w => {
        const endedMs = new Date(w.endedAt).getTime();
        return endedMs >= dateMs - 48 * 60 * 60 * 1000 && endedMs <= dateMs;
      });

      // Sleep logs for the 7 days before this date
      const sevenDaysBefore = dateMs - 7 * 24 * 60 * 60 * 1000;
      const recentSleepLogs = allSleepLogs.filter(log => {
        const logMs = log.date.getTime();
        return logMs >= sevenDaysBefore && logMs < dateMs;
      });

      const readiness = biorhythmService.calculateReadinessScore({
        sleepLog,
        profile,
        recentWorkouts,
        recentSleepLogs
      });

      history.push({
        date,
        score: readiness.score,
        label: readiness.label,
        sleepDuration: sleepLog?.sleepDuration || null
      });
    }

    return res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'historique de readiness:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
}

/**
 * GET /api/biorhythm/sleep/:date
 * Returns sleep data for a specific date
 */
async function getSleep(req, res) {
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

    const data = await SleepLog.findOne({
      userId,
      date: queryDate
    });

    if (!data) {
      return res.json({
        success: true,
        data: null,
        message: 'Pas de données de sommeil pour ce jour'
      });
    }

    return res.json({
      success: true,
      data: {
        date: data.date,
        sleepDuration: data.sleepDuration,
        deepSleepMinutes: data.deepSleepMinutes,
        remSleepMinutes: data.remSleepMinutes,
        lightSleepMinutes: data.lightSleepMinutes,
        awakeMinutes: data.awakeMinutes,
        sleepStart: data.sleepStart,
        sleepEnd: data.sleepEnd,
        heartRateResting: data.heartRateResting,
        hrv: data.hrv,
        source: data.source,
        syncedAt: data.syncedAt
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des données de sommeil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
}

/**
 * GET /api/biorhythm/sleep/history
 * Returns sleep history for last N days
 */
async function getSleepHistory(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const days = Math.min(parseInt(req.query.days) || 7, 30);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    const data = await SleepLog.find({
      userId,
      date: { $gte: startDate, $lte: today }
    }).sort({ date: -1 });

    return res.json({
      success: true,
      data: data.map(d => ({
        date: d.date,
        sleepDuration: d.sleepDuration,
        deepSleepMinutes: d.deepSleepMinutes,
        remSleepMinutes: d.remSleepMinutes,
        lightSleepMinutes: d.lightSleepMinutes,
        awakeMinutes: d.awakeMinutes,
        sleepStart: d.sleepStart,
        sleepEnd: d.sleepEnd,
        heartRateResting: d.heartRateResting,
        hrv: d.hrv,
        source: d.source,
        syncedAt: d.syncedAt
      }))
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'historique de sommeil:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
}

module.exports = {
  syncSleep,
  getReadiness,
  getReadinessHistory,
  getSleep,
  getSleepHistory
};
