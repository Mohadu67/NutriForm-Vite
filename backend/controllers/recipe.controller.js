const Recipe = require('../models/Recipe');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { notifyAdmins } = require('../services/adminNotification.service');
const { sendNotificationToUser } = require('../services/pushNotification.service');
const Notification = require('../models/Notification');

// Constantes XP pour les recettes
const XP_REWARDS = {
  RECIPE_CREATED: 50,
  RECIPE_APPROVED: 100
};

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

    // Recherche textuelle (échapper les caractères spéciaux regex pour éviter injection NoSQL)
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } }
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

    let recipes = await Recipe.find(filter)
      .select('-ingredients -instructions') // Ne pas envoyer les détails dans la liste
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Ajouter ratingsCount pour chaque recette
    recipes = recipes.map(recipe => ({
      ...recipe,
      ratingsCount: recipe.ratings?.length || 0
    }));

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
    const userId = req.user?.id; // Peut être undefined si non authentifié

    // Essayer d'abord de chercher par slug, puis par ID
    let recipe;

    // Si l'id est un ObjectId MongoDB valide
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      recipe = await Recipe.findById(id);
    } else {
      // Sinon, c'est un slug
      recipe = await Recipe.findOne({ slug: id });
    }

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    // Vérifier si la recette est publiée OU si l'utilisateur en est l'auteur
    const isAuthor = userId && recipe.author && recipe.author.toString() === userId;
    if (!recipe.isPublished && !isAuthor) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    // Incrémenter les vues
    recipe.views += 1;
    await recipe.save();

    // Extraire la note de l'utilisateur si authentifié
    let userRating = null;
    if (userId && recipe.ratings) {
      const userRatingObj = recipe.ratings.find(r => r.userId?.toString() === userId);
      userRating = userRatingObj?.rating || null;
    }

    // Retourner les données avec avgRating et ratingsCount pour le frontend
    const recipeData = recipe.toObject();
    const ratingsCount = recipeData.ratings?.length || 0;

    // Support les deux noms (avgRating et averageRating pour backward compatibility)
    if (!recipeData.avgRating && recipeData.averageRating) {
      recipeData.avgRating = recipeData.averageRating;
    }

    // S'assurer que avgRating existe
    if (!recipeData.avgRating) {
      recipeData.avgRating = 0;
    }

    // Ne pas exposer les ratings complets, mais inclure le count
    const { ratings, ...recipeWithoutRatings } = recipeData;

    const response = {
      success: true,
      recipe: {
        ...recipeWithoutRatings,
        ratingsCount,
        userRating
      }
    };

    res.json(response);
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

// =====================================================
// FONCTIONS POUR UTILISATEURS PREMIUM
// =====================================================

/**
 * Helper: Notifier l'utilisateur d'une recette
 */
