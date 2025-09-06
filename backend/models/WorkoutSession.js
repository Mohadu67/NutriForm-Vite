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
  exerciseName: { type: String, required: true },
  type: { type: String, enum: ["muscu", "cardio", "poids_du_corps"], required: true },
  order: { type: Number },
  notes: { type: String },
  sets: {
    type: [Schema.Types.Mixed],
    default: []
  }
}, { _id: false });

const WorkoutSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String },
  status: { type: String, enum: ["draft", "in_progress", "finished"], default: "finished" },
  durationSec: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
  startedAt: { type: Date },
  endedAt: { type: Date },
  notes: { type: String },
  entries: [EntrySchema]
}, { timestamps: true });

module.exports = mongoose.model("WorkoutSession", WorkoutSessionSchema);