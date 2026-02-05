const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller.js');
const auth = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(auth);

// POST /api/health/sync - Sync daily health data from phone
router.post('/sync', healthController.syncDailyHealthData);

// GET /api/health/total - Get total calories burned
router.get('/total', healthController.getTotalCaloriesBurned);

// GET /api/health/daily/:date - Get daily health data for specific date
router.get('/daily/:date', healthController.getDailyHealthData);

// GET /api/health/range - Get health data for date range
router.get('/range', healthController.getHealthDataRange);

module.exports = router;
