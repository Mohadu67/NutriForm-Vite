const cron = require('node-cron');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const { calculateUserStats } = require('../controllers/leaderboard.controller');

/**
 * Mise à jour automatique des stats du leaderboard
 * S'exécute tous les jours à 3h du matin
 */
function startLeaderboardCron() {
  // Tous les jours à 3h du matin
  cron.schedule('0 3 * * *', async () => {
    console.log('🏆 [CRON] Mise à jour des stats du leaderboard...');

    try {
      const entries = await LeaderboardEntry.find({}).lean();

      let updated = 0;
      let errors = 0;

      for (const entry of entries) {
        try {
          const stats = await calculateUserStats(entry.userId);

          await LeaderboardEntry.findByIdAndUpdate(entry._id, {
            stats,
            lastUpdated: new Date(),
          });

          updated++;
        } catch (err) {
          console.error(`❌ Erreur pour userId ${entry.userId}:`, err.message);
          errors++;
        }
      }

      console.log(
        `✅ [CRON] Leaderboard mis à jour: ${updated} entrées mises à jour, ${errors} erreurs`
      );
    } catch (error) {
      console.error('❌ [CRON] Erreur lors de la mise à jour du leaderboard:', error);
    }
  });

  console.log('🏆 Cron job leaderboard démarré (tous les jours à 3h)');
}

module.exports = { startLeaderboardCron };