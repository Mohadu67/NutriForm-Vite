const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // Match associé (référence vers Match model)
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      unique: true
    },

    // Les deux participants
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],

    // Dernier message (pour affichage dans la liste)
    lastMessage: {
      content: {
        type: String,
        default: ''
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: null
      }
    },

    // Compteur de messages non lus par participant
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    },

    // Métadonnées
    isActive: {
      type: Boolean,
      default: true
    },

    // Bloquer la conversation (en cas de signalement)
    isBlocked: {
      type: Boolean,
      default: false
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index pour recherche rapide (matchId a déjà un index via unique: true)
conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

// Méthode pour vérifier si un utilisateur fait partie de la conversation
conversationSchema.methods.includesUser = function(userId) {
  return this.participants.some(p => p.equals(userId));
};

// Méthode pour obtenir l'autre participant
conversationSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(p => !p.equals(userId));
};

// Méthode pour obtenir le nombre de messages non lus pour un user
conversationSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Méthode pour incrémenter le compteur non lu
conversationSchema.methods.incrementUnread = function(userId) {
  const key = userId.toString();
  const current = this.unreadCount.get(key) || 0;
  this.unreadCount.set(key, current + 1);
  return this.save();
};

// Méthode pour réinitialiser le compteur non lu
conversationSchema.methods.resetUnread = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
