const express = require('express');
const router = express.Router();
const biorhythmController = require('../controllers/biorhythm.controller');
const biorhythmNotifController = require('../controllers/notification.biorhythm.controller');
const auth = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(auth);

// POST /api/biorhythm/sync-sleep - Sync sleep data from phone
router.post('/sync-sleep', biorhythmController.syncSleep);

// GET /api/biorhythm/readiness - Get readiness score for today (or ?date=YYYY-MM-DD)
router.get('/readiness', biorhythmController.getReadiness);

// GET /api/biorhythm/readiness/history - Get readiness history (?days=7)
router.get('/readiness/history', biorhythmController.getReadinessHistory);

// GET /api/biorhythm/sleep/history - Get sleep history (?days=7)
router.get('/sleep/history', biorhythmController.getSleepHistory);

// GET /api/biorhythm/sleep/:date - Get sleep data for a specific date
router.get('/sleep/:date', biorhythmController.getSleep);

// POST /api/biorhythm/schedule-notification - Schedule daily training notification
router.post('/schedule-notification', biorhythmNotifController.scheduleNotification);

module.exports = router;
