const FoodLog = require('../models/FoodLog');
const NutritionGoal = require('../models/NutritionGoal');
const Recipe = require('../models/Recipe');
const nutritionService = require('../services/nutrition.service');
const logger = require('../utils/logger');

const FREE_DAILY_LIMIT = 5;

/**
 * POST /api/nutrition/log — Log manual food entry
 */
exports.addFoodLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, mealType, date, nutrition, notes } = req.body;

    if (!name || !mealType || !nutrition?.calories) {
      return res.status(400).json({ message: 'Nom, type de repas et calories sont requis.' });
    }

    // Free user limit check
    if (req.user.subscriptionTier !== 'premium') {
      const logDate = new Date(date || Date.now());
      logDate.setUTCHours(0, 0, 0, 0);
      const nextDay = new Date(logDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      const count = await FoodLog.countDocuments({
        userId,
        date: { $gte: logDate, $lt: nextDay },
      });

      if (count >= FREE_DAILY_LIMIT) {
        return res.status(403).json({
          error: 'free_limit_reached',
          message: `Limite de ${FREE_DAILY_LIMIT} entrées/jour atteinte. Passez Premium pour un accès illimité.`,
          upgradeUrl: '/pricing',
        });
      }
    }

    const foodLog = new FoodLog({
      userId,
      date: date || new Date(),
      mealType,
      source: 'manual',
      name,
      nutrition: {
        calories: nutrition.calories,
        proteins: nutrition.proteins || 0,
        carbs: nutrition.carbs || 0,
        fats: nutrition.fats || 0,
        fiber: nutrition.fiber || 0,
      },
      notes,
    });

    await foodLog.save();
    res.status(201).json({ success: true, foodLog });
  } catch (error) {
    logger.error('Erreur addFoodLog:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'entrée.' });
  }
};

/**
 * POST /api/nutrition/log-recipe — Log a prepared recipe
 */
exports.logRecipe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipeId, servingsConsumed, mealType, date } = req.body;

    if (!recipeId || !mealType) {
      return res.status(400).json({ message: 'recipeId et mealType sont requis.' });
    }

    const recipe = await Recipe.findById(recipeId).lean();
    if (!recipe) {
      return res.status(404).json({ message: 'Recette introuvable.' });
    }

    const portions = servingsConsumed || 1;
    const ratio = portions / (recipe.servings || 1);

    const foodLog = new FoodLog({
      userId,
      date: date || new Date(),
      mealType,
      source: 'recipe',
      recipeId: recipe._id,
      recipeTitle: recipe.title,
      servingsConsumed: portions,
      name: recipe.title,
      nutrition: {
        calories: Math.round((recipe.nutrition?.calories || 0) * ratio),
        proteins: Math.round((recipe.nutrition?.proteins || 0) * ratio),
        carbs: Math.round((recipe.nutrition?.carbs || 0) * ratio),
        fats: Math.round((recipe.nutrition?.fats || 0) * ratio),
        fiber: Math.round((recipe.nutrition?.fiber || 0) * ratio),
      },
    });

    await foodLog.save();
    res.status(201).json({ success: true, foodLog });
  } catch (error) {
    logger.error('Erreur logRecipe:', error);
    res.status(500).json({ message: 'Erreur lors du log de la recette.' });
  }
};

/**
 * GET /api/nutrition/daily/:date — List food logs for a day
 */
exports.getDailyLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const d = new Date(req.params.date);
    d.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const logs = await FoodLog.find({
      userId,
      date: { $gte: d, $lt: nextDay },
    }).sort({ createdAt: 1 }).lean();

    res.json({ success: true, logs });
  } catch (error) {
    logger.error('Erreur getDailyLogs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des entrées.' });
  }
};

/**
 * PUT /api/nutrition/log/:id — Update a food log entry
 */
exports.updateFoodLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['name', 'mealType', 'nutrition', 'notes', 'servingsConsumed'];
    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    const foodLog = await FoodLog.findOneAndUpdate(
      { _id: id, userId },
      filteredUpdates,
      { new: true }
    );

    if (!foodLog) {
      return res.status(404).json({ message: 'Entrée introuvable.' });
    }

    res.json({ success: true, foodLog });
  } catch (error) {
    logger.error('Erreur updateFoodLog:', error);
    res.status(500).json({ message: 'Erreur lors de la modification.' });
  }
};

/**
 * DELETE /api/nutrition/log/:id — Delete a food log entry
 */
exports.deleteFoodLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const foodLog = await FoodLog.findOneAndDelete({ _id: id, userId });

    if (!foodLog) {
      return res.status(404).json({ message: 'Entrée introuvable.' });
    }

    res.json({ success: true, message: 'Entrée supprimée.' });
  } catch (error) {
    logger.error('Erreur deleteFoodLog:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};

/**
 * GET /api/nutrition/summary/daily/:date — Daily summary (consumed + burned + balance)
 */
exports.getDailySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const summary = await nutritionService.computeDailySummary(userId, req.params.date);
    res.json({ success: true, ...summary });
  } catch (error) {
    logger.error('Erreur getDailySummary:', error);
    res.status(500).json({ message: 'Erreur lors du calcul du résumé.' });
  }
};

/**
 * GET /api/nutrition/summary/weekly — Weekly summary (premium)
 */
exports.getWeeklySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const summary = await nutritionService.computeWeeklySummary(userId);
    res.json({ success: true, ...summary });
  } catch (error) {
    logger.error('Erreur getWeeklySummary:', error);
    res.status(500).json({ message: 'Erreur lors du calcul du résumé hebdomadaire.' });
  }
};

/**
 * GET /api/nutrition/summary/monthly — Monthly trend (premium)
 */
exports.getMonthlyTrend = async (req, res) => {
  try {
    const userId = req.user._id;
    const trend = await nutritionService.computeMonthlyTrend(userId);
    res.json({ success: true, ...trend });
  } catch (error) {
    logger.error('Erreur getMonthlyTrend:', error);
    res.status(500).json({ message: 'Erreur lors du calcul de la tendance mensuelle.' });
  }
};

/**
 * GET /api/nutrition/goals — Get user nutrition goals
 */
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    let goals = await NutritionGoal.findOne({ userId }).lean();

    if (!goals) {
      // Return defaults
      goals = {
        dailyCalories: 2000,
        macros: { proteins: 150, carbs: 250, fats: 65 },
        goal: 'maintenance',
      };
    }

    res.json({ success: true, goals });
  } catch (error) {
    logger.error('Erreur getGoals:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs.' });
  }
};

/**
 * PUT /api/nutrition/goals — Set or update nutrition goals
 */
exports.updateGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { dailyCalories, macros, goal } = req.body;

    if (!dailyCalories || dailyCalories < 500 || dailyCalories > 10000) {
      return res.status(400).json({ message: 'dailyCalories doit être entre 500 et 10000.' });
    }

    const goals = await NutritionGoal.findOneAndUpdate(
      { userId },
      {
        dailyCalories,
        macros: {
          proteins: macros?.proteins || 0,
          carbs: macros?.carbs || 0,
          fats: macros?.fats || 0,
        },
        goal: goal || 'maintenance',
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, goals });
  } catch (error) {
    logger.error('Erreur updateGoals:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des objectifs.' });
  }
};
