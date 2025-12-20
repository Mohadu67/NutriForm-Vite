const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  // Informations de base
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['sport', 'nutrition', 'wellness', 'equipement', 'vetements', 'autre'],
    default: 'autre'
  },

  // Offre
  offerTitle: {
    type: String,
    required: true
  },
  offerDescription: {
    type: String,
    default: ''
  },
  offerType: {
    type: String,
    enum: ['percentage', 'fixed', 'gift', 'freebie'],
    default: 'percentage'
  },
  offerValue: {
    type: Number,
    default: 0
  },
  promoCode: {
    type: String,
    required: true
  },

  // Cout XP
  xpCost: {
    type: Number,
    required: true,
    min: 0
  },

  // Limites
  maxRedemptions: {
    type: Number,
    default: null // null = illimite
  },
  maxPerUser: {
    type: Number,
    default: 1
  },
  redemptionCount: {
    type: Number,
    default: 0
  },

  // Dates
  startsAt: {
    type: Date,
    default: null // null = immediat
  },
  expiresAt: {
    type: Date,
    default: null // null = permanent
  },

  // Statut
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour les recherches
partnerSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });
partnerSchema.index({ category: 1 });
partnerSchema.index({ slug: 1 });

// Generer slug automatiquement si non fourni
partnerSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Methode pour verifier si l'offre est disponible
partnerSchema.methods.isAvailable = function() {
  if (!this.isActive) return false;

  const now = new Date();

  // Verifier date de debut
  if (this.startsAt && this.startsAt > now) return false;

  // Verifier date d'expiration
  if (this.expiresAt && this.expiresAt < now) return false;

  // Verifier limite globale
  if (this.maxRedemptions !== null && this.redemptionCount >= this.maxRedemptions) return false;

  return true;
};

// Methode statique pour obtenir les partenaires actifs
partnerSchema.statics.getActivePartners = async function() {
  const now = new Date();

  return this.find({
    isActive: true,
    $or: [
      { startsAt: null },
      { startsAt: { $lte: now } }
    ],
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Partner', partnerSchema);
