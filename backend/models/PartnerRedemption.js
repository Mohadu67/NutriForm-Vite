const mongoose = require('mongoose');

const partnerRedemptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
    index: true
  },
  xpSpent: {
    type: Number,
    required: true
  },
  xpBalanceBefore: {
    type: Number,
    required: true
  },
  xpBalanceAfter: {
    type: Number,
    required: true
  },
  promoCodeRevealed: {
    type: String,
    required: true
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index compose pour eviter les doublons (un user ne peut avoir qu'un seul code par partenaire)
partnerRedemptionSchema.index({ userId: 1, partnerId: 1 });

// Index pour recherche rapide
partnerRedemptionSchema.index({ userId: 1, status: 1 });
partnerRedemptionSchema.index({ partnerId: 1 });

// Methode statique pour verifier si un user a deja rachete cette offre
partnerRedemptionSchema.statics.hasUserRedeemed = async function(userId, partnerId) {
  const count = await this.countDocuments({ userId, partnerId });
  return count > 0;
};

// Methode statique pour compter les rachats d'un user pour un partenaire
partnerRedemptionSchema.statics.getUserRedemptionCount = async function(userId, partnerId) {
  return this.countDocuments({ userId, partnerId });
};

module.exports = mongoose.model('PartnerRedemption', partnerRedemptionSchema);
