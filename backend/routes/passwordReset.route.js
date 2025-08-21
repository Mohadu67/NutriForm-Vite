const express = require('express');
const router = express.Router();

const { requestPasswordReset, verifyResetToken, resetPassword } = require('../controllers/passwordReset.controller');

router.post('/forgot-password', requestPasswordReset);
router.get('/reset-password/validate', verifyResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;