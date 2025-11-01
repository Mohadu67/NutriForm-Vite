const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard.controller');
const auth = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/leaderboard
 * @desc    Obtenir le classement global
 * @access  Public
 * @query   period: 'week' | 'month' | 'alltime' (default: 'alltime')
 * @query   type: 'all' | 'muscu' | 'cardio' | 'poids_corps' (default: 'all')
 * @query   limit: nombre d'entrées (default: 50)
 */
router.get('/', leaderboardController.getLeaderboard);

/**
 * @route   GET /api/leaderboard/user/:userId/rank
 * @desc    Obtenir le rang d'un utilisateur
 * @access  Public
 */
router.get('/user/:userId/rank', leaderboardController.getUserRank);

/**
 * @route   POST /api/leaderboard/opt-in
 * @desc    S'inscrire au classement public
 * @access  Private
 */
router.post('/opt-in', auth, leaderboardController.optIn);

/**
 * @route   POST /api/leaderboard/opt-out
 * @desc    Se retirer du classement public
 * @access  Private
 */
router.post('/opt-out', auth, leaderboardController.optOut);

/**
 * @route   GET /api/leaderboard/status
 * @desc    Obtenir le statut de participation au classement
 * @access  Private
 */
router.get('/status', auth, leaderboardController.getOptInStatus);

module.exports = router;