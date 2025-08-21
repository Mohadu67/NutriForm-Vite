// NutriForm-Vite/backend/models/History.js


const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: ['IMC_CALC', 'CALORIES_CALC', 'CUSTOM'],
      required: true,
      default: 'CUSTOM'
    },
    meta: { type: mongoose.Schema.Types.Mixed },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('History', HistorySchema);