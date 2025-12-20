const mongoose = require('mongoose');
const Partner = require('../models/Partner');
const PartnerRedemption = require('../models/PartnerRedemption');
const User = require('../models/User');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const Notification = require('../models/Notification');
const { sendNotificationToUser } = require('../services/pushNotification.service');
const { notifyAllUsers } = require('../services/adminNotification.service');
const logger = require('../utils/logger');

// ============================================
// ENDPOINTS PUBLICS
// ============================================

/**
 * @route   GET /api/partners
 * @desc    Obtenir la liste des partenaires actifs
 * @access  Public
 */
exports.getActivePartners = async (req, res) => {
  try {
    const now = new Date();

    const partners = await Partner.find({
      isActive: true,
      $or: [
        { startsAt: null },
        { startsAt: { $lte: now } }
      ]
    }).sort({ createdAt: -1 }).lean();

    // Filtrer ceux qui sont expires ou ont atteint leur limite
    const availablePartners = partners.filter(p => {
      if (p.expiresAt && p.expiresAt < now) return false;
      if (p.maxRedemptions !== null && p.redemptionCount >= p.maxRedemptions) return false;
      return true;
    });

    // Ne pas envoyer le code promo dans la liste publique
    const sanitizedPartners = availablePartners.map(p => ({
      ...p,
      promoCode: undefined // Cache le code promo
    }));

    res.json({
      success: true,
      partners: sanitizedPartners
    });
  } catch (error) {
    logger.error('Erreur getActivePartners:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des partenaires'
    });
  }
};

/**
 * @route   GET /api/partners/:id
 * @desc    Obtenir le detail d'un partenaire
 * @access  Public
 */
exports.getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findById(id).lean();

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partenaire introuvable'
      });
    }

    // Ne pas envoyer le code promo
    res.json({
      success: true,
      partner: {
        ...partner,
        promoCode: undefined
      }
    });
  } catch (error) {
    logger.error('Erreur getPartnerById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation du partenaire'
    });
  }
};

// ============================================
// ENDPOINTS USER (authentifie)
// ============================================

/**
 * @route   POST /api/partners/:id/redeem
 * @desc    Debloquer une offre partenaire avec des XP
 * @access  Private (User)
 */
exports.redeemPartnerOffer = async (req, res) => {
  try {
    const userId = req.userId;
    const { id: partnerId } = req.params;

    // Recuperer le partenaire
    const partner = await Partner.findById(partnerId);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partenaire introuvable'
      });
    }

    // Verifier si l'offre est disponible
    if (!partner.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Cette offre n\'est plus disponible'
      });
    }

    // Verifier si l'utilisateur a deja rachete cette offre
    const userRedemptionCount = await PartnerRedemption.getUserRedemptionCount(userId, partnerId);
    if (userRedemptionCount >= partner.maxPerUser) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez deja utilise cette offre'
      });
    }

    // Recuperer les XP de l'utilisateur
    const leaderboardEntry = await LeaderboardEntry.findOne({ userId });
    const currentXp = leaderboardEntry?.xp || 0;

    if (currentXp < partner.xpCost) {
      return res.status(400).json({
        success: false,
        message: 'XP insuffisants',
        required: partner.xpCost,
        current: currentXp
      });
    }

    // Deduire les XP
    const xpBalanceBefore = leaderboardEntry.xp;
    leaderboardEntry.xp -= partner.xpCost;
    leaderboardEntry.updateLeague();
    await leaderboardEntry.save();

    // Incrementer le compteur de rachats du partenaire
    partner.redemptionCount += 1;
    await partner.save();

    // Creer l'enregistrement de rachat
    const redemption = new PartnerRedemption({
      userId,
      partnerId,
      xpSpent: partner.xpCost,
      xpBalanceBefore,
      xpBalanceAfter: leaderboardEntry.xp,
      promoCodeRevealed: partner.promoCode,
      status: 'active'
    });
    await redemption.save();

    // Envoyer notification
    try {
      const notifTitle = 'Code promo debloque !';
      const notifMessage = `Tu as debloque ${partner.offerTitle} chez ${partner.name} !`;

      await Notification.create({
        userId,
        type: 'activity',
        title: notifTitle,
        message: notifMessage,
        link: '/rewards',
        metadata: {
          action: 'partner_redemption',
          partnerId: partner._id,
          partnerName: partner.name,
          xpSpent: partner.xpCost
        }
      });

      await sendNotificationToUser(userId, {
        title: notifTitle,
        body: notifMessage,
        icon: '/assets/icons/notif-reward.svg',
        data: {
          type: 'partner_redemption',
          url: '/rewards'
        }
      });

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
      logger.error('Erreur notification partner redemption:', notifError);
    }

    logger.info(`Partner Redemption: User ${userId} a debloque ${partner.name} pour ${partner.xpCost} XP`);

    res.json({
      success: true,
      message: `Code promo debloque ! Tu as utilise ${partner.xpCost.toLocaleString()} XP`,
      redemption: {
        id: redemption._id,
        partnerId: partner._id,
        partnerName: partner.name,
        offerTitle: partner.offerTitle,
        promoCode: partner.promoCode,
        xpSpent: partner.xpCost,
        remainingXp: leaderboardEntry.xp,
        website: partner.website
      }
    });

  } catch (error) {
    logger.error('Erreur redeemPartnerOffer:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du deblocage'
    });
  }
};

