const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  // Informations de base
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  image: {
    type: String,
    required: function() {
      // Image requise seulement pour les recettes officielles (admin)
      return this.createdBy === 'admin';
    }
  },

  // Nutrition
  nutrition: {
    calories: { type: Number, required: true, min: 0 },
    proteins: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fats: { type: Number, required: true, min: 0 },
    fiber: { type: Number, default: 0, min: 0 }
  },

  // Filtres et catégories
  goal: [{
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'maintenance', 'performance', 'health']
  }],
  mealType: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  }],
  category: {
    type: String,
    enum: ['salty', 'sweet', 'both'],
    default: 'salty'
  },
  dietType: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'gluten_free', 'lactose_free', 'none']
  }],

  // Tags spéciaux
  tags: [{
    type: String,
    enum: ['quick', 'no_sugar', 'high_protein', 'low_carb', 'low_fat', 'budget_friendly', 'family_friendly', 'meal_prep']
  }],

  // Temps & Difficulté
  prepTime: {
    type: Number,
    required: true,
    min: 0
  },
  cookTime: {
    type: Number,
    required: true,
    min: 0
  },
  totalTime: {
    type: Number,
    required: true,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  servings: {
    type: Number,
    required: true,
    min: 1,
    default: 2
  },

  // Ingrédients & Instructions
  ingredients: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    optional: { type: Boolean, default: false }
  }],
  instructions: [{
    type: String,
    required: true
  }],

  // Engagement utilisateur
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }],
  views: {
    type: Number,
    default: 0
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  // Métadonnées
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: String,
    enum: ['admin', 'user'],
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['private', 'pending', 'public'],
    default: 'private'
  },
  isOfficial: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index pour recherche et filtres
// Note: slug a déjà un index via unique: true, pas besoin de le redéfinir
recipeSchema.index({ goal: 1 });
recipeSchema.index({ mealType: 1 });
recipeSchema.index({ tags: 1 });
recipeSchema.index({ isPremium: 1, isPublished: 1 });
recipeSchema.index({ 'nutrition.calories': 1 });
recipeSchema.index({ views: -1 });
recipeSchema.index({ averageRating: -1 });
recipeSchema.index({ status: 1 });
recipeSchema.index({ author: 1, status: 1 });

// Méthode pour calculer le temps total automatiquement
recipeSchema.pre('save', function(next) {
  if (this.prepTime && this.cookTime) {
    this.totalTime = this.prepTime + this.cookTime;
  }
  next();
});

// Méthode pour vérifier si un utilisateur a liké cette recette
recipeSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.toString() === userId.toString());
};

// Méthode pour obtenir le nombre de likes
recipeSchema.methods.getLikesCount = function() {
  return this.likes.length;
};

// Méthode pour ajouter une notation
recipeSchema.methods.addRating = async function(userId, rating) {
  console.log('[Recipe.addRating] Starting - userId:', userId, 'rating:', rating);

  try {
    // Supprimer l'ancienne note si elle existe
    await this.model('Recipe').updateOne(
      { _id: this._id },
      { $pull: { ratings: { userId: userId } } }
    );
    console.log('[Recipe.addRating] Old rating removed');

    // Ajouter la nouvelle note
    await this.model('Recipe').updateOne(
      { _id: this._id },
      { $push: { ratings: { userId: userId, rating: rating, createdAt: new Date() } } }
    );
    console.log('[Recipe.addRating] New rating added');

    // Recharger le document complet
    const updated = await this.model('Recipe').findById(this._id);
    console.log('[Recipe.addRating] Document reloaded, ratings count:', updated.ratings?.length);

    // Calculer la moyenne manuellement (plus fiable que aggregate)
    if (updated.ratings && updated.ratings.length > 0) {
      const sum = updated.ratings.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = sum / updated.ratings.length;
      updated.avgRating = avgRating;
      console.log('[Recipe.addRating] Calculated avgRating:', avgRating);

      await updated.save();
      console.log('[Recipe.addRating] Document saved with avgRating:', updated.avgRating);

      // Mettre à jour l'instance courante
      this.avgRating = avgRating;
    }
  } catch (error) {
    console.error('[Recipe.addRating] Error:', error);
    throw error;
  }
};

// Méthode virtuelle pour les macros par portion
recipeSchema.virtual('nutritionPerServing').get(function() {
  if (!this.servings || this.servings === 0) return this.nutrition;

  return {
    calories: Math.round(this.nutrition.calories / this.servings),
    proteins: Math.round(this.nutrition.proteins / this.servings),
    carbs: Math.round(this.nutrition.carbs / this.servings),
    fats: Math.round(this.nutrition.fats / this.servings),
    fiber: Math.round(this.nutrition.fiber / this.servings)
  };
});

// S'assurer que les virtuels sont inclus lors de la conversion en JSON
recipeSchema.set('toJSON', { virtuals: true });
recipeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Recipe', recipeSchema);