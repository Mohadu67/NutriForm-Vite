const cron = require('node-cron');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const XPRedemption = require('../models/XPRedemption');
const Notification = require('../models/Notification');
const { sendNotificationToUser } = require('../services/pushNotification.service');
const logger = require('../utils/logger.js');

/**
 * Verification des Premium XP expires
 * S'execute tous les jours a 00:05
 */
async function checkExpiredXpPremiums() {
  logger.info('💎 [CRON] Verification des Premium XP expires...');

  try {
    const now = new Date();

    // Trouver les users avec XP Premium expire
    const expiredUsers = await User.find({
      xpPremiumExpiresAt: { $lt: now, $ne: null },
      subscriptionTier: 'premium'
    });

    let downgraded = 0;
    let stillPremium = 0;

    for (const user of expiredUsers) {
      try {
        // Verifier s'ils ont un abonnement Stripe actif
        const stripeSubscription = await Subscription.findOne({
          userId: user._id,
          status: { $in: ['active', 'trialing'] }
        });

        if (stripeSubscription && stripeSubscription.isActive()) {
          // User a toujours un abonnement Stripe actif - ne pas downgrader
          // Juste nettoyer le champ xpPremiumExpiresAt
          user.xpPremiumExpiresAt = null;
          await user.save();
          stillPremium++;
          continue;
        }

        // Downgrader vers free
        user.subscriptionTier = 'free';
        user.xpPremiumExpiresAt = null;
        await user.save();

        // Marquer les rachats comme expires
        await XPRedemption.updateMany(
          { userId: user._id, status: 'active', premiumEndDate: { $lt: now } },
          { status: 'expired' }
        );

        // Envoyer notification
        const notifTitle = 'Premium XP expire';
        const notifMessage = 'Votre periode Premium obtenue avec XP est terminee. Gagnez plus d\'XP ou abonnez-vous pour continuer a profiter des fonctionnalites Premium !';

        await Notification.create({
          userId: user._id,
          type: 'activity',
          title: notifTitle,
          message: notifMessage,
          link: '/pricing',
          metadata: {
            action: 'xp_premium_expired'
          }
        });

        await sendNotificationToUser(user._id, {
          title: notifTitle,
          body: notifMessage,
          icon: '/assets/icons/notif-warning.svg',
          data: {
            type: 'xp_premium_expired',
            url: '/pricing'
          }
        });

        downgraded++;
        logger.info(`User ${user._id} (${user.email}) downgrade de Premium XP vers Free`);

      } catch (err) {
        logger.error(`Erreur pour user ${user._id}:`, err.message);
      }
    }

    logger.info(`💎 [CRON] XP Premium: ${downgraded} users downgrades, ${stillPremium} toujours Premium Stripe`);

  } catch (error) {
    logger.error('💎 [CRON] Erreur checkExpiredXpPremiums:', error);
  }
}

/**
 * Demarrer le CRON job pour la verification des Premium XP
 */
function startXpPremiumCron() {
  // Tous les jours a 00:05
  cron.schedule('5 0 * * *', checkExpiredXpPremiums, {
    timezone: 'Europe/Paris'
  });

  logger.info('💎 XP Premium CRON job demarre');
}

module.exports = {
  startXpPremiumCron,
  checkExpiredXpPremiums
};
