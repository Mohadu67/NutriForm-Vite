const mongoose = require('mongoose');

const matchMessageSchema = new mongoose.Schema(
  {
    // Conversation parente
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },

    // Match ID (pour référence rapide)
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true
    },

    // Expéditeur et destinataire
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Type de message
    type: {
      type: String,
      enum: ['text', 'location', 'session-invite', 'session-share', 'system'],
      default: 'text'
    },

    // Contenu du message (chiffré)
    content: {
      type: String,
      required: true,
      maxlength: 10000 // Plus long car chiffré
    },

    // Données de chiffrement (pour AES-256-GCM)
    encryption: {
      iv: {
        type: String,
        required: false // Optionnel pour compatibilité avec anciens messages
      },
      authTag: {
        type: String,
        required: false
      }
    },

    // Données supplémentaires selon le type
    metadata: {
      // Pour type: 'location'
      latitude: Number,
      longitude: Number,
      address: String,
      expiresAt: Date,

      // Pour type: 'session-invite'
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkoutSession'
      },

      // Pour type: 'session-share'
      sessionName: String,
      duration: Number,
      calories: Number,
      exercises: Number,
      imageData: String, // Base64 encoded image

      // Autres métadonnées
      attachmentUrl: String
    },

    // Statut de lecture
    read: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    },

    // Soft delete
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index composés pour performance
matchMessageSchema.index({ conversationId: 1, createdAt: 1 });
matchMessageSchema.index({ senderId: 1, createdAt: -1 });
matchMessageSchema.index({ receiverId: 1, read: 1, createdAt: -1 });

// Méthode pour marquer comme lu
matchMessageSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Méthode pour vérifier si le message est expiré (pour les locations)
matchMessageSchema.methods.isExpired = function() {
  if (this.type === 'location' && this.metadata.expiresAt) {
    return new Date() > this.metadata.expiresAt;
  }
  return false;
};

// Méthode pour soft delete
matchMessageSchema.methods.deleteForUser = function(userId) {
  if (!this.deletedBy.includes(userId)) {
    this.deletedBy.push(userId);
  }
  // Si les deux participants ont supprimé, marquer comme définitivement supprimé
  if (this.deletedBy.length === 2) {
    this.isDeleted = true;
  }
  return this.save();
};

module.exports = mongoose.model('MatchMessage', matchMessageSchema);
