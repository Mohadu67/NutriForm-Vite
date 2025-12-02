const Recipe = require('../models/Recipe');
const UserProfile = require('../models/UserProfile');
const logger = require('../utils/logger');

/**
 * @route   GET /api/recipes
 * @desc    Obtenir la liste des recettes avec filtres
 * @access  Public
 */
exports.getRecipes = async (req, res) => {
  try {
    const {
      goal,
      mealType,
      category,
      dietType,
      tags,
      difficulty,
      maxCalories,
      minProtein,
      search,
      limit = 20,
      page = 1,
      sort = 'createdAt'
    } = req.query;

    // Construction du filtre
    const filter = { isPublished: true };

    // Filtres optionnels
    if (goal) filter.goal = { $in: Array.isArray(goal) ? goal : [goal] };
    if (mealType) filter.mealType = { $in: Array.isArray(mealType) ? mealType : [mealType] };
    if (category) filter.category = category;
    if (dietType) filter.dietType = { $in: Array.isArray(dietType) ? dietType : [dietType] };
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (difficulty) filter.difficulty = difficulty;
    if (maxCalories) filter['nutrition.calories'] = { $lte: parseInt(maxCalories) };
    if (minProtein) filter['nutrition.proteins'] = { $gte: parseInt(minProtein) };

    // Recherche textuelle
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Gestion de la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Tri
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { views: -1, likes: -1 };
        break;
      case 'rating':
        sortOption = { averageRating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'calories_asc':
        sortOption = { 'nutrition.calories': 1 };
        break;
      case 'calories_desc':
        sortOption = { 'nutrition.calories': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const recipes = await Recipe.find(filter)
      .select('-ingredients -instructions') // Ne pas envoyer les détails dans la liste
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Recipe.countDocuments(filter);

    res.json({
      success: true,
      recipes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erreur getRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes'
    });
  }
};

/**
 * @route   GET /api/recipes/featured
 * @desc    Obtenir les recettes mises en avant
 * @access  Public
 */
exports.getFeaturedRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      isPublished: true,
      isOfficial: true
    })
      .select('-ingredients -instructions')
      .sort({ views: -1, averageRating: -1 })
      .limit(6)
      .lean();

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    logger.error('Erreur getFeaturedRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes mises en avant'
    });
  }
};

/**
 * @route   GET /api/recipes/trending
 * @desc    Obtenir les recettes tendances (plus populaires des 7 derniers jours)
 * @access  Public
 */
exports.getTrendingRecipes = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recipes = await Recipe.find({
      isPublished: true,
      updatedAt: { $gte: sevenDaysAgo }
    })
      .select('-ingredients -instructions')
      .sort({ views: -1, likes: -1 })
      .limit(8)
      .lean();

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    logger.error('Erreur getTrendingRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes tendances'
    });
  }
};

/**
 * @route   GET /api/recipes/:id
 * @desc    Obtenir le détail d'une recette
 * @access  Public
 */
exports.getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Essayer d'abord de chercher par slug, puis par ID
    let recipe;

    // Si l'id est un ObjectId MongoDB valide
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      recipe = await Recipe.findById(id);
    } else {
      // Sinon, c'est un slug
      recipe = await Recipe.findOne({ slug: id });
    }

    if (!recipe || !recipe.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    // Incrémenter les vues
    recipe.views += 1;
    await recipe.save();

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    logger.error('Erreur getRecipeById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la recette'
    });
  }
};

/**
 * @route   GET /api/recipes/suggestions
 * @desc    Obtenir des suggestions personnalisées basées sur le profil utilisateur
 * @access  Private
 */
exports.getRecipeSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le profil utilisateur
    const userProfile = await UserProfile.findOne({ userId }).lean();

    const filter = { isPublished: true };

    // Suggestions basées sur le niveau de fitness et les objectifs
    if (userProfile?.fitnessLevel) {
      // Si débutant ou intermédiaire, suggérer recettes faciles
      if (['beginner', 'intermediate'].includes(userProfile.fitnessLevel)) {
        filter.difficulty = { $in: ['easy', 'medium'] };
      }
    }

    // Filtrer par objectif de fitness (mapping approximatif)
    // On pourrait enrichir UserProfile avec un champ 'goal' nutritionnel
    const recipes = await Recipe.find(filter)
      .select('-ingredients -instructions')
      .sort({ averageRating: -1, views: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    logger.error('Erreur getRecipeSuggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des suggestions'
    });
  }
};

