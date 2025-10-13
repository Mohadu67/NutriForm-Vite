const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const auth = require('../middlewares/auth.middleware');
const verifyCaptcha = require('../middlewares/recaptcha.middleware');
const { login, register, me, updateProfile, changePassword, refresh, logout } = require('../controllers/auth.controller.js');


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 10 : 50, 
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.',
  skipSuccessfulRequests: true,
});

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, verifyCaptcha, register);
router.post('/refresh', refresh); 
router.post('/logout', logout);
router.get('/me', auth, me);
router.put('/update-profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
