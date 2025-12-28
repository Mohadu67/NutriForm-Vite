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

// =====================================================
// ROUTES UTILISATEUR PREMIUM - Recettes personnelles
// IMPORTANT: Ces routes doivent être AVANT /:id sinon Express match "user" comme id
// =====================================================

/**
 * @route   GET /api/recipes/user/my-recipes
 * @desc    Obtenir les recettes personnelles de l'utilisateur
 * @access  Private (Premium)
 */
router.get('/user/my-recipes', auth, requirePremium, recipeController.getUserRecipes);

/**
 * @route   POST /api/recipes/user
 * @desc    Créer une recette personnelle
 * @access  Private (Premium)
 */
router.post('/user', auth, requirePremium, recipeController.createUserRecipe);

/**
 * @route   PUT /api/recipes/user/:id
 * @desc    Modifier une recette personnelle
 * @access  Private (Premium)
 */
router.put('/user/:id', auth, requirePremium, recipeController.updateUserRecipe);

/**
 * @route   DELETE /api/recipes/user/:id
 * @desc    Supprimer une recette personnelle
 * @access  Private (Premium)
 */
router.delete('/user/:id', auth, requirePremium, recipeController.deleteUserRecipe);

/**
 * @route   POST /api/recipes/user/:id/propose
 * @desc    Proposer une recette au public
 * @access  Private (Premium)
 */
router.post('/user/:id/propose', auth, requirePremium, recipeController.proposeRecipeToPublic);

/**
 * @route   POST /api/recipes/user/:id/unpublish
 * @desc    Retirer une recette du public pour modification
 * @access  Private (Premium)
 */
router.post('/user/:id/unpublish', auth, requirePremium, recipeController.unpublishRecipe);

// =====================================================
// ROUTES ADMIN - Validation des recettes
// IMPORTANT: Ces routes doivent être AVANT /:id sinon Express match "admin" comme id
// =====================================================

/**
 * @route   GET /api/recipes/admin/pending
 * @desc    Obtenir les recettes en attente de validation
 * @access  Private (Admin)
 */
router.get('/admin/pending', adminMiddleware, recipeController.getPendingRecipes);

/**
 * @route   POST /api/recipes/admin/:id/approve
 * @desc    Approuver une recette
 * @access  Private (Admin)
 */
router.post('/admin/:id/approve', adminMiddleware, recipeController.approveRecipe);

/**
 * @route   POST /api/recipes/admin/:id/reject
 * @desc    Rejeter une recette
 * @access  Private (Admin)
 */
router.post('/admin/:id/reject', adminMiddleware, recipeController.rejectRecipe);

// =====================================================
// ROUTES AVEC PARAMETRE :id - DOIVENT ETRE EN DERNIER
// =====================================================

/**
 * @route   GET /api/recipes/:id
 * @desc    Obtenir le détail d'une recette
 * @access  Public (authentification optionnelle pour recettes privées)
 */
router.get('/:id', auth.optionalAuth, recipeController.getRecipeById);

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

// =====================================================
// ROUTES ADMIN - CRUD Recettes officielles
// =====================================================

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
