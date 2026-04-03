const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─── Exercice dans la liste commune (phase building) ─────
const SharedExerciseSchema = new Schema({
  exerciseId: { type: String },
  exerciseName: { type: String, required: true },
  type: { type: [String], default: ['muscu'] },
  muscles: { type: [String], default: [] },
  equipment: { type: [String], default: [] },
  primaryMuscle: { type: String, default: null },
  secondaryMuscles: { type: [String], default: [] },
  category: { type: String, default: null },
  order: { type: Number, default: 0 },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

// ─── Saisie d'un exercice (progress) — clé = "userId:exerciseName" ─
const ProgressEntrySchema = new Schema({
  exerciseOrder: Number, // rétro-compatibilité, secondaire
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  exerciseName: String,  // clé primaire de référence
  mode: String,
  sets: [Schema.Types.Mixed],
  cardioSets: [Schema.Types.Mixed],
  swim: Schema.Types.Mixed,
  yoga: Schema.Types.Mixed,
  stretch: Schema.Types.Mixed,
  walkRun: Schema.Types.Mixed,
  done: Boolean,
  notes: String,
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// ─── Workout personnel (copié au démarrage, modifiable individuellement) ─
const PersonalWorkoutSchema = new Schema({
  exercises: [SharedExerciseSchema],
  startedAt: { type: Date },
  endedAt: { type: Date }
}, { _id: false });

// ─── Session partagée ────────────────────────────────────
const sharedSessionSchema = new Schema({
  initiatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchId: {
    type: Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'building', 'active', 'ended', 'cancelled'],
    default: 'pending'
  },

  // Liste d'exercices commune (phase building — propositions visibles par les deux)
  exercises: [SharedExerciseSchema],

  // Sélections personnelles en building (exerciseNames cochés par chaque user)
  // Par défaut = tous les exos. Décocher = retirer de sa sélection.
  initiatorSelection: { type: [String], default: [] },
  partnerSelection: { type: [String], default: [] },

  // Workouts personnels (créés au démarrage depuis exercises × selection)
  initiatorWorkout: { type: PersonalWorkoutSchema, default: null },
  partnerWorkout: { type: PersonalWorkoutSchema, default: null },

  // Nom de la séance (optionnel, modifiable par les deux)
  sessionName: { type: String, default: '' },

  // Lieu (optionnel)
  gymName: { type: String, default: '' },

  // Horodatages
  startedAt: { type: Date },
  endedAt: { type: Date },

  // Sessions individuelles créées à la fin (null tant que pas terminé)
  initiatorSessionId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkoutSession',
    default: null
  },
  partnerSessionId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkoutSession',
    default: null
  },

  // Qui a terminé sa séance
  endedBy: { type: [Schema.Types.ObjectId], default: [] },

  // Durée totale en secondes (calculée quand les deux ont terminé)
  durationSec: { type: Number, default: null },

  // Saisies persistées des participants (clé = "userId:exerciseName")
  progress: { type: Map, of: ProgressEntrySchema, default: new Map() },

  // Notes post-séance (feedback)
  notes: { type: String, default: '' }

}, { timestamps: true });

// TTL : supprimer auto les sessions "pending" non acceptées après 10 min
sharedSessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 600, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('SharedSession', sharedSessionSchema);
