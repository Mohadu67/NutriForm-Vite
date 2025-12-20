const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partner.controller');
const auth = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// ============================================
// ROUTES ADMIN (doivent etre AVANT /:id)
// ============================================

/**
 * @route   GET /api/partners/admin/all
 * @desc    Obtenir tous les partenaires (admin)
 * @access  Private (Admin)
 */
router.get('/admin/all', adminMiddleware, partnerController.getAllPartners);

/**
 * @route   POST /api/partners/admin
 * @desc    Creer un partenaire (admin)
 * @access  Private (Admin)
 */
router.post('/admin', adminMiddleware, partnerController.createPartner);

/**
 * @route   PUT /api/partners/admin/:id
 * @desc    Modifier un partenaire (admin)
 * @access  Private (Admin)
 */
router.put('/admin/:id', adminMiddleware, partnerController.updatePartner);

/**
 * @route   DELETE /api/partners/admin/:id
 * @desc    Supprimer un partenaire (admin)
 * @access  Private (Admin)
 */
router.delete('/admin/:id', adminMiddleware, partnerController.deletePartner);

/**
 * @route   GET /api/partners/admin/:id/stats
 * @desc    Obtenir les stats d'un partenaire (admin)
 * @access  Private (Admin)
 */
router.get('/admin/:id/stats', adminMiddleware, partnerController.getPartnerStats);

// ============================================
// ROUTES USER (doivent etre AVANT /:id)
// ============================================

/**
 * @route   GET /api/partners/user/my-rewards
 * @desc    Obtenir mes offres debloquees
 * @access  Private (User)
 */
router.get('/user/my-rewards', auth, partnerController.getMyRewards);

/**
 * @route   GET /api/partners/user/check/:partnerId
 * @desc    Verifier si l'utilisateur a deja rachete une offre
 * @access  Private (User)
 */
router.get('/user/check/:partnerId', auth, partnerController.checkRedemption);

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * @route   GET /api/partners
 * @desc    Obtenir la liste des partenaires actifs
 * @access  Public
 */
router.get('/', partnerController.getActivePartners);

/**
 * @route   POST /api/partners/:id/redeem
 * @desc    Debloquer une offre partenaire avec des XP
 * @access  Private (User)
 */
router.post('/:id/redeem', auth, partnerController.redeemPartnerOffer);

/**
 * @route   GET /api/partners/:id
 * @desc    Obtenir le detail d'un partenaire
 * @access  Public
 * NOTE: Cette route DOIT etre en dernier car elle capture tout /:id
 */
router.get('/:id', partnerController.getPartnerById);

module.exports = router;
