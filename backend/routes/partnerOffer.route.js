const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const partnerMiddleware = require('../middlewares/partner.middleware');
const controller = require('../controllers/partnerOffer.controller');

// Routes partenaire
router.post('/', authMiddleware, partnerMiddleware, controller.create);
router.get('/my', authMiddleware, partnerMiddleware, controller.getMyOffers);
router.put('/:id', authMiddleware, partnerMiddleware, controller.update);
router.delete('/:id', authMiddleware, partnerMiddleware, controller.remove);

// Routes admin
router.get('/admin/pending', authMiddleware, adminMiddleware, controller.getPendingOffers);
router.patch('/admin/:id/review', authMiddleware, adminMiddleware, controller.reviewOffer);

module.exports = router;