/**
 * @route   GET /api/recipes/liked
 * @desc    Obtenir les recettes likées par l'utilisateur
 * @access  Private
 */
exports.getLikedRecipes = async (req, res) => {
  try {
    const userId = req.user.id;

    // Trouver toutes les recettes qui contiennent l'userId dans le tableau likes
    const recipes = await Recipe.find({
      likes: userId,
      isPublished: true
    })
      .select('-ingredients -instructions')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    logger.error('Erreur getLikedRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes likées'
    });
  }
};

/**
 * @route   POST /api/recipes/:id/like
 * @desc    Liker/Unliker une recette
 * @access  Private
 */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    const isLiked = recipe.isLikedBy(userId);

    if (isLiked) {
      // Retirer le like
      recipe.likes = recipe.likes.filter(like => like.toString() !== userId.toString());
    } else {
      // Ajouter le like
      recipe.likes.push(userId);
    }

    await recipe.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likesCount: recipe.getLikesCount()
    });
  } catch (error) {
    logger.error('Erreur toggleLike:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du like'
    });
  }
};

/**
 * @route   POST /api/recipes/:id/save
 * @desc    Sauvegarder une recette dans les favoris
 * @access  Private (Premium)
 */
exports.saveRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la recette existe
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    // Récupérer le profil utilisateur et ajouter dans un champ savedRecipes
    const userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profil utilisateur introuvable'
      });
    }

    // Note: Pour l'instant on renvoie success, mais il faudrait ajouter un champ savedRecipes dans UserProfile
    // On peut aussi créer un modèle SavedRecipe séparé

    res.json({
      success: true,
      message: 'Recette sauvegardée (fonctionnalité à implémenter complètement)'
    });
  } catch (error) {
    logger.error('Erreur saveRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde'
    });
  }
};

/**
 * @route   GET /api/recipes/saved
 * @desc    Obtenir les recettes sauvegardées par l'utilisateur
 * @access  Private (Premium)
 */
exports.getSavedRecipes = async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Implémenter la logique de récupération des recettes sauvegardées
    // Pour l'instant, retourner un tableau vide

    res.json({
      success: true,
      recipes: []
    });
  } catch (error) {
    logger.error('Erreur getSavedRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes sauvegardées'
    });
  }
};

/**
 * @route   POST /api/recipes
 * @desc    Créer une nouvelle recette (Admin uniquement)
 * @access  Private (Admin)
 */
exports.createRecipe = async (req, res) => {
  try {
    const recipeData = req.body;

    // Validation
    if (!recipeData.title) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis'
      });
    }

    // Générer le slug à partir du titre avec timestamp pour éviter les duplications
    const baseSlug = recipeData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Vérifier si le slug existe déjà
    let slug = baseSlug;
    let counter = 1;
    while (await Recipe.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    recipeData.slug = slug;

    // Définir l'auteur
    recipeData.author = req.user.id;

    // S'assurer que totalTime est calculé
    if (recipeData.prepTime && recipeData.cookTime) {
      recipeData.totalTime = parseInt(recipeData.prepTime) + parseInt(recipeData.cookTime);
    }

    const recipe = new Recipe(recipeData);
    await recipe.save();

    res.status(201).json({
      success: true,
      recipe
    });
  } catch (error) {
    logger.error('Erreur createRecipe:', error);

    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages,
        error: error.message
      });
    }

    // Erreur de duplication de slug
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Une recette avec ce titre existe déjà',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la recette',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/recipes/:id
 * @desc    Modifier une recette (Admin uniquement)
 * @access  Private (Admin)
 */
exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Si le titre change, régénérer le slug
    if (updateData.title) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const recipe = await Recipe.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    logger.error('Erreur updateRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la recette'
    });
  }
};

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Supprimer une recette (Admin uniquement)
 * @access  Private (Admin)
 */
exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByIdAndDelete(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    res.json({
      success: true,
      message: 'Recette supprimée avec succès'
    });
  } catch (error) {
    logger.error('Erreur deleteRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la recette'
    });
  }
};
