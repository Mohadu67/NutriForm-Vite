const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const { addHistory, getHistory, deleteHistory, getUserSummary } = require('../controllers/history.controller');

router.get('/', auth, getHistory);
router.post('/', auth, addHistory);
router.delete('/:id', auth, deleteHistory);
router.get('/summary', auth, getUserSummary);

module.exports = router;