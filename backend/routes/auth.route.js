const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const { login, register, me } = require('../controllers/auth.controller.js');

router.post('/login', login);
router.post('/register', register);
router.get('/me', auth, me);

module.exports = router;
