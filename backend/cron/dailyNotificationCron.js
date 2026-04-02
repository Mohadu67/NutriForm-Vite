const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const WorkoutSession = require('../models/WorkoutSession');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/pushNotification.service');
const bodyCompositionService = require('../services/bodyComposition.service');

/**
 * Helper: envoyer push + sauvegarder en base pour le dedup/cooldown
 */
async function sendAndTrackNotification(userId, payload) {
  const result = await sendNotificationToUser(userId, payload);

  // Sauvegarder en base pour le dedup (même si le push a échoué, on track l'intention)
  if (result.message !== 'Blocked by user preference') {
    await Notification.create({
      userId,
      type: 'activity',
      title: payload.title,
      message: payload.body,
      link: payload.data?.url,
      metadata: { pushType: payload.type || payload.data?.type }
    }).catch(err => logger.error('Erreur sauvegarde notification cron:', err));
  }

  return result;
}

// Templates de notifications quotidiennes
const DAILY_TEMPLATES = {
  no_session_yesterday: {
    title: "C'est le moment!",
    body: "Une séance aujourd'hui? Ta progression t'attend!"
  },
  streak_reminder: {
    title: "Streak en danger!",
    getBody: (streak) => `Ne perds pas ta streak de ${streak} jours! Fais une séance.`
  },
  streak_congrats: {
    title: "Streak incroyable!",
    getBody: (streak) => `${streak} jours consécutifs! Tu es en feu!`
  },
  close_to_top_10: {
    title: "Top 10 en vue!",
    getBody: (diff) => `Plus que ${diff} séances pour entrer dans le top 10!`
  },
  inactive_3_days: {
    title: "Tu nous manques!",
    body: "Une petite séance pour reprendre le rythme?"
  },
  inactive_7_days: {
    title: "Reviens en force!",
    body: "Tes rivaux avancent... Montre-leur ce que tu vaux!"
  },
  weekly_recap: {
    title: "Récap de ta semaine",
    getBody: (data) => `${data.sessions} séances, ${data.calories} kcal brûlées. Rang #${data.rank}`
  },
  new_week_motivation: {
    title: "Nouvelle semaine!",
    body: "C'est reparti! Fixe-toi un objectif pour cette semaine."
  }
};

/**
 * Notification quotidienne unique (18h semaine, 9h weekend)
 * Fusionne motivation + streak en UNE seule notification par jour
 * Le rappel streak de 20h n'est envoyé QUE si l'utilisateur n'a pas
 * déjà reçu le rappel streak via cette fonction
 */
