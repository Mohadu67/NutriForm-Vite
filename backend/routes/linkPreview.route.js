const express = require('express');
const router = express.Router();
const { getLinkPreview } = require('../controllers/linkPreview.controller');

// GET /api/link-preview?url=https://example.com
router.get('/', getLinkPreview);

module.exports = router;
