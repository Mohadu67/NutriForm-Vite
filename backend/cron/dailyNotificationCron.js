const cron = require('node-cron');
const User = require('../models/User');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const WorkoutSession = require('../models/WorkoutSession');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/pushNotification.service');

// Templates de notifications quotidiennes
const DAILY_TEMPLATES = {
  no_session_yesterday: {
    title: "💪 C'est le moment!",
    body: "Une séance aujourd'hui? Ta progression t'attend!"
  },
  streak_reminder: {
    title: "🔥 Streak en danger!",
    getBody: (streak) => `Ne perds pas ta streak de ${streak} jours! Fais une séance.`
  },
  streak_congrats: {
    title: "🔥 Streak incroyable!",
    getBody: (streak) => `${streak} jours consécutifs! Tu es en feu!`
  },
  close_to_top_10: {
    title: "📈 Top 10 en vue!",
    getBody: (diff) => `Plus que ${diff} séances pour entrer dans le top 10!`
  },
  inactive_3_days: {
    title: "😴 Tu nous manques!",
    body: "Une petite séance pour reprendre le rythme?"
  },
  inactive_7_days: {
    title: "🏃 Reviens en force!",
    body: "Tes rivaux avancent... Montre-leur ce que tu vaux!"
  },
  weekly_recap: {
    title: "📊 Récap de ta semaine",
    getBody: (data) => `${data.sessions} séances, ${data.calories} kcal brûlées. Rang #${data.rank}`
  },
  new_week_motivation: {
    title: "🚀 Nouvelle semaine!",
    body: "C'est reparti! Fixe-toi un objectif pour cette semaine."
  }
};

// Notifications quotidiennes de motivation (9h00)
async function sendDailyMotivation() {
  logger.info('📬 CRON: Envoi des notifications de motivation quotidiennes...');

  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Récupérer tous les users avec notifications activées et dans le leaderboard
    const leaderboardEntries = await LeaderboardEntry.find({
      visibility: 'public'
    }).populate('userId');

    let notificationsSent = 0;

    for (const entry of leaderboardEntries) {
      try {
        const user = entry.userId;
        if (!user) continue;

        // Vérifier les préférences de notification
        const prefs = user.notificationPreferences || {};
        if (prefs.dailyReminder === false) continue;

        // Vérifier si l'utilisateur a fait une séance hier
        const sessionYesterday = await WorkoutSession.findOne({
          userId: user._id,
          createdAt: {
            $gte: yesterday,
            $lt: today
          }
        });

        // Vérifier si l'utilisateur a fait une séance aujourd'hui
        const sessionToday = await WorkoutSession.findOne({
          userId: user._id,
          createdAt: { $gte: today }
        });

        // Logique de notification
        if (!sessionYesterday && !sessionToday) {
          // Pas de séance hier ni aujourd'hui
          const streak = entry.stats?.currentStreak || 0;

          if (streak > 0) {
            // Streak en danger!
            await sendNotificationToUser(user._id, {
              title: DAILY_TEMPLATES.streak_reminder.title,
              body: DAILY_TEMPLATES.streak_reminder.getBody(streak),
              data: { type: 'daily_reminder', url: '/dashboard' }
            });
          } else {
            // Simple rappel
            await sendNotificationToUser(user._id, {
              title: DAILY_TEMPLATES.no_session_yesterday.title,
              body: DAILY_TEMPLATES.no_session_yesterday.body,
              data: { type: 'daily_reminder', url: '/dashboard' }
            });
          }
          notificationsSent++;

        } else if (sessionYesterday && !sessionToday) {
          // A fait une séance hier mais pas aujourd'hui
          const streak = entry.stats?.currentStreak || 0;

          if (streak >= 7) {
            // Féliciter pour la streak
            await sendNotificationToUser(user._id, {
              title: DAILY_TEMPLATES.streak_congrats.title,
              body: DAILY_TEMPLATES.streak_congrats.getBody(streak),
              data: { type: 'streak_congrats', url: '/leaderboard' }
            });
            notificationsSent++;
          }
        }

      } catch (err) {
        logger.error(`Erreur notification pour user:`, err);
      }
    }

    logger.info(`📬 CRON: ${notificationsSent} notifications de motivation envoyées`);

  } catch (error) {
    logger.error('📬 CRON Erreur sendDailyMotivation:', error);
  }
}

// Rappel streak en danger (20h00)
async function sendStreakReminders() {
  logger.info('🔥 CRON: Envoi des rappels streak en danger...');

  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Trouver les users avec une streak > 0 qui n'ont pas fait de séance aujourd'hui
    const entriesWithStreak = await LeaderboardEntry.find({
      visibility: 'public',
      'stats.currentStreak': { $gt: 0 }
    }).populate('userId');

    let notificationsSent = 0;

    for (const entry of entriesWithStreak) {
      try {
        const user = entry.userId;
        if (!user) continue;

        // Vérifier les préférences
        const prefs = user.notificationPreferences || {};
        if (prefs.streakReminders === false) continue;

        // Vérifier si séance aujourd'hui
        const sessionToday = await WorkoutSession.findOne({
          userId: user._id,
          createdAt: { $gte: today }
        });

        if (!sessionToday) {
          // Envoyer rappel urgent
          await sendNotificationToUser(user._id, {
            title: "⚠️ Streak en danger!",
            body: `Plus que quelques heures pour garder ta streak de ${entry.stats.currentStreak} jours!`,
            data: { type: 'streak_danger', url: '/dashboard' }
          });
          notificationsSent++;
        }

      } catch (err) {
        logger.error(`Erreur rappel streak:`, err);
      }
    }

    logger.info(`🔥 CRON: ${notificationsSent} rappels streak envoyés`);

  } catch (error) {
    logger.error('🔥 CRON Erreur sendStreakReminders:', error);
  }
}