/**
 * @route   GET /api/partners/my-rewards
 * @desc    Obtenir mes offres debloquees
 * @access  Private (User)
 */
exports.getMyRewards = async (req, res) => {
  try {
    const userId = req.userId;

    const redemptions = await PartnerRedemption.find({ userId })
      .populate('partnerId', 'name logo offerTitle offerType offerValue website address category')
      .sort({ createdAt: -1 })
      .lean();

    // Formater les resultats
    const rewards = redemptions.map(r => ({
      id: r._id,
      partner: r.partnerId,
      promoCode: r.promoCodeRevealed,
      xpSpent: r.xpSpent,
      redeemedAt: r.redeemedAt,
      status: r.status
    }));

    res.json({
      success: true,
      rewards,
      totalXpSpent: redemptions.reduce((sum, r) => sum + r.xpSpent, 0)
    });

  } catch (error) {
    logger.error('Erreur getMyRewards:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @route   GET /api/partners/check-redemption/:partnerId
 * @desc    Verifier si l'utilisateur a deja rachete une offre
 * @access  Private (User)
 */
exports.checkRedemption = async (req, res) => {
  try {
    const userId = req.userId;
    const { partnerId } = req.params;

    const redemption = await PartnerRedemption.findOne({ userId, partnerId })
      .populate('partnerId', 'name offerTitle website')
      .lean();

    if (redemption) {
      res.json({
        success: true,
        hasRedeemed: true,
        redemption: {
          promoCode: redemption.promoCodeRevealed,
          partner: redemption.partnerId,
          redeemedAt: redemption.redeemedAt
        }
      });
    } else {
      res.json({
        success: true,
        hasRedeemed: false
      });
    }

  } catch (error) {
    logger.error('Erreur checkRedemption:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// ENDPOINTS ADMIN
// ============================================

/**
 * @route   GET /api/partners/admin
 * @desc    Obtenir tous les partenaires (admin)
 * @access  Private (Admin)
 */
exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      partners
    });
  } catch (error) {
    logger.error('Erreur getAllPartners:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des partenaires'
    });
  }
};

/**
 * @route   POST /api/partners/admin
 * @desc    Creer un partenaire (admin)
 * @access  Private (Admin)
 */
exports.createPartner = async (req, res) => {
  try {
    const partnerData = req.body;

    // Validation
    if (!partnerData.name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom est requis'
      });
    }

    if (!partnerData.offerTitle) {
      return res.status(400).json({
        success: false,
        message: 'Le titre de l\'offre est requis'
      });
    }

    if (!partnerData.promoCode) {
      return res.status(400).json({
        success: false,
        message: 'Le code promo est requis'
      });
    }

    if (partnerData.xpCost === undefined || partnerData.xpCost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le cout en XP est requis'
      });
    }

    // Convertir les dates vides en null
    if (partnerData.startsAt === '' || partnerData.startsAt === undefined) {
      partnerData.startsAt = null;
    }
    if (partnerData.expiresAt === '' || partnerData.expiresAt === undefined) {
      partnerData.expiresAt = null;
    }

    // Generer le slug
    if (!partnerData.slug) {
      partnerData.slug = partnerData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Verifier si le slug existe deja
    let slug = partnerData.slug;
    let counter = 1;
    while (await Partner.findOne({ slug })) {
      slug = `${partnerData.slug}-${counter}`;
      counter++;
    }
    partnerData.slug = slug;

    const partner = new Partner(partnerData);
    await partner.save();

    logger.info(`Partner cree: ${partner.name} (${partner._id})`);

    // Envoyer notification a tous les utilisateurs si le partenaire est actif
    if (partner.isActive && partner.isAvailable()) {
      const io = req.app.get('io');

      // Notification pour nouveau partenaire
      notifyAllUsers({
        title: 'Nouveau partenaire disponible !',
        message: `Decouvre ${partner.name}: ${partner.offerTitle} pour ${partner.xpCost.toLocaleString()} XP`,
        link: '/rewards',
        type: 'promo',
        metadata: {
          action: 'new_partner',
          partnerId: partner._id,
          partnerName: partner.name,
          offerTitle: partner.offerTitle,
          xpCost: partner.xpCost
        },
        io,
        icon: '/assets/icons/notif-reward.svg'
      }).catch(err => logger.error('Erreur notification nouveau partenaire:', err));
    }

    res.status(201).json({
      success: true,
      partner
    });
  } catch (error) {
    logger.error('Erreur createPartner:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un partenaire avec ce nom existe deja'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la creation du partenaire'
    });
  }
};

