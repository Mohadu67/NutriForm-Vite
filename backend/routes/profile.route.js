const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const profileController = require('../controllers/profile.controller');

// Toutes les routes nécessitent authentification
router.use(authMiddleware);

/**
 * @route   GET /api/profile/me
 * @desc    Obtenir son propre profil
 * @access  Privé
 */
router.get('/me', profileController.getMyProfile);

/**
 * @route   PUT /api/profile
 * @desc    Mettre à jour son profil
 * @access  Privé
 */
router.put('/', profileController.updateProfile);

/**
 * @route   PUT /api/profile/location
 * @desc    Mettre à jour la localisation
 * @access  Privé
 */
router.put('/location', profileController.updateLocation);

/**
 * @route   PUT /api/profile/availability
 * @desc    Mettre à jour les disponibilités
 * @access  Privé
 */
router.put('/availability', profileController.updateAvailability);

/**
 * @route   PUT /api/profile/preferences
 * @desc    Mettre à jour les préférences de matching
 * @access  Privé
 */
router.put('/preferences', profileController.updateMatchPreferences);

/**
 * @route   GET /api/profile/:userId
 * @desc    Obtenir un profil public par ID
 * @access  Privé
 */
router.get('/:userId', profileController.getProfileById);

module.exports = router;
