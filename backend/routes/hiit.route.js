const express = require('express');
const router = express.Router();
const hiitController = require('../controllers/hiit.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes publiques (temporairement sans auth pour test)
router.get('/programs', hiitController.getAllPrograms);
router.get('/programs/:id', hiitController.getProgramById);

// Routes admin (à protéger avec middleware admin si nécessaire)
router.post('/programs', authMiddleware, hiitController.createProgram);
router.put('/programs/:id', authMiddleware, hiitController.updateProgram);
router.delete('/programs/:id', authMiddleware, hiitController.deleteProgram);

module.exports = router;
