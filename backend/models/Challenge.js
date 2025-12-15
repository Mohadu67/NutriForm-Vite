const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  // Participants
  challengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challengerName: {
    type: String,
    required: true
  },
  challengerAvatar: String,

  challengedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challengedName: {
    type: String,
    required: true
  },
  challengedAvatar: String,

  // Type de défi
  type: {
    type: String,
    enum: ['sessions', 'streak', 'calories', 'duration'],
    required: true
  },

  // Durée en jours
  duration: {
    type: Number,
    enum: [3, 7, 14],
    default: 7
  },

  // Status du défi
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'declined', 'cancelled'],
    default: 'pending',
    index: true
  },

  // Dates
  createdAt: {
    type: Date,
    default: Date.now
  },
  startDate: Date,
  endDate: Date,

  // Scores
  challengerScore: {
    type: Number,
    default: 0
  },
  challengedScore: {
    type: Number,
    default: 0
  },

  // Scores de départ (pour calculer la progression)
  challengerStartScore: {
    type: Number,
    default: 0
  },
  challengedStartScore: {
    type: Number,
    default: 0
  },

  // Résultat
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winnerName: String,

  // Gestion des notifications
  lastNotificationAt: Date,
  notificationsSent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index composé pour trouver les défis actifs d'un user
challengeSchema.index({ challengerId: 1, status: 1 });
challengeSchema.index({ challengedId: 1, status: 1 });
challengeSchema.index({ status: 1, endDate: 1 });

// Méthodes statiques
challengeSchema.statics.getActiveForUser = function(userId) {
  return this.find({
    $or: [
      { challengerId: userId },
      { challengedId: userId }
    ],
    status: 'active'
  }).sort({ endDate: 1 });
};

challengeSchema.statics.getPendingForUser = function(userId) {
  return this.find({
    challengedId: userId,
    status: 'pending'
  }).sort({ createdAt: -1 });
};

challengeSchema.statics.getHistoryForUser = function(userId, limit = 20) {
  return this.find({
    $or: [
      { challengerId: userId },
      { challengedId: userId }
    ],
    status: 'completed'
  })
  .sort({ endDate: -1 })
  .limit(limit);
};

// Méthode pour obtenir le label du type
challengeSchema.methods.getTypeLabel = function() {
  const labels = {
    sessions: 'séances',
    streak: 'jours de streak',
    calories: 'calories',
    duration: 'minutes'
  };
  return labels[this.type] || this.type;
};

// Méthode pour vérifier si un user est le gagnant actuel
challengeSchema.methods.getCurrentLeader = function() {
  if (this.challengerScore > this.challengedScore) {
    return {
      id: this.challengerId,
      name: this.challengerName,
      score: this.challengerScore,
      diff: this.challengerScore - this.challengedScore
    };
  } else if (this.challengedScore > this.challengerScore) {
    return {
      id: this.challengedId,
      name: this.challengedName,
      score: this.challengedScore,
      diff: this.challengedScore - this.challengerScore
    };
  }
  return null; // Égalité
};

// Méthode pour déterminer le gagnant final
challengeSchema.methods.determineWinner = function() {
  if (this.challengerScore > this.challengedScore) {
    this.winnerId = this.challengerId;
    this.winnerName = this.challengerName;
  } else if (this.challengedScore > this.challengerScore) {
    this.winnerId = this.challengedId;
    this.winnerName = this.challengedName;
  } else {
    // Égalité - pas de gagnant
    this.winnerId = null;
    this.winnerName = null;
  }
  return this;
};

module.exports = mongoose.model('Challenge', challengeSchema);
