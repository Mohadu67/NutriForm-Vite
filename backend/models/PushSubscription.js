const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Web Push (VAPID)
  endpoint: {
    type: String,
    sparse: true // Permet null mais unique si défini
  },
  keys: {
    p256dh: { type: String },
    auth: { type: String }
  },
  // Expo Push (Mobile)
  expoPushToken: {
    type: String,
    sparse: true // Permet null mais unique si défini
  },
  // Type de subscription
  type: {
    type: String,
    enum: ['web', 'expo'],
    default: 'web'
  },
  deviceInfo: {
    browser: String,
    os: String,
    platform: String,
    deviceName: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour recherche rapide
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 });
pushSubscriptionSchema.index({ userId: 1, expoPushToken: 1 });
pushSubscriptionSchema.index({ expoPushToken: 1 }, { sparse: true });

// Middleware pour définir le type automatiquement
pushSubscriptionSchema.pre('save', function(next) {
  if (this.expoPushToken && !this.endpoint) {
    this.type = 'expo';
  } else if (this.endpoint) {
    this.type = 'web';
  }
  next();
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
