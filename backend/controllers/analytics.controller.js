const WorkoutSession = require('../models/WorkoutSession');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Obtenir les analytics hebdomadaires pour le dashboard utilisateur
 * GET /api/analytics/weekly
 */
exports.getWeeklyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    // Seances de cette semaine
    const thisWeekSessions = await WorkoutSession.find({
      userId,
      status: 'finished',
      endedAt: { $gte: weekStart }
    }).sort({ endedAt: -1 });

    // Seances semaine precedente
    const lastWeekSessions = await WorkoutSession.find({
      userId,
      status: 'finished',
      endedAt: { $gte: previousWeekStart, $lt: weekStart }
    });

    // Analyser les muscles travailles cette semaine
    const muscleWork = {};
    let totalDuration = 0;
    let totalCalories = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalWeight = 0;

    thisWeekSessions.forEach(session => {
      totalDuration += session.durationSec || 0;
      totalCalories += session.calories || 0;

      const entries = session.entries || [];
      entries.forEach(entry => {
        // Compter les muscles
        const muscles = entry.muscles || [];
        if (entry.muscleGroup) muscles.push(entry.muscleGroup);
        if (entry.muscle) muscles.push(entry.muscle);

        muscles.forEach(muscle => {
          const key = muscle.toLowerCase();
          if (!muscleWork[key]) {
            muscleWork[key] = { count: 0, sets: 0, exercises: [] };
          }
          muscleWork[key].count++;
          if (!muscleWork[key].exercises.includes(entry.exerciseName)) {
            muscleWork[key].exercises.push(entry.exerciseName);
          }
        });

        // Compter sets/reps/poids
        const sets = entry.sets || [];
        totalSets += sets.length;
        sets.forEach(set => {
          totalReps += set.reps || 0;
          totalWeight += (set.weightKg || 0) * (set.reps || 1);
        });
      });
    });

    // Calculer les moyennes
    const avgSessionDuration = thisWeekSessions.length > 0
      ? Math.round(totalDuration / thisWeekSessions.length / 60)
      : 0;

    // Comparer avec la semaine derniere
    const lastWeekDuration = lastWeekSessions.reduce((acc, s) => acc + (s.durationSec || 0), 0);
    const lastWeekCalories = lastWeekSessions.reduce((acc, s) => acc + (s.calories || 0), 0);

    // Determiner le muscle le plus travaille
    const topMuscle = Object.entries(muscleWork)
      .sort((a, b) => b[1].count - a[1].count)[0];

    // Determiner les muscles negliges (pas travailles cette semaine)
    const commonMuscles = ['pectoraux', 'dos', 'epaules', 'biceps', 'triceps', 'quadriceps', 'ischio', 'mollets', 'abdos'];
    const neglectedMuscles = commonMuscles.filter(m => !muscleWork[m]);

    // Analyser la regularite (jours d'entrainement)
    const trainingDays = new Set();
    thisWeekSessions.forEach(session => {
      if (session.endedAt) {
        trainingDays.add(new Date(session.endedAt).toDateString());
      }
    });

    // Meilleure seance de la semaine (plus longue ou plus de calories)
    const bestSession = thisWeekSessions.reduce((best, session) => {
      if (!best) return session;
      const score = (session.durationSec || 0) + (session.calories || 0) * 10;
      const bestScore = (best.durationSec || 0) + (best.calories || 0) * 10;
      return score > bestScore ? session : best;
    }, null);

    // Stats des notifications cliquees cette semaine
    const notifStats = await Notification.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          clicked: { $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] } }
        }
      }
    ]);

    const notifClickRate = notifStats[0]
      ? Math.round((notifStats[0].clicked / notifStats[0].total) * 100)
      : 0;

    // Generer le message motivant personnalise
    const motivation = generateMotivation({
      sessionsCount: thisWeekSessions.length,
      lastWeekCount: lastWeekSessions.length,
      avgDuration: avgSessionDuration,
      topMuscle: topMuscle ? topMuscle[0] : null,
      neglectedMuscles,
      trainingDays: trainingDays.size,
      notifClickRate,
      totalCalories,
      lastWeekCalories
    });

    res.json({
      thisWeek: {
        sessions: thisWeekSessions.length,
        totalDuration: Math.round(totalDuration / 60), // en minutes
        avgDuration: avgSessionDuration,
        totalCalories,
        totalSets,
        totalReps,
        totalVolume: Math.round(totalWeight),
        trainingDays: trainingDays.size
      },
      lastWeek: {
        sessions: lastWeekSessions.length,
        totalDuration: Math.round(lastWeekDuration / 60),
        totalCalories: lastWeekCalories
      },
      muscles: muscleWork,
      topMuscle: topMuscle ? { name: topMuscle[0], ...topMuscle[1] } : null,
      neglectedMuscles,
      bestSession: bestSession ? {
        id: bestSession._id,
        name: bestSession.name,
        duration: Math.round((bestSession.durationSec || 0) / 60),
        calories: bestSession.calories,
        date: bestSession.endedAt
      } : null,
      notifClickRate,
      motivation,
      recentSessions: thisWeekSessions.slice(0, 3).map(s => ({
        id: s._id,
        name: s.name,
        duration: Math.round((s.durationSec || 0) / 60),
        calories: s.calories,
        date: s.endedAt,
        muscles: [...new Set((s.entries || []).flatMap(e => e.muscles || [e.muscleGroup]).filter(Boolean))]
      }))
    });
  } catch (error) {
    logger.error('Erreur getWeeklyAnalytics:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation des analytics.' });
  }
};

