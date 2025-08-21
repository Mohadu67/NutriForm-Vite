const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const { addHistory, getHistory, deleteHistory } = require('../controllers/history.controller');

router.get('/history', auth, getHistory);
router.post('/history', auth, addHistory);
router.delete('/history/:id', auth, deleteHistory);

module.exports = router;