const mongoose = require('mongoose');

const nutritionGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  dailyCalories: {
    type: Number,
    required: true,
    min: 500,
    max: 10000,
  },
  macros: {
    proteins: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
  },
  micros: {
    fiber: { type: Number, default: 30 },
    sugar: { type: Number, default: 50 },
    sodium: { type: Number, default: 2300 },
  },
  goal: {
    type: String,
    enum: ['weight_loss', 'maintenance', 'muscle_gain'],
    default: 'maintenance',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('NutritionGoal', nutritionGoalSchema);
