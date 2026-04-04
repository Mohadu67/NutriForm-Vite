const mongoose = require('mongoose');

// Plats reconnus par photo (Gemini Vision)
const scannedPlatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  imageUrl: { type: String, default: null },
  source: { type: String, enum: ['ai_vision', 'manual'], default: 'ai_vision' },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  portionG: { type: Number, default: 100 },
  portionDescription: { type: String, default: null },
  nutrition: {
    calories: { type: Number, default: 0 },
    proteins: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
}, { timestamps: true });

scannedPlatSchema.index({ userId: 1, createdAt: -1 });

// Ingredients scannes par code-barres
const scannedIngredientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  barcode: { type: String, required: true },
  name: { type: String, required: true },
  brand: { type: String, default: null },
  imageUrl: { type: String, default: null },
  quantity: { type: String, default: null }, // ex: "300g"
  nutritionPer100g: {
    calories: { type: Number, default: 0 },
    proteins: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
}, { timestamps: true });

scannedIngredientSchema.index({ userId: 1, createdAt: -1 });
scannedIngredientSchema.index({ userId: 1, barcode: 1 });

const ScannedPlat = mongoose.model('ScannedPlat', scannedPlatSchema);
const ScannedIngredient = mongoose.model('ScannedIngredient', scannedIngredientSchema);

module.exports = { ScannedPlat, ScannedIngredient };
