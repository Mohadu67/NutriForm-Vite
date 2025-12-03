const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    // Utilisateur propriétaire de la conversation
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // ID de conversation unique (UUID)
    conversationId: {
      type: String,
      required: true,
      unique: true
    },

    // Dernier message pour affichage
    lastMessage: {
      type: String,
      default: ''
    },

    // Ticket support associé (si escaladé)
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket',
      default: null
    },

    // Statut d'escalade
    escalated: {
      type: Boolean,
      default: false
    },

    // Statut actif
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index pour recherche rapide
aiConversationSchema.index({ userId: 1, conversationId: 1 });
aiConversationSchema.index({ updatedAt: -1 });
// Index composite pour requête getAIConversations optimisée
aiConversationSchema.index({ userId: 1, isActive: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
