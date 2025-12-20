const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const XPRedemption = require('../models/XPRedemption');
const Notification = require('../models/Notification');
const { sendNotificationToUser } = require('../services/pushNotification.service');
const logger = require('../utils/logger.js');

// Constantes
const XP_COST_PER_MONTH = 10000;
const MAX_MONTHS_REDEEMABLE = 3;

/**
 * Ajouter des mois a une date
 */
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Verifier l'eligibilite au rachat XP
 * GET /api/xp-redemption/eligibility
 */
async function checkEligibility(req, res) {
  try {
    const userId = req.userId;

    // Recuperer les XP de l'utilisateur
    const leaderboardEntry = await LeaderboardEntry.findOne({ userId });
    const currentXp = leaderboardEntry?.xp || 0;

    // Calculer le nombre de mois rachetables
    const maxMonthsRedeemable = Math.min(
      Math.floor(currentXp / XP_COST_PER_MONTH),
      MAX_MONTHS_REDEEMABLE
    );

    // Verifier le statut actuel de l'abonnement
    const user = await User.findById(userId);
    const subscription = await Subscription.findOne({ userId });

    let currentSubscriptionStatus = 'free';
    let currentPremiumEndsAt = null;

    if (subscription && subscription.isActive()) {
      currentSubscriptionStatus = 'premium_stripe';
      currentPremiumEndsAt = subscription.currentPeriodEnd;
    } else if (user.xpPremiumExpiresAt && user.xpPremiumExpiresAt > new Date()) {
      currentSubscriptionStatus = 'premium_xp';
      currentPremiumEndsAt = user.xpPremiumExpiresAt;
    }

    res.json({
      eligible: maxMonthsRedeemable > 0,
      currentXp,
      xpCostPerMonth: XP_COST_PER_MONTH,
      maxMonthsRedeemable,
      currentSubscriptionStatus,
      currentPremiumEndsAt
    });

  } catch (error) {
    logger.error('Erreur checkEligibility:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Racheter XP pour Premium
 * POST /api/xp-redemption/redeem
 */
async function redeemXpForPremium(req, res) {
  try {
    const userId = req.userId;
    const { months = 1 } = req.body;

    // Validation du nombre de mois
    if (months < 1 || months > MAX_MONTHS_REDEEMABLE) {
      return res.status(400).json({
        error: `Vous pouvez racheter entre 1 et ${MAX_MONTHS_REDEEMABLE} mois`
      });
    }

    const totalXpCost = months * XP_COST_PER_MONTH;

    // Recuperer les XP de l'utilisateur
    const leaderboardEntry = await LeaderboardEntry.findOne({ userId });
    if (!leaderboardEntry || leaderboardEntry.xp < totalXpCost) {
      return res.status(400).json({
        error: 'XP insuffisants',
        required: totalXpCost,
        current: leaderboardEntry?.xp || 0
      });
    }

    // Recuperer user et abonnement
    const user = await User.findById(userId);
    const existingSubscription = await Subscription.findOne({ userId });

    let premiumStartDate, premiumEndDate, subscriptionType;

    // Determiner le type de rachat
    // Verifier si l'abonnement Stripe est valide (ID reel, pas un ID de test local)
    const hasValidStripeSubscription = existingSubscription &&
      existingSubscription.isActive() &&
      existingSubscription.stripeSubscriptionId &&
      existingSubscription.stripeSubscriptionId.startsWith('sub_') &&
      !existingSubscription.stripeSubscriptionId.includes('test_local');

    if (hasValidStripeSubscription) {
      // User a un abonnement Stripe actif - etendre via Stripe
      subscriptionType = 'stripe_extended';
      premiumStartDate = new Date(existingSubscription.currentPeriodEnd);
      premiumEndDate = addMonths(premiumStartDate, months);

      try {
        // Mettre a jour l'abonnement Stripe avec un trial_end etendu
        await stripe.subscriptions.update(existingSubscription.stripeSubscriptionId, {
          trial_end: Math.floor(premiumEndDate.getTime() / 1000),
          proration_behavior: 'none'
        });

        // Mettre a jour la subscription en base
        existingSubscription.currentPeriodEnd = premiumEndDate;
        await existingSubscription.save();

      } catch (stripeError) {
        // Si erreur Stripe (subscription introuvable, etc.), fallback sur XP-only
        logger.warn('Erreur Stripe, fallback sur Premium XP:', stripeError.message);

        subscriptionType = 'xp_paid';
        premiumStartDate = new Date();
        premiumEndDate = addMonths(premiumStartDate, months);

        user.subscriptionTier = 'premium';
        user.xpPremiumExpiresAt = premiumEndDate;
        await user.save();
      }

    } else {
      // User sans abonnement Stripe actif - creer un Premium XP
      subscriptionType = 'xp_paid';

      // Si le user a deja un Premium XP actif, etendre depuis la fin
      if (user.xpPremiumExpiresAt && user.xpPremiumExpiresAt > new Date()) {
        premiumStartDate = new Date(user.xpPremiumExpiresAt);
      } else {
        premiumStartDate = new Date();
      }

      premiumEndDate = addMonths(premiumStartDate, months);

      // Mettre a jour le user
      user.subscriptionTier = 'premium';
      user.xpPremiumExpiresAt = premiumEndDate;
      await user.save();
    }

    // Deduire les XP
    const xpBalanceBefore = leaderboardEntry.xp;
    leaderboardEntry.xp -= totalXpCost;
    leaderboardEntry.updateLeague(); // Recalculer la ligue
    await leaderboardEntry.save();

    // Creer l'enregistrement de rachat
    const redemption = new XPRedemption({
      userId,
      xpSpent: totalXpCost,
      monthsRedeemed: months,
      xpBalanceBefore,
      xpBalanceAfter: leaderboardEntry.xp,
      subscriptionType,
      premiumStartDate,
      premiumEndDate,
      stripeSubscriptionId: existingSubscription?.stripeSubscriptionId || null,
      status: 'active'
    });
    await redemption.save();

    // Envoyer notification
    try {
      const notifTitle = 'XP convertis en Premium !';
      const notifMessage = `Vous avez utilise ${totalXpCost.toLocaleString()} XP pour obtenir ${months} mois Premium !`;

      // Sauvegarder en base
      await Notification.create({
        userId,
        type: 'activity',
        title: notifTitle,
        message: notifMessage,
        link: '/profile',
        metadata: {
          action: 'xp_redemption',
          xpSpent: totalXpCost,
          monthsRedeemed: months
        }
      });

      // Envoyer push notification
      await sendNotificationToUser(userId, {
        title: notifTitle,
        body: notifMessage,
        icon: '/assets/icons/notif-xp.svg',
        data: {
          type: 'xp_redemption',
          url: '/profile'
        }
      });

      // WebSocket
      const io = req.app.get('io');
      if (io && io.notifyUser) {
        io.notifyUser(userId.toString(), 'new_notification', {
          type: 'activity',
          title: notifTitle,
          message: notifMessage,
          timestamp: new Date().toISOString()
        });
      }
    } catch (notifError) {
      logger.error('Erreur notification XP redemption:', notifError);
    }

    logger.info(`XP Redemption: User ${userId} a utilise ${totalXpCost} XP pour ${months} mois Premium (${subscriptionType})`);

    res.json({
      success: true,
      message: `Vous avez obtenu ${months} mois Premium avec ${totalXpCost.toLocaleString()} XP !`,
      redemption: {
        id: redemption._id,
        xpSpent: totalXpCost,
        monthsRedeemed: months,
        premiumStartDate,
        premiumEndDate,
        remainingXp: leaderboardEntry.xp,
        subscriptionType
      }
    });

  } catch (error) {
    logger.error('Erreur redeemXpForPremium:', error);
    res.status(500).json({ error: 'Erreur serveur lors du rachat' });
  }
}

/**
 * Recuperer l'historique des rachats
 * GET /api/xp-redemption/history
 */
async function getRedemptionHistory(req, res) {
  try {
    const userId = req.userId;

    const redemptions = await XPRedemption.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      redemptions,
      totalXpSpent: redemptions.reduce((sum, r) => sum + r.xpSpent, 0),
      totalMonthsRedeemed: redemptions.reduce((sum, r) => sum + r.monthsRedeemed, 0)
    });

  } catch (error) {
    logger.error('Erreur getRedemptionHistory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  checkEligibility,
  redeemXpForPremium,
  getRedemptionHistory,
  XP_COST_PER_MONTH,
  MAX_MONTHS_REDEEMABLE
};
