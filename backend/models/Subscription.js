const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    stripeCustomerId: {
      type: String,
      required: true
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true
    },
    stripePriceId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'],
      required: true
    },
    currentPeriodStart: {
      type: Date,
      default: null
    },
    currentPeriodEnd: {
      type: Date,
      default: null
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    trialStart: {
      type: Date,
      default: null
    },
    trialEnd: {
      type: Date,
      default: null
    },
    canceledAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Les index sur userId et stripeSubscriptionId sont automatiquement créés via "unique: true"
// Pas besoin de les redéfinir ici

// Méthode pour vérifier si la subscription est active (y compris trial)
// Note: même si cancelAtPeriodEnd=true, l'user garde l'accès jusqu'à currentPeriodEnd
subscriptionSchema.methods.isActive = function () {
  // Si le status est actif ou en trial
  if (['active', 'trialing'].includes(this.status)) {
    // Si annulé, vérifier que la période n'est pas terminée
    if (this.cancelAtPeriodEnd && this.currentPeriodEnd) {
      return new Date() < this.currentPeriodEnd;
    }
    return true;
  }
  return false;
};

// Méthode pour vérifier si l'utilisateur est en trial
subscriptionSchema.methods.isInTrial = function () {
  return this.status === 'trialing' && this.trialEnd && new Date() < this.trialEnd;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
