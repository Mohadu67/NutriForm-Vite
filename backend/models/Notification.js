const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Utilisateur qui reçoit la notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Type de notification
  type: {
    type: String,
    enum: ['message', 'match', 'system', 'activity', 'admin', 'support'],
    default: 'system'
  },

  // Titre de la notification
  title: {
    type: String,
    required: true,
    maxlength: 200
  },

  // Message/contenu
  message: {
    type: String,
    maxlength: 500
  },

  // Avatar (URL de l'image)
  avatar: {
    type: String
  },

  // Lien de redirection
  link: {
    type: String
  },

  // Statut de lecture
  read: {
    type: Boolean,
    default: false
  },

  // Métadonnées supplémentaires (conversationId, matchId, etc.)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index pour récupérer rapidement les notifications d'un utilisateur
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

// Supprimer automatiquement les notifications de plus de 30 jours
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
