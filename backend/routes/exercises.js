const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const rateLimit = require('express-rate-limit');

// Rate limiter pour les endpoints admin - Protection contre le spam
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par fenêtre par IP
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ PUBLIC ROUTES ============

// Get all exercises with filters
router.get('/', exerciseController.getExercises);

// Get categories with counts
router.get('/categories', exerciseController.getCategories);

// Get muscles with counts
router.get('/muscles', exerciseController.getMuscles);

// Get popular exercises
router.get('/popular', exerciseController.getPopular);

// Get exercise image by slug (MUST be before /:idOrSlug to avoid conflicts)
const fs = require('fs');
const path = require('path');
router.get('/image/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const imagePath = path.join(__dirname, '../../frontend/public/images/Exo');

    const files = fs.readdirSync(imagePath);

    // Convert slug to different patterns to find matching file
    // "pompes" -> "pompe", "pompes-declinees" -> "pompes", "declinees", etc.
    const slugParts = slug.toLowerCase().split('-');

    const imageFile = files.find(f => {
      const fileName = path.basename(f, path.extname(f)).toLowerCase();

      // Exact match (case insensitive)
      if (fileName === slug.toLowerCase()) return true;

      // Check if filename contains all slug parts
      if (slugParts.every(part => fileName.includes(part))) return true;

      // Check if filename contains at least 2 slug parts (for compound names)
      const matchingParts = slugParts.filter(part => fileName.includes(part));
      if (matchingParts.length >= 2) return true;

      // Check if slug is singular and filename is base (e.g., "pompes" vs "Pompe")
      if (slugParts.length === 1) {
        const singularSlug = slug.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
        if (fileName.includes(singularSlug)) return true;
      }

      return false;
    });

    if (!imageFile) {
      console.warn(`[EXERCISES] Image not found for slug: ${slug}`);
      return res.status(404).json({
        success: false,
        message: 'Image not found',
        debugSlug: slug
      });
    }

    const fullPath = path.join(imagePath, imageFile);
    const ext = path.extname(imageFile).toLowerCase();
    const mimeTypes = {
      '.gif': 'image/gif',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };

    res.set('Content-Type', mimeTypes[ext] || 'image/gif');
    res.set('Cache-Control', 'public, max-age=86400');
    res.sendFile(fullPath);
  } catch (error) {
    console.error('[EXERCISES] Image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving image'
    });
  }
});

// Get exercises by category
router.get('/category/:category', exerciseController.getByCategory);

// Get exercises by muscle
router.get('/muscle/:muscle', exerciseController.getByMuscle);

// Get single exercise by ID or slug
router.get('/:idOrSlug', exerciseController.getExercise);

// ============ ADMIN ROUTES ============
// Toutes les routes admin sont protégées par adminMiddleware + rate limiting

// Create exercise (Admin only)
router.post('/', adminRateLimiter, adminMiddleware, exerciseController.createExercise);

// Bulk insert (for migration - Admin only)
router.post('/bulk', adminRateLimiter, adminMiddleware, exerciseController.bulkInsert);

// Update exercise (Admin only)
router.put('/:id', adminRateLimiter, adminMiddleware, exerciseController.updateExercise);

// Delete exercise (Admin only)
router.delete('/:id', adminRateLimiter, adminMiddleware, exerciseController.deleteExercise);

module.exports = router;
