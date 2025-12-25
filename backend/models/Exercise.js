const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    // Identifiant unique (ex: "exo-012")
    exoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Nom de l'exercice
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Slug URL-friendly
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    // Type d'exercice (muscu, cardio, etirement, hiit, yoga, meditation, natation)
    category: {
      type: String,
      required: true,
      enum: ['muscu', 'cardio', 'etirement', 'hiit', 'yoga', 'meditation', 'natation'],
      index: true,
    },

    // Sous-types (ex: ['muscu', 'poids-du-corps'])
    type: [{
      type: String,
      enum: ['muscu', 'poids-du-corps', 'cardio', 'etirement', 'hiit', 'yoga', 'meditation', 'natation'],
    }],

    // Objectifs (force, hypertrophie, endurance, souplesse, relaxation)
    objectives: [{
      type: String,
      enum: ['force', 'hypertrophie', 'endurance', 'souplesse', 'relaxation', 'cardio', 'equilibre'],
    }],

    // Muscle principal
    primaryMuscle: {
      type: String,
      required: true,
      index: true,
    },

    // Muscles secondaires
    secondaryMuscles: [{
      type: String,
    }],

    // Tous les muscles travailles (pour recherche)
    muscles: [{
      type: String,
      index: true,
    }],

    // Equipement necessaire
    equipment: [{
      type: String,
    }],

    // Niveau de difficulte
    difficulty: {
      type: String,
      enum: ['debutant', 'intermediaire', 'avance'],
      default: 'intermediaire',
    },

    // Instructions / Explication
    explanation: {
      type: String,
      required: true,
    },

    // Images/GIFs (URLs Cloudinary)
    images: [{
      url: String,
      publicId: String, // Pour suppression Cloudinary
    }],

    // Image principale (premiere image)
    mainImage: {
      type: String,
    },

    // Video YouTube ou autre (optionnel)
    videoUrl: {
      type: String,
    },

    // Conseils supplementaires
    tips: [{
      type: String,
    }],

    // Temps de repos recommande (en secondes)
    restTime: {
      type: Number,
      default: 60,
    },

    // Nombre de series recommande
    recommendedSets: {
      type: Number,
      default: 3,
    },

    // Nombre de reps recommande (ou duree en secondes pour cardio)
    recommendedReps: {
      type: String,
      default: '8-12',
    },

    // Exercice actif/visible
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Nombre de fois utilise (pour popularite)
    usageCount: {
      type: Number,
      default: 0,
    },

    // Note moyenne
    averageRating: {
      type: Number,
      default: 0,
    },

    // Ordre d'affichage
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index compose pour recherche
exerciseSchema.index({ name: 'text', explanation: 'text' });
exerciseSchema.index({ category: 1, primaryMuscle: 1 });
// Note: On ne peut pas avoir un index compose sur deux arrays
exerciseSchema.index({ muscles: 1 });
exerciseSchema.index({ equipment: 1 });

// Methode statique pour recherche
exerciseSchema.statics.search = async function(query, filters = {}) {
  const searchQuery = {};

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (filters.category) {
    searchQuery.category = filters.category;
  }

  if (filters.muscles && filters.muscles.length > 0) {
    searchQuery.muscles = { $in: filters.muscles };
  }

  if (filters.equipment && filters.equipment.length > 0) {
    searchQuery.equipment = { $in: filters.equipment };
  }

  if (filters.difficulty) {
    searchQuery.difficulty = filters.difficulty;
  }

  if (filters.type && filters.type.length > 0) {
    searchQuery.type = { $in: filters.type };
  }

  searchQuery.isActive = true;

  return this.find(searchQuery)
    .sort(query ? { score: { $meta: 'textScore' } } : { order: 1, name: 1 })
    .limit(filters.limit || 100);
};

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