// Notification aux inactifs (11h00)
async function notifyInactiveUsers() {
  logger.info('😴 CRON: Notification aux utilisateurs inactifs...');

  try {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Trouver les users inactifs depuis 3-7 jours
    const entries = await LeaderboardEntry.find({
      visibility: 'public',
      lastUpdated: { $lt: threeDaysAgo }
    }).populate('userId');

    let notificationsSent = 0;

    for (const entry of entries) {
      try {
        const user = entry.userId;
        if (!user) continue;

        const prefs = user.notificationPreferences || {};
        if (prefs.dailyReminder === false) continue;

        // Dernière séance
        const lastSession = await WorkoutSession.findOne({ userId: user._id })
          .sort({ createdAt: -1 });

        if (!lastSession) continue;

        const daysSinceLastSession = Math.floor(
          (now - lastSession.createdAt) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastSession >= 7) {
          await sendNotificationToUser(user._id, {
            title: DAILY_TEMPLATES.inactive_7_days.title,
            body: DAILY_TEMPLATES.inactive_7_days.body,
            data: { type: 'inactive_reminder', url: '/dashboard' }
          });
          notificationsSent++;
        } else if (daysSinceLastSession >= 3) {
          await sendNotificationToUser(user._id, {
            title: DAILY_TEMPLATES.inactive_3_days.title,
            body: DAILY_TEMPLATES.inactive_3_days.body,
            data: { type: 'inactive_reminder', url: '/dashboard' }
          });
          notificationsSent++;
        }

      } catch (err) {
        logger.error(`Erreur notification inactif:`, err);
      }
    }

    logger.info(`😴 CRON: ${notificationsSent} notifications inactifs envoyées`);

  } catch (error) {
    logger.error('😴 CRON Erreur notifyInactiveUsers:', error);
  }
}

// Récap hebdomadaire (Dimanche 18h00)
async function sendWeeklyRecap() {
  logger.info('📊 CRON: Envoi des récaps hebdomadaires...');

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const entries = await LeaderboardEntry.find({
      visibility: 'public'
    }).populate('userId');

    let notificationsSent = 0;

    for (const entry of entries) {
      try {
        const user = entry.userId;
        if (!user) continue;

        const prefs = user.notificationPreferences || {};
        if (prefs.leaderboardUpdates === false) continue;

        // Calculer les stats de la semaine
        const weeklySessions = await WorkoutSession.countDocuments({
          userId: user._id,
          createdAt: { $gte: oneWeekAgo }
        });

        const weeklyCalories = await WorkoutSession.aggregate([
          {
            $match: {
              userId: user._id,
              createdAt: { $gte: oneWeekAgo }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$caloriesBurned' }
            }
          }
        ]);

        if (weeklySessions > 0) {
          // Calculer le rang
          const betterEntries = await LeaderboardEntry.countDocuments({
            visibility: 'public',
            'stats.thisWeekSessions': { $gt: entry.stats?.thisWeekSessions || 0 }
          });
          const rank = betterEntries + 1;

          await sendNotificationToUser(user._id, {
            title: DAILY_TEMPLATES.weekly_recap.title,
            body: DAILY_TEMPLATES.weekly_recap.getBody({
              sessions: weeklySessions,
              calories: weeklyCalories[0]?.total || 0,
              rank
            }),
            data: { type: 'weekly_recap', url: '/leaderboard' }
          });
          notificationsSent++;
        }

      } catch (err) {
        logger.error(`Erreur récap hebdo:`, err);
      }
    }

    logger.info(`📊 CRON: ${notificationsSent} récaps hebdomadaires envoyés`);

  } catch (error) {
    logger.error('📊 CRON Erreur sendWeeklyRecap:', error);
  }
}

// Démarrer les CRON jobs
function startDailyNotificationCron() {
  // Motivation quotidienne à 9h00
  cron.schedule('0 9 * * *', sendDailyMotivation, {
    timezone: 'Europe/Paris'
  });

  // Rappel streak en danger à 20h00
  cron.schedule('0 20 * * *', sendStreakReminders, {
    timezone: 'Europe/Paris'
  });

  // Notification aux inactifs à 11h00
  cron.schedule('0 11 * * *', notifyInactiveUsers, {
    timezone: 'Europe/Paris'
  });

  // Récap hebdomadaire le dimanche à 18h00
  cron.schedule('0 18 * * 0', sendWeeklyRecap, {
    timezone: 'Europe/Paris'
  });

  logger.info('📬 Daily Notification CRON jobs démarrés');
}

module.exports = {
  startDailyNotificationCron,
  sendDailyMotivation,
  sendStreakReminders,
  notifyInactiveUsers,
  sendWeeklyRecap
};
