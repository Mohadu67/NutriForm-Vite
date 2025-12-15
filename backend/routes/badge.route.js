const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const badgeController = require('../controllers/badge.controller');

// Route publique - obtenir tous les badges disponibles
router.get('/', badgeController.getAllBadges);

// Routes authentifiées
router.use(auth);

// Obtenir les badges de l'utilisateur connecté
router.get('/me', badgeController.getUserBadges);

// Obtenir les badges d'un autre utilisateur
router.get('/user/:userId', badgeController.getUserBadges);

// Mettre à jour les badges affichés
router.put('/displayed', badgeController.setDisplayedBadges);

// Vérification manuelle des badges (debug)
router.post('/check', badgeController.checkBadgesManually);

// Route admin - seed les badges
router.post('/seed', badgeController.seedBadges);

module.exports = router;
