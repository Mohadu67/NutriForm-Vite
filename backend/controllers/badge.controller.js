const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const Challenge = require('../models/Challenge');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/pushNotification.service');

// Obtenir tous les badges disponibles
exports.getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ active: true })
      .sort({ category: 1, sortOrder: 1 });

    // Grouper par catégorie
    const grouped = badges.reduce((acc, badge) => {
      if (!acc[badge.category]) {
        acc[badge.category] = [];
      }
      acc[badge.category].push(badge);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        all: badges,
        grouped
      }
    });

  } catch (error) {
    logger.error('Erreur récupération badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des badges'
    });
  }
};

// Obtenir les badges d'un utilisateur
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;

    const userBadges = await UserBadge.getUserBadges(userId);
    const displayedBadges = await UserBadge.getDisplayedBadges(userId);
    const totalBadges = await Badge.countDocuments({ active: true });
    const unlockedCount = userBadges.length;

    res.json({
      success: true,
      data: {
        badges: userBadges,
        displayed: displayedBadges,
        stats: {
          unlocked: unlockedCount,
          total: totalBadges,
          percentage: Math.round((unlockedCount / totalBadges) * 100)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération badges user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des badges'
    });
  }
};

// Mettre à jour les badges affichés
exports.setDisplayedBadges = async (req, res) => {
  try {
    const userId = req.userId;
    const { badgeCodes } = req.body;

    if (!Array.isArray(badgeCodes)) {
      return res.status(400).json({
        success: false,
        message: 'badgeCodes doit être un tableau'
      });
    }

    const displayed = await UserBadge.setDisplayed(userId, badgeCodes);

    res.json({
      success: true,
      message: 'Badges affichés mis à jour',
      data: displayed
    });

  } catch (error) {
    logger.error('Erreur mise à jour badges affichés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// Vérifier et attribuer les badges (appelé après chaque action)
exports.checkAndAwardBadges = async (userId) => {
  try {
    const results = [];

    // Récupérer les stats de l'utilisateur
    const leaderboardEntry = await LeaderboardEntry.findOne({ userId });
    if (!leaderboardEntry) return results;

    const stats = leaderboardEntry.stats || {};

    // Récupérer les stats de défis
    const challengeWins = await Challenge.countDocuments({
      winnerId: userId,
      status: 'completed'
    });

    // Liste des badges à vérifier
    const badgesToCheck = [
      // Streak badges
      { code: 'streak_7', check: () => stats.currentStreak >= 7 },
      { code: 'streak_30', check: () => stats.currentStreak >= 30 },
      { code: 'streak_60', check: () => stats.currentStreak >= 60 },
      { code: 'streak_100', check: () => stats.currentStreak >= 100 },
      { code: 'streak_365', check: () => stats.currentStreak >= 365 },

      // Sessions badges
      { code: 'sessions_10', check: () => stats.totalSessions >= 10 },
      { code: 'sessions_50', check: () => stats.totalSessions >= 50 },
      { code: 'sessions_100', check: () => stats.totalSessions >= 100 },
      { code: 'sessions_500', check: () => stats.totalSessions >= 500 },
      { code: 'sessions_1000', check: () => stats.totalSessions >= 1000 },

      // Challenge badges
      { code: 'challenger_1', check: () => challengeWins >= 1 },
      { code: 'challenger_5', check: () => challengeWins >= 5 },
      { code: 'challenger_10', check: () => challengeWins >= 10 },
      { code: 'challenger_25', check: () => challengeWins >= 25 }
    ];

    // Vérifier chaque badge
    for (const badgeCheck of badgesToCheck) {
      if (badgeCheck.check()) {
        const hasBadge = await UserBadge.hasBadge(userId, badgeCheck.code);
        if (!hasBadge) {
          const result = await UserBadge.awardBadge(userId, badgeCheck.code);
          if (result.awarded) {
            results.push(result);

            // Envoyer notification
            try {
              await sendNotificationToUser(userId, {
                title: '🎖️ Nouveau badge!',
                body: `Tu as débloqué "${result.badgeInfo.name}"! +${result.xpReward} XP`,
                data: {
                  type: 'badge_unlocked',
                  badgeCode: badgeCheck.code,
                  url: '/leaderboard'
                }
              });
            } catch (notifErr) {
              logger.error('Erreur envoi notification badge:', notifErr);
            }

            // Mettre à jour XP dans LeaderboardEntry
            await LeaderboardEntry.findOneAndUpdate(
              { userId },
              { $inc: { xp: result.xpReward } }
            );
          }
        }
      }
    }

    return results;

  } catch (error) {
    logger.error('Erreur vérification badges:', error);
    return [];
  }
};

// Seed les badges (route admin)
exports.seedBadges = async (req, res) => {
  try {
    const count = await Badge.seedBadges();
    res.json({
      success: true,
      message: `${count} badges créés/mis à jour`
    });
  } catch (error) {
    logger.error('Erreur seed badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du seed des badges'
    });
  }
};

// Vérification manuelle des badges pour un user (utile pour debug/admin)
exports.checkBadgesManually = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const awarded = await exports.checkAndAwardBadges(userId);

    res.json({
      success: true,
      message: `${awarded.length} nouveaux badges attribués`,
      data: awarded
    });

  } catch (error) {
    logger.error('Erreur vérification manuelle badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
};
