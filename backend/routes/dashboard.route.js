const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

router.use(authMiddleware);

router.get('/overview', dashboardController.getOverview);

module.exports = router;
