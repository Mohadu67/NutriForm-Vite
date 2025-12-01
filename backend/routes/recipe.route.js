const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const auth = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const { requirePremium } = require('../middlewares/subscription.middleware');

/**
 * @route   GET /api/recipes
 * @desc    Obtenir la liste des recettes avec filtres
 * @access  Public
 * @query   goal, mealType, category, dietType, tags, difficulty, maxCalories, minProtein, search, limit, page, sort
 */
router.get('/', recipeController.getRecipes);

/**
 * @route   GET /api/recipes/featured
 * @desc    Obtenir les recettes mises en avant
 * @access  Public
 */
router.get('/featured', recipeController.getFeaturedRecipes);

/**
 * @route   GET /api/recipes/trending
 * @desc    Obtenir les recettes tendances
 * @access  Public
 */
router.get('/trending', recipeController.getTrendingRecipes);

/**
 * @route   GET /api/recipes/suggestions
 * @desc    Obtenir des suggestions personnalisées
 * @access  Private
 */
router.get('/suggestions', auth, recipeController.getRecipeSuggestions);

/**
 * @route   GET /api/recipes/liked
 * @desc    Obtenir les recettes likées par l'utilisateur
 * @access  Private
 */
router.get('/liked', auth, recipeController.getLikedRecipes);

/**
 * @route   GET /api/recipes/saved
 * @desc    Obtenir les recettes sauvegardées
 * @access  Private (Premium requis)
 */
router.get('/saved', auth, requirePremium, recipeController.getSavedRecipes);

/**
 * @route   GET /api/recipes/:id
 * @desc    Obtenir le détail d'une recette
 * @access  Public
 */
router.get('/:id', recipeController.getRecipeById);

/**
 * @route   POST /api/recipes/:id/like
 * @desc    Liker/Unliker une recette
 * @access  Private
 */
router.post('/:id/like', auth, recipeController.toggleLike);

/**
 * @route   POST /api/recipes/:id/save
 * @desc    Sauvegarder une recette dans les favoris
 * @access  Private (Premium requis)
 */
router.post('/:id/save', auth, requirePremium, recipeController.saveRecipe);

/**
 * @route   POST /api/recipes
 * @desc    Créer une nouvelle recette
 * @access  Private (Admin uniquement)
 */
router.post('/', adminMiddleware, recipeController.createRecipe);

/**
 * @route   PUT /api/recipes/:id
 * @desc    Modifier une recette
 * @access  Private (Admin uniquement)
 */
router.put('/:id', adminMiddleware, recipeController.updateRecipe);

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Supprimer une recette
 * @access  Private (Admin uniquement)
 */
router.delete('/:id', adminMiddleware, recipeController.deleteRecipe);

module.exports = router;
