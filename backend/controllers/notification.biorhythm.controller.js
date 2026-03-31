const logger = require('../utils/logger');
const SleepLog = require('../models/SleepLog');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const WorkoutSession = require('../models/WorkoutSession');
const PushSubscription = require('../models/PushSubscription');
const biorhythmService = require('../services/biorhythm.service');
const { computeTrainingReminder } = require('../services/notification.scheduler');

/**
 * Send an Expo push notification via the Expo Push API
 * @param {string} expoPushToken - The Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Promise<Object>} Expo API response
 */
async function sendExpoPush(expoPushToken, title, body) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title,
      body,
    }),
  });

  return response.json();
}

/**
 * POST /api/biorhythm/schedule-notification
 * Called by the mobile app after sleep sync to schedule the day's training notification
 */
async function scheduleNotification(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé',
      });
    }

    // 1. Compute readiness for today (same logic as getReadiness)
    const targetDate = new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const sleepLog = await SleepLog.findOne({ userId, date: targetDate });
    const profile = await UserProfile.findOne({ userId });

    const fortyEightHoursAgo = new Date(targetDate.getTime() - 48 * 60 * 60 * 1000);
    const recentWorkouts = await WorkoutSession.find({
      userId,
      status: 'finished',
      endedAt: { $gte: fortyEightHoursAgo, $lte: targetDate },
    }).sort({ endedAt: -1 });

    const sevenDaysAgo = new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSleepLogs = await SleepLog.find({
      userId,
      date: { $gte: sevenDaysAgo, $lt: targetDate },
    }).sort({ date: -1 });

    const readiness = biorhythmService.calculateReadinessScore({
      sleepLog,
      profile,
      recentWorkouts,
      recentSleepLogs,
    });

    // 2. Fetch user's push subscription (Expo token)
    const pushSub = await PushSubscription.findOne({
      userId,
      type: 'expo',
      active: true,
    });

    if (!pushSub || !pushSub.expoPushToken) {
      return res.json({
        success: true,
        scheduled: false,
        message: 'Aucun token push Expo trouvé',
      });
    }

    // 3. Fetch user's first name
    const user = await User.findById(userId).select('prenom');
    const prenom = user?.prenom || null;

    // 4. Compute training reminder
    const reminder = computeTrainingReminder(readiness, prenom);

    if (!reminder) {
      return res.json({
        success: true,
        scheduled: false,
        message: 'Pas de notification nécessaire (score trop bas ou fenêtre passée)',
      });
    }

    // 5. Send the push notification via Expo Push API
    const result = await sendExpoPush(
      pushSub.expoPushToken,
      reminder.title,
      reminder.body
    );

    logger.info(`Notification biorythme envoyée à ${userId}:`, {
      title: reminder.title,
      scheduledFor: reminder.scheduledFor,
    });

    return res.json({
      success: true,
      scheduled: true,
      data: {
        title: reminder.title,
        body: reminder.body,
        scheduledFor: reminder.scheduledFor,
        pushResult: result,
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la planification de la notification biorythme:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la planification de la notification',
    });
  }
}

module.exports = { scheduleNotification };
