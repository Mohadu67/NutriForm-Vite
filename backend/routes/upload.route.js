const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');
const auth = require('../middlewares/auth.middleware');
const logger = require('../utils/logger.js');

// Configuration Cloudinary (credentials requis dans .env)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  logger.warn('⚠️ Cloudinary credentials manquants dans .env - Upload de photos désactivé');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'harmonith/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => `${req.userId}-${Date.now()}`
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


router.post('/profile-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    logger.info('📸 Upload photo - userId:', req.userId);
    logger.info('📸 Upload photo - file:', req.file ? 'présent' : 'absent');
    logger.info('📸 Upload photo - body keys:', Object.keys(req.body || {}));

    if (!req.file) {
      logger.warn('📸 Upload photo - Aucun fichier reçu');
      return res.status(400).json({
        success: false,
        message: 'Aucune photo fournie'
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      // Supprimer l'image uploadée sur Cloudinary
      if (req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer l'ancienne photo de Cloudinary si elle existe
    if (user.photo && user.photo.includes('cloudinary.com')) {
      try {
        const publicId = user.photo.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        logger.error('Erreur suppression ancienne photo:', err);
      }
    }

    // L'URL Cloudinary complète est dans req.file.path
    const photoUrl = req.file.path;
    user.photo = photoUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Photo de profil mise à jour',
      photo: photoUrl
    });
  } catch (error) {
    logger.error('Erreur upload photo:', error);

    // Tenter de supprimer l'image uploadée sur Cloudinary en cas d'erreur
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (err) {
        logger.error('Erreur nettoyage Cloudinary:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo'
    });
  }
});


router.delete('/profile-photo', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.photo) {
      return res.status(400).json({
        success: false,
        message: 'Aucune photo à supprimer'
      });
    }

    // Supprimer la photo de Cloudinary
    if (user.photo.includes('cloudinary.com')) {
      try {
        const publicId = user.photo.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        logger.error('Erreur suppression Cloudinary:', err);
      }
    }

    user.photo = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Photo de profil supprimée'
    });
  } catch (error) {
    logger.error('Erreur suppression photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo'
    });
  }
});

// Configuration du stockage Cloudinary pour les recettes
const recipeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'harmonith/recipes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
    public_id: (req, file) => `recipe-${req.userId}-${Date.now()}`
  }
});

const uploadRecipe = multer({
  storage: recipeStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * @route   POST /api/upload/recipe-image
 * @desc    Upload une image pour une recette
 * @access  Private (Premium)
 */
router.post('/recipe-image', auth, uploadRecipe.single('image'), async (req, res) => {
  try {
    logger.info('🍳 Upload image recette - userId:', req.userId);

    if (!req.file) {
      logger.warn('🍳 Upload image recette - Aucun fichier reçu');
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }

    // L'URL Cloudinary complète est dans req.file.path
    const imageUrl = req.file.path;

    logger.info('✅ Image recette uploadée:', imageUrl);

    res.status(200).json({
      success: true,
      message: 'Image uploadée avec succès',
      imageUrl
    });
  } catch (error) {
    logger.error('Erreur upload image recette:', error);

    // Tenter de supprimer l'image uploadée sur Cloudinary en cas d'erreur
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (err) {
        logger.error('Erreur nettoyage Cloudinary:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de l\'image'
    });
  }
});


router.use((error, req, res, next) => {
  logger.error('📸 Upload error:', error.message);
  logger.error('📸 Upload error stack:', error.stack);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'La photo ne doit pas dépasser 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next();
});

module.exports = router;