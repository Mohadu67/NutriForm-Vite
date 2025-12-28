const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Schéma pour un cycle d'exercice dans un programme
 */
const CycleSchema = new Schema({
  order: { type: Number, required: true },
  type: {
    type: String,
    enum: ["exercise", "rest", "transition"],
    required: true
  },

  // Si type = "exercise"
  exerciseId: { type: String },
  exerciseName: { type: String },
  exerciseImage: { type: String }, // URL de l'image de l'exercice
  exerciseType: {
    type: String,
    enum: ["cardio", "muscu", "hiit", "yoga", "natation", "etirement", "poids_du_corps"]
  },

  // Durée ou répétitions
  durationSec: { type: Number },
  durationMin: { type: Number },
  reps: { type: Number },
  sets: { type: Number },

  // Intensité (1-10)
  intensity: { type: Number, min: 1, max: 10 },

  // Si type = "rest" ou "transition"
  restSec: { type: Number },

  // Instructions spécifiques pour ce cycle
  notes: { type: String },

  // Nombre de répétitions de ce cycle
  repeat: { type: Number, default: 1 }
}, { _id: false });

/**
 * Schéma principal pour un programme d'entraînement
 */
const WorkoutProgramSchema = new Schema({
  // Métadonnées de base
  name: { type: String, required: true },
  description: { type: String },

  // Type de programme
  type: {
    type: String,
    enum: ["hiit", "circuit", "superset", "amrap", "emom", "tabata", "custom"],
    required: true
  },

  // Difficulté
  difficulty: {
    type: String,
    enum: ["débutant", "intermédiaire", "avancé"],
    default: "intermédiaire"
  },

  // Durée estimée totale en minutes
  estimatedDuration: { type: Number },

  // Tags pour filtrage
  tags: { type: [String], default: [] },

  // Groupes musculaires ciblés
  muscleGroups: { type: [String], default: [] },

  // Équipement requis
  equipment: { type: [String], default: [] },

  // Cycles du programme
  cycles: { type: [CycleSchema], required: true },

  // Image de couverture
  coverImage: { type: String },

  // Visibilité
  isPublic: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Statut du programme
  status: {
    type: String,
    enum: ["private", "public", "pending"], // private = perso, public = validé admin, pending = en attente validation
    default: "private"
  },

  // Raison du refus (si rejeté par admin)
  rejectionReason: { type: String },

  // Créateur
  createdBy: {
    type: String,
    enum: ["admin", "user"],
    default: "admin"
  },
  userId: { type: Schema.Types.ObjectId, ref: "User" },

  // Statistiques d'utilisation
  usageCount: { type: Number, default: 0 },
  completionCount: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  ratings: [{
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }],

  // Instructions générales
  instructions: { type: String },
  tips: { type: String },

  // Niveau de calories estimé
  estimatedCalories: { type: Number }
}, {
  timestamps: true
});

// Index pour recherche et filtrage
WorkoutProgramSchema.index({ type: 1, isPublic: 1, isActive: 1 });
WorkoutProgramSchema.index({ difficulty: 1, isActive: 1 });
WorkoutProgramSchema.index({ tags: 1 });
WorkoutProgramSchema.index({ createdBy: 1, userId: 1 });
WorkoutProgramSchema.index({ name: "text", description: "text" });

// Index composite pour getPublicPrograms optimisé
WorkoutProgramSchema.index(
  { isPublic: 1, isActive: 1, usageCount: -1, createdAt: -1 },
  { name: 'public_programs_sorted' }
);

// Index composite avec type et difficulty pour filtrage
WorkoutProgramSchema.index(
  { isPublic: 1, isActive: 1, type: 1, difficulty: 1 },
  { name: 'public_programs_filtered' }
);

// Méthode pour incrémenter le compteur d'utilisation
WorkoutProgramSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
};

// Méthode pour incrémenter le compteur de complétion
WorkoutProgramSchema.methods.incrementCompletion = async function() {
  this.completionCount += 1;
  await this.save();
};

// Méthode pour ajouter une note (optimisée avec opérations atomiques)
WorkoutProgramSchema.methods.addRating = async function(userId, rating) {
  // Supprimer l'ancienne note avec opération atomique
  await this.model('WorkoutProgram').updateOne(
    { _id: this._id },
    { $pull: { ratings: { userId: userId } } }
  );

  // Ajouter la nouvelle note avec opération atomique
  await this.model('WorkoutProgram').updateOne(
    { _id: this._id },
    { $push: { ratings: { userId: userId, rating: rating, createdAt: new Date() } } }
  );

  // Recalculer la moyenne avec aggregate (plus performant)
  const result = await this.model('WorkoutProgram').aggregate([
    { $match: { _id: this._id } },
    { $unwind: '$ratings' },
    { $group: { _id: '$_id', avgRating: { $avg: '$ratings.rating' } } }
  ]);

  if (result.length > 0) {
    this.avgRating = result[0].avgRating;
    await this.save();
  }
};

// Virtual pour calculer la durée totale des cycles
WorkoutProgramSchema.virtual('totalDuration').get(function() {
  if (!this.cycles || this.cycles.length === 0) return 0;

  return this.cycles.reduce((total, cycle) => {
    const cycleRepeat = cycle.repeat || 1;

    if (cycle.type === 'exercise') {
      const duration = (cycle.durationSec || 0) + ((cycle.durationMin || 0) * 60);
      return total + (duration * cycleRepeat);
    } else if (cycle.type === 'rest' || cycle.type === 'transition') {
      return total + ((cycle.restSec || 0) * cycleRepeat);
    }

    return total;
  }, 0);
});

// Virtual pour obtenir le nombre total de cycles
WorkoutProgramSchema.virtual('totalCycles').get(function() {
  return this.cycles ? this.cycles.length : 0;
});

// S'assurer que les virtuals sont inclus lors de la conversion en JSON
WorkoutProgramSchema.set('toJSON', { virtuals: true });
WorkoutProgramSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("WorkoutProgram", WorkoutProgramSchema);