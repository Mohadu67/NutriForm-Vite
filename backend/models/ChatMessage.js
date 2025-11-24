const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'bot', 'admin'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    escalated: {
      type: Boolean,
      default: false
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    metadata: {
      confidence: { type: Number, min: 0, max: 1 }, // Confiance de la réponse bot
      intent: String, // Intent détecté par le bot
      escalationReason: String // Raison de l'escalade
    }
  },
  {
    timestamps: true
  }
);

// Index composé pour retrouver rapidement les messages d'une conversation
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });

// Méthode pour vérifier si un message a été escaladé
chatMessageSchema.methods.isEscalated = function() {
  return this.escalated === true;
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
