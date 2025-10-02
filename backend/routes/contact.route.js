const express = require('express');
const { handleContact } = require('../controllers/contact.controller');
const verifyCaptcha = require('../middlewares/recaptcha.middleware');

const router = express.Router();

router.post('/contact', verifyCaptcha, handleContact);

module.exports = router;