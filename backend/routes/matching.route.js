const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { requirePremium } = require('../middlewares/subscription.middleware');
const matchingController = require('../controllers/matching.controller');

// Toutes les routes nécessitent authentification et Premium
router.use(authMiddleware);
router.use(requirePremium);

/**
 * @route   GET /api/matching/suggestions
 * @desc    Obtenir des suggestions de matches basées sur l'algorithme intelligent
 * @access  Premium
 */
router.get('/suggestions', matchingController.getMatchSuggestions);

/**
 * @route   POST /api/matching/like
 * @desc    Liker un profil
 * @access  Premium
 */
router.post('/like', matchingController.likeProfile);

/**
 * @route   POST /api/matching/unlike
 * @desc    Retirer un like
 * @access  Premium
 */
router.post('/unlike', matchingController.unlikeProfile);

/**
 * @route   POST /api/matching/reject
 * @desc    Rejeter un profil
 * @access  Premium
 */
router.post('/reject', matchingController.rejectMatch);

/**
 * @route   GET /api/matching/mutual
 * @desc    Obtenir les matches mutuels
 * @access  Premium
 */
router.get('/mutual', matchingController.getMutualMatches);

/**
 * @route   POST /api/matching/block
 * @desc    Bloquer un utilisateur
 * @access  Premium
 */
router.post('/block', matchingController.blockUser);

/**
 * @route   GET /api/matching/rejected
 * @desc    Obtenir les profils rejetés
 * @access  Premium
 */
router.get('/rejected', matchingController.getRejectedProfiles);

/**
 * @route   POST /api/matching/relike
 * @desc    Re-liker un profil précédemment rejeté
 * @access  Premium
 */
router.post('/relike', matchingController.relikeProfile);

module.exports = router;