/**
 * Generer un message motivant personnalise
 */
function generateMotivation(data) {
  const {
    sessionsCount,
    lastWeekCount,
    avgDuration,
    topMuscle,
    neglectedMuscles,
    trainingDays,
    notifClickRate,
    totalCalories,
    lastWeekCalories
  } = data;

  const messages = [];

  // Message principal selon l'activite
  if (sessionsCount === 0) {
    messages.push({
      type: 'encourage',
      title: "C'est pas grave!",
      text: "Reste focus, faut juste se lancer. Une seance et tu es reparti!"
    });
  } else if (sessionsCount < lastWeekCount) {
    messages.push({
      type: 'progress',
      title: "Continue comme ca!",
      text: `${sessionsCount} seance${sessionsCount > 1 ? 's' : ''} cette semaine. Tu peux faire mieux, la semaine derniere t'en avais ${lastWeekCount}!`
    });
  } else if (sessionsCount === lastWeekCount) {
    messages.push({
      type: 'good',
      title: "Regularite!",
      text: `${sessionsCount} seances comme la semaine derniere. Tu maintiens le rythme!`
    });
  } else if (sessionsCount <= 3) {
    messages.push({
      type: 'good',
      title: "Belle progression!",
      text: `${sessionsCount} seances, +${sessionsCount - lastWeekCount} par rapport a la semaine derniere!`
    });
  } else {
    messages.push({
      type: 'champion',
      title: "Semaine incroyable!",
      text: `${sessionsCount} seances! Tu es une machine!`
    });
  }

  // Insight sur les muscles
  if (topMuscle && sessionsCount > 0) {
    messages.push({
      type: 'insight',
      title: `Focus ${topMuscle}`,
      text: `Tu as bien travaille les ${topMuscle} cette semaine avec ${data.topMuscle} exercices.`
    });
  }

  // Suggestion muscles negliges
  if (neglectedMuscles.length > 0 && neglectedMuscles.length <= 3 && sessionsCount > 0) {
    messages.push({
      type: 'tip',
      title: "A ne pas oublier",
      text: `Pense a travailler: ${neglectedMuscles.slice(0, 2).join(', ')} cette semaine!`
    });
  }

  // Insight duree
  if (avgDuration > 0) {
    if (avgDuration < 30) {
      messages.push({
        type: 'tip',
        title: "Seances rapides",
        text: `${avgDuration} min en moyenne. Prends ton temps pour de meilleurs resultats!`
      });
    } else if (avgDuration > 90) {
      messages.push({
        type: 'tip',
        title: "Longues seances",
        text: `${avgDuration} min en moyenne. Attention a ne pas te surentrainer!`
      });
    }
  }

  // Insight calories
  if (totalCalories > lastWeekCalories && lastWeekCalories > 0) {
    const diff = totalCalories - lastWeekCalories;
    messages.push({
      type: 'achievement',
      title: "Record calories!",
      text: `+${diff} kcal par rapport a la semaine derniere!`
    });
  }

  // Engagement notifications
  if (notifClickRate > 50) {
    messages.push({
      type: 'engagement',
      title: "Toujours connecte!",
      text: `Tu cliques sur ${notifClickRate}% de tes notifs. Continue a rester motive!`
    });
  }

  return messages;
}

/**
 * Stats globales des notifications pour l'admin
 * GET /api/analytics/admin/notifications
 */
exports.getAdminNotificationStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Stats par jour
    const dailyStats = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          sent: { $sum: 1 },
          clicked: { $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] } },
          totalClicks: { $sum: '$clickCount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Stats par type
    const typeStats = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          sent: { $sum: 1 },
          clicked: { $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] } },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    // Top notifications par taux de clic
    const topNotifications = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          clickCount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$title',
          type: { $first: '$type' },
          count: { $sum: 1 },
          totalClicks: { $sum: '$clickCount' }
        }
      },
      {
        $project: {
          title: '$_id',
          type: 1,
          count: 1,
          totalClicks: 1,
          avgClicks: { $divide: ['$totalClicks', '$count'] }
        }
      },
      { $sort: { avgClicks: -1 } },
      { $limit: 10 }
    ]);

    // Totaux
    const totals = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSent: { $sum: 1 },
          totalClicked: { $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] } },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    res.json({
      period: days,
      totals: totals[0] || { totalSent: 0, totalClicked: 0, totalClicks: 0 },
      clickRate: totals[0] ? Math.round((totals[0].totalClicked / totals[0].totalSent) * 100) : 0,
      dailyStats,
      typeStats,
      topNotifications
    });
  } catch (error) {
    logger.error('Erreur getAdminNotificationStats:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation des stats admin.' });
  }
};

module.exports = exports;
