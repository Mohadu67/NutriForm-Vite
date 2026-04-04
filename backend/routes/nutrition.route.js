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

// Carousel (not premium — used for the main nutrition dashboard)
router.get('/carousel/:date', nutritionController.getCarouselData);

// Week bar (not premium — used for day navigation UI)
router.get('/week-bar', nutritionController.getWeekBarData);

// Goals
router.get('/goals', nutritionController.getGoals);
router.put('/goals', nutritionController.updateGoals);

// Food recognition by photo (Gemini Vision)
const foodRecognition = require('../controllers/foodRecognition.controller');
router.post('/recognize', foodRecognition.recognizeFood);

// Scan history
const { ScannedPlat, ScannedIngredient } = require('../models/ScanHistory');

router.get('/scans/plats', async (req, res) => {
  try {
    const plats = await ScannedPlat.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, plats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/scans/ingredients', async (req, res) => {
  try {
    const ingredients = await ScannedIngredient.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, ingredients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/scans/plats/:id', async (req, res) => {
  try {
    await ScannedPlat.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/scans/ingredients/:id', async (req, res) => {
  try {
    await ScannedIngredient.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
