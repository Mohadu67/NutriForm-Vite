const mongoose = require("mongoose");
const { Schema } = mongoose;

const MuscuSetSchema = new Schema({
  setNumber: { type: Number },
  rm: { type: Number },
  weightKg: { type: Number },
  reps: { type: Number },
  timeSec: { type: Number },
  restSec: { type: Number }
}, { _id: false });

const CardioSetSchema = new Schema({
  setNumber: { type: Number },
  durationMin: { type: Number },
  durationSec: { type: Number },
  intensity: { type: Number }
}, { _id: false });

const PoidsDuCorpsSetSchema = new Schema({
  setNumber: { type: Number },
  reps: { type: Number },
  restSec: { type: Number }
}, { _id: false });

const EntrySchema = new Schema({
  exerciseId: { type: String }, // ID de l'exercice du JSON
  exerciseName: { type: String, required: true },
  type: { type: String, enum: ["muscu", "cardio", "poids_du_corps"], required: true },
  order: { type: Number },
  notes: { type: String },

  muscleGroup: { type: String },
  muscle: { type: String },
  muscles: { type: [String], default: [] },
  sets: {
    type: [Schema.Types.Mixed],
    default: []
  }
}, { _id: false });


function guessMuscleGroup(name = "", type = "") {
  const n = String(name).toLowerCase();
  const t = String(type).toLowerCase();
  if (/mollet|calf/.test(n)) return "Mollets";
  if (/pompe|push[- ]?up|bench|développé|developpe|pec/.test(n)) return "Pectoraux";
  if (/traction|pull[- ]?up|row|tirage|dos/.test(n)) return "Dos";
  if (/squat|presse|leg|fente|deadlift|soulevé/.test(n)) return "Jambes";
  if (/curl|biceps/.test(n)) return "Biceps";
  if (/triceps|dip/.test(n)) return "Triceps";
  if (/épaule|epaule|shoulder|overhead|militaire|lateral/.test(n)) return "Épaules";
  if (/abdo|crunch|gainage|core|planche/.test(n)) return "Abdos";
  if (t === "cardio") return "Cardio";
  return null;
}

const WorkoutSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String },
  status: { type: String, enum: ["draft", "in_progress", "finished"], default: "finished" },
  durationSec: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
  startedAt: { type: Date },
  endedAt: { type: Date },
  notes: { type: String },
  entries: [EntrySchema],
  clientSummary: {
    plannedExercises: { type: Number },
    completedExercises: { type: Number },
    skippedExercises: { type: Number },
    exercises: [
      new Schema({
        exerciseName: { type: String },
        done: { type: Boolean }
      }, { _id: false })
    ]
  }
}, { timestamps: true });


WorkoutSessionSchema.pre('save', function(next) {
  try {
    if (!Array.isArray(this.entries)) return next();
    for (const e of this.entries) {
      if (!e) continue;
      const hasAny = (Array.isArray(e.muscles) && e.muscles.length) || e.muscleGroup || e.muscle;
      if (!hasAny) {
        const g = guessMuscleGroup(e.exerciseName, e.type);
        if (g) {
          e.muscleGroup = e.muscleGroup || g;
          e.muscle = e.muscle || g;
          if (!Array.isArray(e.muscles) || e.muscles.length === 0) e.muscles = [g];
        }
      }
    }
  } catch (err) {
    console.error('Erreur lors de la détection automatique des groupes musculaires:', err);
  }
  next();
});

module.exports = mongoose.model("WorkoutSession", WorkoutSessionSchema);