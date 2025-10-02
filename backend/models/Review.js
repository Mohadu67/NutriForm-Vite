const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optionnel si non connecté
  },
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  rating: {
    type: Number,
    required: [true, 'La note est requise'],
    min: [1, 'La note minimale est 1'],
    max: [5, 'La note maximale est 5']
  },
  comment: {
    type: String,
    required: [true, 'Le commentaire est requis'],
    trim: true,
    minlength: [10, 'Le commentaire doit contenir au moins 10 caractères'],
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères']
  },
  photo: {
    type: String,
    default: null
  },
  isApproved: {
    type: Boolean,
    default: false // Les avis doivent être approuvés avant d'être affichés
  },
  isReported: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Index pour les requêtes fréquentes
reviewSchema.index({ isApproved: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });

module.exports = mongoose.model('Review', reviewSchema);