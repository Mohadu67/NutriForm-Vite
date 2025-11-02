const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  durationSec: {
    type: Number,
    required: true,
  },
  isRest: {
    type: Boolean,
    default: false,
  },
  description: String,
  imageUrl: String, // Photo de l'exercice (à ajouter plus tard)
});

const hiitProgramSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ['debutant', 'intermediaire', 'avance'],
      required: true,
    },
    totalDuration: {
      type: Number,
      required: true, // in minutes
    },
    trainer: {
      type: String,
      default: 'Équipe Nutriform',
    },
    imageUrl: String,
    exercises: [exerciseSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HIITProgram', hiitProgramSchema);
