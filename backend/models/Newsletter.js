const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Le sujet de l\'email est requis'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Le contenu est requis']
    },
    scheduledDate: {
      type: Date,
      required: [true, 'La date d\'envoi est requise']
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent', 'failed'],
      default: 'draft'
    },
    sentAt: {
      type: Date
    },
    recipientCount: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: String,
      default: 'admin'
    },
    createdByName: {
      type: String,
      default: 'L\'équipe Harmonith'
    }
  },
  {
    timestamps: true
  }
);

// Index pour améliorer les performances
newsletterSchema.index({ scheduledDate: 1, status: 1 });
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);