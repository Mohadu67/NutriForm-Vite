const mongoose = require('mongoose');

const partnerRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Ce que l'IA a detecte
  category: {
    type: String,
    enum: ['nutrition', 'sport', 'equipement', 'wellness', 'vetements', 'complement', 'autre'],
    default: 'autre'
  },
  keyword: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  // Message original de l'utilisateur
  userMessage: {
    type: String,
    default: ''
  },
  conversationId: {
    type: String,
    default: ''
  },
  // Admin
  status: {
    type: String,
    enum: ['new', 'noted', 'resolved'],
    default: 'new'
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index pour agregation par keyword
partnerRequestSchema.index({ keyword: 1, createdAt: -1 });
partnerRequestSchema.index({ status: 1 });
partnerRequestSchema.index({ category: 1 });

module.exports = mongoose.model('PartnerRequest', partnerRequestSchema);