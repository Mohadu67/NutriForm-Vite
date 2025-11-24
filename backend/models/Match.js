const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // Utilisateurs impliqués
  user1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Score de compatibilité (0-100)
  matchScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  // Détail du score par critère
  scoreBreakdown: {
    proximityScore: { type: Number, default: 0 }, // /40 points
    workoutTypeScore: { type: Number, default: 0 }, // /25 points
    fitnessLevelScore: { type: Number, default: 0 }, // /20 points
    availabilityScore: { type: Number, default: 0 } // /15 points
  },

  // Distance réelle en km
  distance: {
    type: Number,
    required: true
  },

  // Statut du match
  status: {
    type: String,
    enum: ['pending', 'user1_liked', 'user2_liked', 'mutual', 'rejected', 'blocked'],
    default: 'pending'
  },

  // Qui a liké qui
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // ID de conversation si match mutuel
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
  },

  // Pop-up sessions partagées (future feature)
  sharedSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PopupSession'
  }],

  // Métadata
  viewedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
  }
}, {
  timestamps: true
});

// Index composites pour performance
matchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
matchSchema.index({ user1Id: 1, matchScore: -1 });
matchSchema.index({ user2Id: 1, matchScore: -1 });
matchSchema.index({ status: 1, matchScore: -1 });
matchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-suppression après expiration

// Méthode pour vérifier si c'est un match mutuel
matchSchema.methods.isMutual = function() {
  return this.status === 'mutual' && this.likedBy.length === 2;
};

// Méthode pour enregistrer un like
matchSchema.methods.addLike = function(userId) {
  if (!this.likedBy.includes(userId)) {
    this.likedBy.push(userId);
  }

  // Vérifier si c'est un match mutuel
  if (this.likedBy.length === 2) {
    this.status = 'mutual';
  } else if (this.user1Id.equals(userId)) {
    this.status = 'user1_liked';
  } else if (this.user2Id.equals(userId)) {
    this.status = 'user2_liked';
  }

  return this.save();
};

// Méthode pour vérifier si un utilisateur a déjà vu ce match
matchSchema.methods.hasBeenViewedBy = function(userId) {
  return this.viewedBy.some(v => v.userId.equals(userId));
};

// Méthode pour enregistrer une vue
matchSchema.methods.markAsViewed = function(userId) {
  if (!this.hasBeenViewedBy(userId)) {
    this.viewedBy.push({ userId, viewedAt: new Date() });
  }
  return this.save();
};

module.exports = mongoose.model('Match', matchSchema);
