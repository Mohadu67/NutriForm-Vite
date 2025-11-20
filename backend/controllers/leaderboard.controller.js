const LeaderboardEntry = require('../models/LeaderboardEntry');
const WorkoutSession = require('../models/WorkoutSession');
const User = require('../models/User');

/**
 * Obtenir le classement global
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'alltime', type = 'all', limit = 50 } = req.query;

    let sortField = 'stats.totalSessions';

    // Déterminer le champ de tri selon la période
    if (period === 'week') {
      sortField = 'stats.thisWeekSessions';
    } else if (period === 'month') {
      sortField = 'stats.thisMonthSessions';
    }

    // Déterminer le champ selon le type d'exercice
    if (type === 'muscu') {
      sortField = 'stats.muscuSessions';
    } else if (type === 'cardio') {
      sortField = 'stats.cardioSessions';
    } else if (type === 'poids_corps') {
      sortField = 'stats.poidsCorpsSessions';
    }

    const leaderboard = await LeaderboardEntry.find({ visibility: 'public' })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('-userId -createdAt -updatedAt -__v')
      .lean();

    // Ajouter le rang
    const leaderboardWithRank = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.json({
      success: true,
      period,
      type,
      data: leaderboardWithRank,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du classement',
    });
  }
};

/**
 * Obtenir le rang d'un utilisateur spécifique
 */
exports.getUserRank = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'alltime', type = 'all' } = req.query;

    // Vérifier que l'utilisateur existe dans le leaderboard
    const userEntry = await LeaderboardEntry.findOne({ userId }).lean();

    if (!userEntry) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé dans le classement',
      });
    }

    let sortField = 'stats.totalSessions';

    if (period === 'week') {
      sortField = 'stats.thisWeekSessions';
    } else if (period === 'month') {
      sortField = 'stats.thisMonthSessions';
    }

    if (type === 'muscu') {
      sortField = 'stats.muscuSessions';
    } else if (type === 'cardio') {
      sortField = 'stats.cardioSessions';
    } else if (type === 'poids_corps') {
      sortField = 'stats.poidsCorpsSessions';
    }

    // Compter combien d'utilisateurs ont un meilleur score
    const rank = await LeaderboardEntry.countDocuments({
      visibility: 'public',
      [sortField]: { $gt: userEntry.stats[sortField.split('.')[1]] },
    });

    res.json({
      success: true,
      rank: rank + 1,
      userEntry,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du rang:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du rang',
    });
  }
};

/**
 * Opt-in au leaderboard (rendre son profil public)
 */
exports.optIn = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les infos utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Calculer les stats de l'utilisateur
    const stats = await calculateUserStats(userId);

    // L'URL de l'avatar est déjà complète (Cloudinary) ou null
    const avatarUrl = user.photo || null;

    // Créer ou mettre à jour l'entrée leaderboard
    const leaderboardEntry = await LeaderboardEntry.findOneAndUpdate(
      { userId },
      {
        userId,
        displayName: user.pseudo || user.prenom || 'Anonyme',
        avatarUrl,
        stats,
        visibility: 'public',
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Vous êtes maintenant visible dans le classement',
      data: leaderboardEntry,
    });
  } catch (error) {
    console.error('Erreur lors de l\'opt-in au leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription au classement',
    });
  }
};

/**
 * Opt-out du leaderboard (masquer son profil)
 */
exports.optOut = async (req, res) => {
  try {
    const userId = req.user.id;

    const leaderboardEntry = await LeaderboardEntry.findOneAndUpdate(
      { userId },
      { visibility: 'private' },
      { new: true }
    );

    if (!leaderboardEntry) {
      return res.status(404).json({
        success: false,
        message: 'Entrée leaderboard non trouvée',
      });
    }

    res.json({
      success: true,
      message: 'Vous avez été retiré du classement public',
      data: leaderboardEntry,
    });
  } catch (error) {
    console.error('Erreur lors de l\'opt-out du leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désinscription du classement',
    });
  }
};

/**
 * Obtenir le statut de participation au leaderboard
 */
exports.getOptInStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const leaderboardEntry = await LeaderboardEntry.findOne({ userId }).lean();

    if (!leaderboardEntry) {
      return res.json({
        success: true,
        isOptedIn: false,
        data: null,
      });
    }

    res.json({
      success: true,
      isOptedIn: leaderboardEntry.visibility === 'public',
      data: leaderboardEntry,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut',
    });
  }
};

/**
 * Fonction helper pour calculer les stats d'un utilisateur
 */
async function calculateUserStats(userId) {
  const sessions = await WorkoutSession.find({
    userId,
    status: 'finished',
  }).lean();

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let totalCalories = 0;
  let totalDurationMin = 0;
  let thisWeekSessions = 0;
  let thisMonthSessions = 0;
  let muscuSessions = 0;
  let cardioSessions = 0;
  let poidsCorpsSessions = 0;

  sessions.forEach((session) => {
    totalCalories += session.calories || 0;
    totalDurationMin += Math.floor((session.durationSec || 0) / 60);

    const sessionDate = new Date(session.endedAt || session.createdAt);

    if (sessionDate >= oneWeekAgo) {
      thisWeekSessions++;
    }

    if (sessionDate >= oneMonthAgo) {
      thisMonthSessions++;
    }

    // Compter par type d'exercice dominant
    if (session.entries && session.entries.length > 0) {
      const types = session.entries.map((e) => e.type);
      const muscuCount = types.filter((t) => t === 'muscu').length;
      const cardioCount = types.filter((t) => t === 'cardio').length;
      const poidsCorpsCount = types.filter((t) => t === 'poids_du_corps').length;

      if (muscuCount >= cardioCount && muscuCount >= poidsCorpsCount) {
        muscuSessions++;
      } else if (cardioCount >= poidsCorpsCount) {
        cardioSessions++;
      } else {
        poidsCorpsSessions++;
      }
    }
  });

  // Calculer la streak (jours consécutifs)
  const currentStreak = calculateStreak(sessions);

  return {
    totalSessions: sessions.length,
    totalCaloriesBurned: totalCalories,
    totalDurationMin,
    currentStreak,
    thisWeekSessions,
    thisMonthSessions,
    muscuSessions,
    cardioSessions,
    poidsCorpsSessions,
  };
}

/**
 * Calculer le nombre de jours consécutifs avec au moins une séance
 */
function calculateStreak(sessions) {
  if (sessions.length === 0) return 0;

  // Trier par date décroissante
  const sortedSessions = sessions
    .map((s) => new Date(s.endedAt || s.createdAt))
    .sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  // Vérifier si la dernière séance est aujourd'hui ou hier
  const lastSessionDate = new Date(sortedSessions[0]);
  lastSessionDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    // Pas de streak active
    return 0;
  }

  // Compter les jours consécutifs
  const sessionDates = new Set(
    sortedSessions.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  while (sessionDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

module.exports.calculateUserStats = calculateUserStats;