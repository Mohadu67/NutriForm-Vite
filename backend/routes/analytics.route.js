const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// Routes utilisateur (authentifie)
router.get('/weekly', authMiddleware, analyticsController.getWeeklyAnalytics);

// Routes admin
router.get('/admin/notifications', authMiddleware, adminMiddleware, analyticsController.getAdminNotificationStats);

module.exports = router;
