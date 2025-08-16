// NutriForm-Vite/backend/models/History.js


const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['imc', 'calories'], required: true, index: true },
    value: { type: Number, required: true },
    poids: { type: Number },
    taille: { type: Number },
    categorie: { type: String },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('History', HistorySchema);