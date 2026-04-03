const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
    set: (v) => {
      const d = new Date(v);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    },
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },
  source: {
    type: String,
    enum: ['manual', 'recipe', 'ai_vision'],
    default: 'manual',
  },
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null,
  },
  recipeTitle: {
    type: String,
    default: null,
  },
  servingsConsumed: {
    type: Number,
    default: 1,
    min: 0.25,
  },
  name: {
    type: String,
    required: true,
    maxlength: 200,
  },
  nutrition: {
    calories: { type: Number, required: true, min: 0 },
    proteins: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
  notes: {
    type: String,
    maxlength: 300,
  },
}, {
  timestamps: true,
});

foodLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('FoodLog', foodLogSchema);
