const cron = require('node-cron');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const User = require('../models/User');
const { calculateUserStats } = require('../controllers/leaderboard.controller');
const logger = require('../utils/logger.js');

/**
 * Mise à jour automatique des stats du leaderboard
 * S'exécute tous les jours à 3h du matin
 */
function startLeaderboardCron() {
  // Tous les jours à 3h du matin
  cron.schedule('0 3 * * *', async () => {
    logger.info('🏆 [CRON] Mise à jour des stats du leaderboard...');

    try {
      const entries = await LeaderboardEntry.find({}).lean();

      let updated = 0;
      let errors = 0;

      for (const entry of entries) {
        try {
          const stats = await calculateUserStats(entry.userId);

          // Récupérer les infos utilisateur pour mettre à jour l'avatar
          const user = await User.findById(entry.userId);
          const avatarUrl = user?.photo || null;

          await LeaderboardEntry.findByIdAndUpdate(entry._id, {
            stats,
            avatarUrl,
            displayName: user?.pseudo || user?.prenom || 'Anonyme',
            lastUpdated: new Date(),
          });

          updated++;
        } catch (err) {
          logger.error(`❌ Erreur pour userId ${entry.userId}:`, err.message);
          errors++;
        }
      }

      logger.info(
        `✅ [CRON] Leaderboard mis à jour: ${updated} entrées mises à jour, ${errors} erreurs`
      );
    } catch (error) {
      logger.error('❌ [CRON] Erreur lors de la mise à jour du leaderboard:', error);
    }
  });

  logger.info('🏆 Cron job leaderboard démarré (tous les jours à 3h)');
}

module.exports = { startLeaderboardCron };