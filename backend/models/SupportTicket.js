const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    conversationId: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['technical', 'billing', 'account', 'feature_request', 'other'],
      default: 'other'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200
    },
    lastUserMessage: {
      type: String,
      maxlength: 500
    },
    lastUserMessageAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: {
      type: String,
      maxlength: 2000
    },
    messageCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Index pour recherche rapide
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

// Méthodes utiles
supportTicketSchema.methods.isOpen = function() {
  return this.status === 'open' || this.status === 'in_progress';
};

supportTicketSchema.methods.resolve = function(adminId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = adminId;
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