/**
 * @route   PUT /api/partners/admin/:id
 * @desc    Modifier un partenaire (admin)
 * @access  Private (Admin)
 */
exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Si le nom change, regenerer le slug
    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const partner = await Partner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partenaire introuvable'
      });
    }

    logger.info(`Partner modifie: ${partner.name} (${partner._id})`);

    res.json({
      success: true,
      partner
    });
  } catch (error) {
    logger.error('Erreur updatePartner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du partenaire'
    });
  }
};

/**
 * @route   DELETE /api/partners/admin/:id
 * @desc    Supprimer un partenaire (admin)
 * @access  Private (Admin)
 */
exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByIdAndDelete(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partenaire introuvable'
      });
    }

    // Optionnel: supprimer les redemptions associees
    // await PartnerRedemption.deleteMany({ partnerId: id });

    logger.info(`Partner supprime: ${partner.name} (${partner._id})`);

    res.json({
      success: true,
      message: 'Partenaire supprime'
    });
  } catch (error) {
    logger.error('Erreur deletePartner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du partenaire'
    });
  }
};

/**
 * @route   GET /api/partners/admin/:id/stats
 * @desc    Obtenir les stats d'un partenaire (admin)
 * @access  Private (Admin)
 */
exports.getPartnerStats = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findById(id).lean();

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partenaire introuvable'
      });
    }

    const redemptions = await PartnerRedemption.find({ partnerId: id })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .lean();

    const totalXpSpent = redemptions.reduce((sum, r) => sum + r.xpSpent, 0);

    res.json({
      success: true,
      partner,
      stats: {
        totalRedemptions: redemptions.length,
        totalXpSpent,
        redemptions: redemptions.map(r => ({
          user: r.userId?.username || 'Utilisateur supprime',
          xpSpent: r.xpSpent,
          redeemedAt: r.redeemedAt
        }))
      }
    });

  } catch (error) {
    logger.error('Erreur getPartnerStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
