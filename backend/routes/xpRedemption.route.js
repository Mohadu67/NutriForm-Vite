const express = require('express');
const router = express.Router();
const xpRedemptionController = require('../controllers/xpRedemption.controller');
const auth = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/xp-redemption/eligibility
 * @desc    Verifier si l'utilisateur peut racheter des XP
 * @access  Private
 */
router.get('/eligibility', auth, xpRedemptionController.checkEligibility);

/**
 * @route   POST /api/xp-redemption/redeem
 * @desc    Racheter des XP pour obtenir du Premium
 * @access  Private
 * @body    { months: number (1-3) }
 */
router.post('/redeem', auth, xpRedemptionController.redeemXpForPremium);

/**
 * @route   GET /api/xp-redemption/history
 * @desc    Obtenir l'historique des rachats XP
 * @access  Private
 */
router.get('/history', auth, xpRedemptionController.getRedemptionHistory);

module.exports = router;
