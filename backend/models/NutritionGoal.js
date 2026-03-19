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
  goal: {
    type: String,
    enum: ['weight_loss', 'maintenance', 'muscle_gain'],
    default: 'maintenance',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('NutritionGoal', nutritionGoalSchema);
