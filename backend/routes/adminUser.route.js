const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const controller = require('../controllers/adminUser.controller');

router.use(authMiddleware, adminMiddleware);

router.get('/', controller.getUsers);
router.get('/stats', controller.getUserStats);
router.patch('/:userId/ban', controller.banUser);
router.patch('/:userId/unban', controller.unbanUser);
router.delete('/:userId', controller.deleteUser);
router.patch('/:userId/role', controller.changeRole);
router.patch('/:userId/tier', controller.changeTier);
router.post('/:userId/xp', controller.giveXp);

module.exports = router;
