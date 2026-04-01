const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const partnerMiddleware = require('../middlewares/partner.middleware');
const controller = require('../controllers/partnershipProposal.controller');

// Routes partenaire (partner + admin)
router.post('/', authMiddleware, partnerMiddleware, controller.create);
router.get('/my', authMiddleware, partnerMiddleware, controller.getMyProposals);

// Routes admin
router.get('/admin/all', authMiddleware, adminMiddleware, controller.getAll);
router.patch('/admin/:id', authMiddleware, adminMiddleware, controller.review);

module.exports = router;
