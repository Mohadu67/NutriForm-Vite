const express = require('express');
const { getRecoveryStatus } = require('../controllers/recovery.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/status', getRecoveryStatus);

module.exports = router;
