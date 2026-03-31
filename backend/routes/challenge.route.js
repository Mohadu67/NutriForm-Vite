const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const challengeController = require('../controllers/challenge.controller');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Créer un nouveau défi
router.post('/', challengeController.createChallenge);

// Obtenir mes défis (actifs, pending, historique)
router.get('/', challengeController.getMyChallenges);

// Obtenir mes statistiques de défis
router.get('/stats', challengeController.getChallengeStats);

// Classement des défis
router.get('/leaderboard', challengeController.getChallengeLeaderboard);

// Envoyer des félicitations (AVANT /:id pour éviter le catch-all)
router.post('/congratulate', challengeController.sendCongratulations);

// Obtenir un défi par ID
router.get('/:id', challengeController.getChallengeById);

// Accepter un défi
router.post('/:id/accept', challengeController.acceptChallenge);

// Refuser un défi
router.post('/:id/decline', challengeController.declineChallenge);

// Annuler un défi (seulement si pending)
router.post('/:id/cancel', challengeController.cancelChallenge);

// Soumettre un résultat (défis max: pompes, bench, etc.)
router.post('/:id/submit-result', challengeController.submitResult);

module.exports = router;