async function sendDailyMotivation() {
  logger.info('📬 CRON: Envoi des notifications de motivation quotidiennes...');

  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const leaderboardEntries = await LeaderboardEntry.find({
      visibility: 'public'
    }).populate('userId');

    let notificationsSent = 0;

    for (const entry of leaderboardEntries) {
      try {
        const user = entry.userId;
        if (!user) continue;

        // Les préférences sont vérifiées centralement dans sendNotificationToUser

        const sessionYesterday = await WorkoutSession.findOne({
          userId: user._id,
          createdAt: { $gte: yesterday, $lt: today }
        });

        const sessionToday = await WorkoutSession.findOne({
          userId: user._id,
          createdAt: { $gte: today }
        });

        if (!sessionYesterday && !sessionToday) {
          const streak = entry.stats?.currentStreak || 0;

          if (streak > 0) {
            // Streak en danger — notification unique (remplace aussi le rappel de 20h)
            await sendAndTrackNotification(user._id, {
              type: 'streak_danger',
              title: DAILY_TEMPLATES.streak_reminder.title,
              body: DAILY_TEMPLATES.streak_reminder.getBody(streak),
              icon: '/assets/icons/notif-streak.svg',
              data: { type: 'streak_danger', url: '/dashboard' }
            });
          } else {
            await sendAndTrackNotification(user._id, {
              type: 'daily_reminder',
              title: DAILY_TEMPLATES.no_session_yesterday.title,
              body: DAILY_TEMPLATES.no_session_yesterday.body,
              icon: '/assets/icons/notif-workout.svg',
              data: { type: 'daily_reminder', url: '/dashboard' }
            });
          }
          notificationsSent++;

        } else if (sessionYesterday && !sessionToday) {
          const streak = entry.stats?.currentStreak || 0;

          if (streak >= 7) {
            await sendAndTrackNotification(user._id, {
              type: 'streak_congrats',
              title: DAILY_TEMPLATES.streak_congrats.title,
              body: DAILY_TEMPLATES.streak_congrats.getBody(streak),
              icon: '/assets/icons/notif-streak.svg',
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

/**
 * Rappel streak en danger (20h00) — SEULEMENT pour ceux qui n'ont pas
 * déjà reçu la notification streak à 18h via sendDailyMotivation
 */
async function sendStreakReminders() {
  logger.info('🔥 CRON: Envoi des rappels streak en danger...');

  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const entriesWithStreak = await LeaderboardEntry.find({
      visibility: 'public',
      'stats.currentStreak': { $gt: 0 }
    }).populate('userId');

    let notificationsSent = 0;
    let skippedAlreadyNotified = 0;

    for (const entry of entriesWithStreak) {
      try {
        const user = entry.userId;
        if (!user) continue;

        // Les préférences sont vérifiées centralement dans sendNotificationToUser

        // Vérifier si séance aujourd'hui
        const sessionToday = await WorkoutSession.findOne({
          userId: user._id,
          createdAt: { $gte: today }
        });

        if (sessionToday) continue;

        // Vérifier si déjà notifié streak aujourd'hui (via 18h motivation)
        const alreadyNotified = await Notification.findOne({
          userId: user._id,
          'metadata.pushType': { $in: ['streak_danger', 'streak_congrats'] },
          createdAt: { $gte: today }
        });

        if (alreadyNotified) {
          skippedAlreadyNotified++;
          continue;
        }

        await sendAndTrackNotification(user._id, {
          type: 'streak_danger',
          title: "Streak en danger!",
          body: `Plus que quelques heures pour garder ta streak de ${entry.stats.currentStreak} jours!`,
          icon: '/assets/icons/notif-streak.svg',
          data: { type: 'streak_danger', url: '/dashboard' }
        });
        notificationsSent++;

      } catch (err) {
        logger.error(`Erreur rappel streak:`, err);
      }
    }

    logger.info(`🔥 CRON: ${notificationsSent} rappels streak envoyés (${skippedAlreadyNotified} déjà notifiés)`);

  } catch (error) {
    logger.error('🔥 CRON Erreur sendStreakReminders:', error);
  }
}

/**
 * Notification aux inactifs (11h00)
 * Cooldown: max 1 notification inactive par 3 jours (3-6j) ou par 7 jours (7j+)
 */
async function notifyInactiveUsers() {
  logger.info('😴 CRON: Notification aux utilisateurs inactifs...');

  try {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const entries = await LeaderboardEntry.find({
      visibility: 'public',
      lastUpdated: { $lt: threeDaysAgo }
    }).populate('userId');

    let notificationsSent = 0;
    let skippedCooldown = 0;

    for (const entry of entries) {
      try {
        const user = entry.userId;
        if (!user) continue;

        // Les préférences sont vérifiées centralement dans sendNotificationToUser

        const lastSession = await WorkoutSession.findOne({ userId: user._id })
          .sort({ createdAt: -1 });

        if (!lastSession) continue;

        const daysSinceLastSession = Math.floor(
          (now - lastSession.createdAt) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastSession < 3) continue;

        // Cooldown: vérifier la dernière notification inactive envoyée
        const cooldownDays = daysSinceLastSession >= 7 ? 7 : 3;
        const cooldownDate = new Date(now);
        cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

        const recentInactiveNotif = await Notification.findOne({
          userId: user._id,
          'metadata.pushType': 'inactive_reminder',
          createdAt: { $gte: cooldownDate }
        });

        if (recentInactiveNotif) {
          skippedCooldown++;
          continue;
        }

        if (daysSinceLastSession >= 7) {
          await sendAndTrackNotification(user._id, {
            type: 'inactive_reminder',
            title: DAILY_TEMPLATES.inactive_7_days.title,
            body: DAILY_TEMPLATES.inactive_7_days.body,
            icon: '/assets/icons/notif-workout.svg',
            data: { type: 'inactive_reminder', url: '/dashboard' }
          });
          notificationsSent++;
        } else {
          await sendAndTrackNotification(user._id, {
            type: 'inactive_reminder',
            title: DAILY_TEMPLATES.inactive_3_days.title,
            body: DAILY_TEMPLATES.inactive_3_days.body,
            icon: '/assets/icons/notif-workout.svg',
            data: { type: 'inactive_reminder', url: '/dashboard' }
          });
          notificationsSent++;
        }

      } catch (err) {
        logger.error(`Erreur notification inactif:`, err);
      }
    }

    logger.info(`😴 CRON: ${notificationsSent} notifications inactifs envoyées (${skippedCooldown} en cooldown)`);

  } catch (error) {
    logger.error('😴 CRON Erreur notifyInactiveUsers:', error);
  }
}

// Récap hebdomadaire (Samedi 10h00)
async function sendWeeklyRecap() {
  logger.info('📊 CRON: Envoi des récaps hebdomadaires...');

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Recuperer tous les users actifs
    const users = await User.find({ isActive: { $ne: false } }).select('_id notificationPreferences prenom pseudo');

    let notificationsSent = 0;

    for (const user of users) {
      try {
        const prefs = user.notificationPreferences || {};
        // Verifier la preference weeklyRecapPush
        if (prefs.weeklyRecapPush === false) continue;

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

        const calories = weeklyCalories[0]?.total || 0;
        const userName = user.prenom || user.pseudo || 'Champion';

        // Body composition de la semaine (gain muscle, perte gras, bilan calorique)
        let bodyCompLine = '';
        try {
          const bodyComp = await bodyCompositionService.computeBodyComposition(user._id, 7);
          if (bodyComp) {
            const parts = [];
            const balance = bodyComp.nutrition?.dailyBalance || 0;
            if (balance !== 0) {
              parts.push(`${balance > 0 ? '+' : ''}${balance} kcal/jour`);
            }
            const muscleG = bodyComp.muscleGain?.totalG || 0;
            if (muscleG > 0) parts.push(`+${muscleG}g muscle`);
            const fatG = bodyComp.fatChange?.g || 0;
            if (fatG !== 0) parts.push(`${fatG > 0 ? '+' : ''}${fatG}g gras`);
            if (parts.length > 0) bodyCompLine = ' | ' + parts.join(', ');
          }
        } catch (e) {
          // Body comp optionnel, on continue sans
        }

        // Message motivant selon l'activite
        let title, body;

        if (weeklySessions === 0) {
          title = 'Ton recap semaine est pret!';
          body = `${userName}, c'est pas grave, on recommence! Viens voir ton bilan et lance-toi cette semaine.${bodyCompLine}`;
        } else if (weeklySessions <= 2) {
          title = 'Recap semaine - Bon debut!';
          body = `${weeklySessions} seance${weeklySessions > 1 ? 's' : ''} cette semaine.${bodyCompLine}`;
        } else if (weeklySessions <= 4) {
          title = 'Recap semaine - Belle perf!';
          body = `${weeklySessions} seances, ${calories} kcal brulees.${bodyCompLine}`;
        } else {
          title = 'Recap semaine - Machine!';
          body = `${weeklySessions} seances, ${calories} kcal!${bodyCompLine}`;
        }

        await sendAndTrackNotification(user._id, {
          type: 'weekly_recap',
          title,
          body,
          icon: '/assets/icons/notif-recap.svg',
          data: { type: 'weekly_recap', url: '/dashboard' }
        });
        notificationsSent++;

      } catch (err) {
        logger.error(`Erreur récap hebdo user ${user._id}:`, err.message);
      }
    }

    logger.info(`📊 CRON: ${notificationsSent} récaps hebdomadaires envoyés`);

  } catch (error) {
    logger.error('📊 CRON Erreur sendWeeklyRecap:', error);
  }
}

// Démarrer les CRON jobs
function startDailyNotificationCron() {
  // Motivation quotidienne à 18h00 en semaine (lundi-vendredi)
  cron.schedule('0 18 * * 1-5', sendDailyMotivation, {
    timezone: 'Europe/Paris'
  });

  // Motivation quotidienne à 9h00 le weekend (samedi-dimanche)
  cron.schedule('0 9 * * 0,6', sendDailyMotivation, {
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

  // Récap hebdomadaire le samedi à 10h00
  cron.schedule('0 10 * * 6', sendWeeklyRecap, {
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
