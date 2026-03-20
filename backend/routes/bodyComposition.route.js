const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const bodyCompositionController = require('../controllers/bodyComposition.controller');

router.use(authMiddleware);

// Analyse composition corporelle
router.get('/summary', bodyCompositionController.getSummary);
router.get('/trend', bodyCompositionController.getTrend);

// Gestion du poids
router.post('/weight', bodyCompositionController.logWeight);
router.get('/weight', bodyCompositionController.getWeightHistory);
router.delete('/weight/:id', bodyCompositionController.deleteWeightLog);

// Mensurations profil
router.put('/metrics', bodyCompositionController.updateMetrics);

module.exports = router;