async function notifyRecipeUser(userId, io, { title, message, link, metadata, pushBody }) {
  try {
    // 1. WebSocket temps réel
    if (io && io.notifyUser) {
      io.notifyUser(userId.toString(), 'new_notification', {
        id: `recipe-${Date.now()}-${userId}`,
        type: 'system',
        title,
        message,
        link,
        metadata,
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    // 2. Sauvegarder en base
    await Notification.create({
      userId,
      type: 'system',
      title,
      message,
      link,
      metadata
    });

    // 3. Push notification
    sendNotificationToUser(userId, {
      type: 'system',
      title,
      body: pushBody || message,
      icon: '/assets/icons/notif-recipe.svg',
      data: { type: 'recipe', url: link, ...metadata }
    }).catch(err => logger.error(`Erreur push notification user ${userId}:`, err.message));

  } catch (err) {
    logger.error('Erreur notifyRecipeUser:', err);
  }
}

/**
 * Diffuser une notification à tous les utilisateurs connectés (nouveau contenu)
 */
function broadcastNewContent(io, { type, title, message, link, metadata }) {
  if (!io) {
    logger.warn('❌ broadcastNewContent: io instance not available');
    return;
  }

  const notifId = `content-${type}-${Date.now()}`;
  const notifData = {
    id: notifId,
    type: 'content',
    title,
    message,
    link,
    metadata,
    timestamp: new Date().toISOString(),
    read: false
  };

  // Broadcast via WebSocket à tous les utilisateurs connectés
  const connectedSockets = io.sockets?.sockets?.size || 0;
  logger.info(`📢 Broadcasting new_content to ${connectedSockets} connected sockets: ${title}`);
  io.emit('new_content', notifData);
}

/**
 * @route   POST /api/recipes/user
 * @desc    Créer une recette personnelle (User Premium)
 * @access  Private (Premium)
 */
exports.createUserRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeData = req.body;

    // Validation basique
    if (!recipeData.title) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis'
      });
    }

    if (!recipeData.description) {
      return res.status(400).json({
        success: false,
        message: 'La description est requise'
      });
    }

    if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un ingrédient est requis'
      });
    }

    if (!recipeData.instructions || recipeData.instructions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins une instruction est requise'
      });
    }

    // Générer le slug
    const baseSlug = recipeData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (await Recipe.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Configurer la recette utilisateur
    const newRecipeData = {
      ...recipeData,
      slug,
      author: userId,
      createdBy: 'user',
      status: 'private',
      isOfficial: false,
      isPublished: false,
      isPremium: false
    };

    // S'assurer que totalTime est calculé
    if (newRecipeData.prepTime && newRecipeData.cookTime) {
      newRecipeData.totalTime = parseInt(newRecipeData.prepTime) + parseInt(newRecipeData.cookTime);
    }

    const recipe = new Recipe(newRecipeData);
    await recipe.save();

    // Attribuer XP pour la création de recette
    await LeaderboardEntry.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $inc: { xp: XP_REWARDS.RECIPE_CREATED } },
      { upsert: true }
    );

    logger.info(`Recette "${recipe.title}" créée par user ${userId} (+${XP_REWARDS.RECIPE_CREATED} XP)`);

    res.status(201).json({
      success: true,
      recipe,
      xpEarned: XP_REWARDS.RECIPE_CREATED
    });
  } catch (error) {
    logger.error('Erreur createUserRecipe:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la recette'
    });
  }
};

/**
 * @route   GET /api/recipes/user/my-recipes
 * @desc    Obtenir les recettes de l'utilisateur
 * @access  Private (Premium)
 */
exports.getUserRecipes = async (req, res) => {
  try {
    const userId = req.user.id;

    const recipes = await Recipe.find({ author: userId, createdBy: 'user' })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    logger.error('Erreur getUserRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes'
    });
  }
};

/**
 * @route   PUT /api/recipes/user/:id
 * @desc    Modifier une recette personnelle (User Premium)
 * @access  Private (Premium)
 */
