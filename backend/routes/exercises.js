const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const authMiddleware = require('../middlewares/auth.middleware');

// ============ PUBLIC ROUTES ============

// Get all exercises with filters
router.get('/', exerciseController.getExercises);

// Get categories with counts
router.get('/categories', exerciseController.getCategories);

// Get muscles with counts
router.get('/muscles', exerciseController.getMuscles);

// Get popular exercises
router.get('/popular', exerciseController.getPopular);

// Get exercises by category
router.get('/category/:category', exerciseController.getByCategory);

// Get exercises by muscle
router.get('/muscle/:muscle', exerciseController.getByMuscle);

// Get single exercise by ID or slug
router.get('/:idOrSlug', exerciseController.getExercise);

// ============ ADMIN ROUTES ============

// Create exercise
router.post('/', authMiddleware, exerciseController.createExercise);

// Bulk insert (for migration)
router.post('/bulk', authMiddleware, exerciseController.bulkInsert);

// Update exercise
router.put('/:id', authMiddleware, exerciseController.updateExercise);

// Delete exercise
router.delete('/:id', authMiddleware, exerciseController.deleteExercise);

module.exports = router;
