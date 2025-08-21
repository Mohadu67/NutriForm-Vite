const express = require('express');
const { verifyEmail, startCleanerOnce } = require('../controllers/verify.controller');

const router = express.Router();

router.get('/verify-email', verifyEmail);

startCleanerOnce();

module.exports = router;