exports.updateUserRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de recette invalide'
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (!recipe.author || recipe.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas le propriétaire de cette recette'
      });
    }

    // Si la recette est publique, la modification la repasse en pending pour validation
    const wasPublic = recipe.status === 'public';
    if (wasPublic) {
      updateData.status = 'pending';
      updateData.isPublished = false;
      logger.info(`Recette ${id} publique modifiée - repasse en pending pour validation`);
    }

    // Régénérer le slug si le titre change
    if (updateData.title && updateData.title !== recipe.title) {
      const baseSlug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      let slug = baseSlug;
      let counter = 1;
      while (await Recipe.findOne({ slug, _id: { $ne: id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    // Mettre à jour
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Recette ${id} modifiée par user ${userId}`);

    res.json({
      success: true,
      recipe: updatedRecipe,
      message: wasPublic
        ? 'Recette modifiée avec succès. Elle sera de nouveau soumise à validation.'
        : 'Recette modifiée avec succès'
    });
  } catch (error) {
    logger.error('Erreur updateUserRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la recette'
    });
  }
};

/**
 * @route   DELETE /api/recipes/user/:id
 * @desc    Supprimer une recette personnelle (User Premium)
 * @access  Private (Premium)
 */
exports.deleteUserRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de recette invalide'
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (!recipe.author || recipe.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas le propriétaire de cette recette'
      });
    }

    await Recipe.findByIdAndDelete(id);

    logger.info(`Recette ${id} supprimée par user ${userId}`);

    res.json({
      success: true,
      message: 'Recette supprimée avec succès'
    });
  } catch (error) {
    logger.error('Erreur deleteUserRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la recette'
    });
  }
};

/**
 * @route   POST /api/recipes/user/:id/propose
 * @desc    Proposer une recette au public (User Premium)
 * @access  Private (Premium)
 */
exports.proposeRecipeToPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de recette invalide'
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (!recipe.author || recipe.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas le propriétaire de cette recette'
      });
    }

    // Vérifier que la recette est privée
    if (recipe.status !== 'private') {
      return res.status(400).json({
        success: false,
        message: 'Cette recette a déjà été proposée ou est publique'
      });
    }

    // Valider que la recette a tous les champs requis pour publication
    if (!recipe.image) {
      return res.status(400).json({
        success: false,
        message: 'Une image est requise pour proposer la recette au public'
      });
    }

    // Mettre le statut à "pending"
    recipe.status = 'pending';
    recipe.rejectionReason = undefined; // Reset si elle avait été rejetée avant
    await recipe.save();

    // Notifier les admins
    const user = await User.findById(userId).select('pseudo prenom email');
    const userName = user?.pseudo || user?.prenom || user?.email || 'Utilisateur';
    const io = req.app.get('io');

    await notifyAdmins({
      title: '🍳 Recette à valider',
      message: `${userName} propose la recette "${recipe.title}" pour publication`,
      link: '/admin?section=recipes',
      type: 'admin',
      metadata: { recipeId: recipe._id, userId },
      io,
      icon: '/assets/icons/notif-recipe.svg'
    });

    logger.info(`Recette ${id} proposée au public par user ${userId}`);

    res.json({
      success: true,
      message: 'Recette proposée avec succès',
      recipe
    });
  } catch (error) {
    logger.error('Erreur proposeRecipeToPublic:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la proposition de la recette'
    });
  }
};

/**
 * @route   POST /api/recipes/user/:id/unpublish
 * @desc    Retirer une recette du public pour la modifier (User Premium)
 * @access  Private (Premium)
 */
exports.unpublishRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de recette invalide'
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    // Verifier que l'utilisateur est le proprietaire
    if (!recipe.author || recipe.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'etes pas le proprietaire de cette recette'
      });
    }

    // Verifier que la recette est publique ou en pending
    if (recipe.status === 'private') {
      return res.status(400).json({
        success: false,
        message: 'Cette recette est deja privee'
      });
    }

    // Remettre la recette en prive pour modification
    recipe.status = 'private';
    recipe.isPublished = false;
    await recipe.save();

    logger.info(`Recette ${id} retiree du public par user ${userId} pour modification`);

    res.json({
      success: true,
      message: 'Recette retiree du public. Vous pouvez maintenant la modifier et la resoumettre.',
      recipe
    });
  } catch (error) {
    logger.error('Erreur unpublishRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait de la recette'
    });
  }
};

// =====================================================
// FONCTIONS ADMIN
// =====================================================

/**
 * @route   GET /api/recipes/admin/pending
 * @desc    Obtenir les recettes en attente de validation (Admin)
 * @access  Private (Admin)
 */
exports.getPendingRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ status: 'pending' })
      .populate('author', 'pseudo email prenom')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    logger.error('Erreur getPendingRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes en attente'
    });
  }
};

/**
 * @route   POST /api/recipes/admin/:id/approve
 * @desc    Approuver une recette (Admin)
 * @access  Private (Admin)
 */
exports.approveRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de recette invalide'
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    if (recipe.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette recette n\'est pas en attente de validation'
      });
    }

    // Approuver la recette
    recipe.status = 'public';
    recipe.isPublished = true;
    recipe.rejectionReason = undefined;
    await recipe.save();

    // Attribuer XP bonus pour l'approbation
    if (recipe.author) {
      await LeaderboardEntry.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(recipe.author) },
        { $inc: { xp: XP_REWARDS.RECIPE_APPROVED } },
        { upsert: true }
      );

      // Notifier l'utilisateur avec l'XP gagnée
      const io = req.app.get('io');
      await notifyRecipeUser(recipe.author, io, {
        title: '✅ Recette approuvée !',
        message: `Ta recette "${recipe.title}" a été approuvée et est maintenant publique ! +${XP_REWARDS.RECIPE_APPROVED} XP 🎉`,
        link: `/recettes/${recipe.slug}`,
        metadata: { recipeId: recipe._id, action: 'approved', xpEarned: XP_REWARDS.RECIPE_APPROVED },
        pushBody: `Ta recette "${recipe.title}" est maintenant publique ! +${XP_REWARDS.RECIPE_APPROVED} XP 🎉`
      });

      // Notifier tous les utilisateurs connectés de la nouvelle recette
      broadcastNewContent(io, {
        type: 'recipe',
        title: '🍽️ Nouvelle recette disponible !',
        message: `Découvre "${recipe.title}" - ${recipe.category || 'Recette fitness'}`,
        link: `/recettes/${recipe.slug}`,
        metadata: { recipeId: recipe._id, recipeTitle: recipe.title, recipeSlug: recipe.slug }
      });
    }

    logger.info(`Recette ${id} approuvée par admin ${req.user.id} (+${XP_REWARDS.RECIPE_APPROVED} XP pour l'auteur)`);

    res.json({
      success: true,
      message: 'Recette approuvée',
      recipe
    });
  } catch (error) {
    logger.error('Erreur approveRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation de la recette'
    });
  }
};

/**
 * @route   POST /api/recipes/admin/:id/reject
 * @desc    Rejeter une recette (Admin)
 * @access  Private (Admin)
 */
exports.rejectRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de recette invalide'
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette introuvable'
      });
    }

    if (recipe.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette recette n\'est pas en attente de validation'
      });
    }

    // Rejeter la recette (revient à private)
    recipe.status = 'private';
    recipe.isPublished = false;
    recipe.rejectionReason = reason || 'Aucune raison spécifiée';
    await recipe.save();

    // Notifier l'utilisateur
    if (recipe.author) {
      const io = req.app.get('io');
      const notifMessage = reason
        ? `Ta recette "${recipe.title}" n'a pas été approuvée. Raison : ${reason.substring(0, 150)}`
        : `Ta recette "${recipe.title}" n'a pas été approuvée. Contacte le support pour plus d'infos.`;

      await notifyRecipeUser(recipe.author, io, {
        title: '❌ Recette refusée',
        message: notifMessage,
        link: '/recettes/mes-recettes',
        metadata: {
          recipeId: recipe._id,
          action: 'rejected',
          reason: reason || 'Aucune raison spécifiée',
          recipeName: recipe.title
        },
        pushBody: `Ta recette "${recipe.title}" n'a pas été approuvée.`
      });
    }

    logger.info(`Recette ${id} rejetée par admin ${req.user.id}. Raison: ${reason}`);

    res.json({
      success: true,
      message: 'Recette rejetée',
      reason
    });
  } catch (error) {
    logger.error('Erreur rejectRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet de la recette'
    });
  }
};

