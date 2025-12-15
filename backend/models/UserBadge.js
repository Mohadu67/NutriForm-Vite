const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },

  badgeCode: {
    type: String,
    required: true,
    index: true
  },

  // Date d'obtention
  unlockedAt: {
    type: Date,
    default: Date.now
  },

  // Badge affiché sur le profil (max 3)
  displayed: {
    type: Boolean,
    default: false
  },

  // Notification envoyée
  notified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index unique pour éviter les doublons
userBadgeSchema.index({ userId: 1, badgeCode: 1 }, { unique: true });
userBadgeSchema.index({ userId: 1, displayed: 1 });

// Méthodes statiques
userBadgeSchema.statics.getUserBadges = async function(userId) {
  return this.find({ userId })
    .populate('badgeId')
    .sort({ unlockedAt: -1 });
};

userBadgeSchema.statics.getDisplayedBadges = async function(userId) {
  return this.find({ userId, displayed: true })
    .populate('badgeId')
    .limit(3);
};

userBadgeSchema.statics.hasBadge = async function(userId, badgeCode) {
  const badge = await this.findOne({ userId, badgeCode });
  return !!badge;
};

userBadgeSchema.statics.awardBadge = async function(userId, badgeCode) {
  const Badge = mongoose.model('Badge');

  // Vérifier si l'utilisateur a déjà le badge
  const existing = await this.findOne({ userId, badgeCode });
  if (existing) {
    return { awarded: false, reason: 'already_owned', badge: existing };
  }

  // Récupérer le badge
  const badge = await Badge.findOne({ code: badgeCode, active: true });
  if (!badge) {
    return { awarded: false, reason: 'badge_not_found' };
  }

  // Créer l'entrée UserBadge
  const userBadge = await this.create({
    userId,
    badgeId: badge._id,
    badgeCode: badge.code,
    unlockedAt: new Date()
  });

  return {
    awarded: true,
    badge: userBadge,
    badgeInfo: badge,
    xpReward: badge.xpReward
  };
};

userBadgeSchema.statics.setDisplayed = async function(userId, badgeCodes) {
  // Retirer displayed de tous les badges de l'utilisateur
  await this.updateMany(
    { userId },
    { displayed: false }
  );

  // Mettre displayed à true pour les badges sélectionnés (max 3)
  const codesToDisplay = badgeCodes.slice(0, 3);
  await this.updateMany(
    { userId, badgeCode: { $in: codesToDisplay } },
    { displayed: true }
  );

  return this.getDisplayedBadges(userId);
};

userBadgeSchema.statics.countByUser = async function(userId) {
  return this.countDocuments({ userId });
};

module.exports = mongoose.model('UserBadge', userBadgeSchema);
