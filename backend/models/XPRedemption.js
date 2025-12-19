const mongoose = require('mongoose');

const xpRedemptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  xpSpent: {
    type: Number,
    required: true,
    default: 10000
  },
  monthsRedeemed: {
    type: Number,
    required: true,
    default: 1
  },
  xpBalanceBefore: {
    type: Number,
    required: true
  },
  xpBalanceAfter: {
    type: Number,
    required: true
  },
  subscriptionType: {
    type: String,
    enum: ['stripe_extended', 'xp_paid'],
    required: true
  },
  premiumStartDate: {
    type: Date,
    required: true
  },
  premiumEndDate: {
    type: Date,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

// Index pour recherche rapide
xpRedemptionSchema.index({ userId: 1, status: 1 });
xpRedemptionSchema.index({ premiumEndDate: 1 });

module.exports = mongoose.model('XPRedemption', xpRedemptionSchema);
