const mongoose = require('mongoose');
const logger = require('../utils/logger');

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
    },

    // Utilisateurs ayant supprimé/masqué cette conversation localement
    hiddenBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    // Paramètres par utilisateur (sourdine, messages temporaires)
    settings: {
      type: Map,
      of: {
        isMuted: { type: Boolean, default: false },
        tempMessagesDuration: { type: Number, default: 0 } // en heures, 0 = désactivé
      },
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Index pour recherche rapide (matchId a déjà un index via unique: true)
conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });
// Index composite pour requête getConversations optimisée
conversationSchema.index({ participants: 1, isActive: 1, 'lastMessage.timestamp': -1 });
conversationSchema.index({ participants: 1, hiddenBy: 1, isActive: 1 });

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

// Méthode pour masquer la conversation pour un utilisateur (suppression locale)
conversationSchema.methods.hideForUser = function(userId) {
  try {
    // S'assurer que hiddenBy est initialisé
    if (!this.hiddenBy) {
      this.hiddenBy = [];
    }

    // Convertir en string pour comparaison
    const userIdStr = userId.toString();

    // Vérifier si pas déjà dans hiddenBy
    const isAlreadyHidden = this.hiddenBy.some(id => id.toString() === userIdStr);

    if (!isAlreadyHidden) {
      this.hiddenBy.push(userId);
    }

    return this.save();
  } catch (error) {
    logger.error('Erreur dans hideForUser:', error);
    throw error;
  }
};

// Méthode pour réafficher la conversation pour un utilisateur
conversationSchema.methods.unhideForUser = function(userId) {
  try {
    if (!this.hiddenBy) {
      return this.save();
    }

    const userIdStr = userId.toString();
    this.hiddenBy = this.hiddenBy.filter(id => id.toString() !== userIdStr);
    return this.save();
  } catch (error) {
    logger.error('Erreur dans unhideForUser:', error);
    throw error;
  }
};

// Méthode pour vérifier si la conversation est cachée pour un utilisateur
conversationSchema.methods.isHiddenForUser = function(userId) {
  try {
    if (!this.hiddenBy || this.hiddenBy.length === 0) {
      return false;
    }

    const userIdStr = userId.toString();
    return this.hiddenBy.some(id => id.toString() === userIdStr);
  } catch (error) {
    logger.error('Erreur dans isHiddenForUser:', error);
    return false;
  }
};

module.exports = mongoose.model('Conversation', conversationSchema);
