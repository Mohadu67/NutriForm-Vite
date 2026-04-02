const mongoose = require('mongoose');
const { Schema } = mongoose;

const SharedExerciseSchema = new Schema({
  exerciseId: { type: String },
  exerciseName: { type: String, required: true },
  type: { type: String, enum: ['muscu', 'cardio', 'poids_du_corps'], required: true },
  muscles: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

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

  // Liste d'exercices commune, construite collaborativement
  exercises: [SharedExerciseSchema],

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

  // Notes post-séance (feedback)
  notes: { type: String, default: '' }

}, { timestamps: true });

// TTL : supprimer auto les sessions "pending" non acceptées après 10 min
sharedSessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 600, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('SharedSession', sharedSessionSchema);
