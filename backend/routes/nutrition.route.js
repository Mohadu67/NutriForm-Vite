const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { requirePremium } = require('../middlewares/subscription.middleware');
const nutritionController = require('../controllers/nutrition.controller');

// All routes require authentication
router.use(authMiddleware);

// Food log CRUD
router.post('/log', nutritionController.addFoodLog);
router.post('/log-recipe', nutritionController.logRecipe);
router.get('/daily/:date', nutritionController.getDailyLogs);
router.put('/log/:id', nutritionController.updateFoodLog);
router.delete('/log/:id', nutritionController.deleteFoodLog);

// Summaries
router.get('/summary/daily/:date', nutritionController.getDailySummary);
router.get('/summary/weekly', requirePremium, nutritionController.getWeeklySummary);
router.get('/summary/monthly', requirePremium, nutritionController.getMonthlyTrend);

// Goals
router.get('/goals', nutritionController.getGoals);
router.put('/goals', nutritionController.updateGoals);

module.exports = router;
