const mongoose = require('mongoose');

const partnershipProposalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['sport', 'nutrition', 'wellness', 'equipement', 'vetements', 'complement', 'autre'],
    default: 'autre'
  },
  proposalType: {
    type: String,
    enum: ['product', 'service', 'sponsorship', 'collaboration', 'other'],
    default: 'other'
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyWebsite: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    default: ''
  },
  offerDetails: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

partnershipProposalSchema.index({ userId: 1, createdAt: -1 });
partnershipProposalSchema.index({ status: 1 });

module.exports = mongoose.model('PartnershipProposal', partnershipProposalSchema);