// Noter une recette
exports.rateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "invalid_recipe_id" });
    }

    // Validation stricte du rating
    if (!rating || typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "invalid_rating" });
    }

    let recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({ error: "recipe_not_found" });
    }

    await recipe.addRating(new mongoose.Types.ObjectId(userId), rating);

    // Recharger pour avoir la dernière moyenne
    recipe = await Recipe.findById(id);

    // Retourner les données mises à jour avec avgRating et ratingsCount
    const recipeData = recipe.toObject();
    const ratingsCount = recipeData.ratings?.length || 0;

    if (!recipeData.avgRating) {
      recipeData.avgRating = 0;
    }

    if (recipeData.ratings) {
      recipeData.ratingsCount = recipeData.ratings.length;
    }

    // Récupérer la note de l'utilisateur qui vient de noter
    let userRating = null;
    if (recipe.ratings) {
      const userRatingObj = recipe.ratings.find(r => r.userId?.toString() === userId);
      userRating = userRatingObj?.rating || null;
    }

    return res.status(200).json({
      success: true,
      avgRating: recipe.avgRating,
      ratingsCount: ratingsCount,
      userRating: userRating
    });
  } catch (err) {
    logger.error("rateRecipe error:", err);
    return res.status(500).json({ error: "server_error" });
  }
};
