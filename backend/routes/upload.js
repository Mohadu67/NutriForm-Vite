const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');
const auth = require('../middlewares/auth.middleware');
const logger = require('../utils/logger.js');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbkulqwrt',
  api_key: process.env.CLOUDINARY_API_KEY || '491896755629941',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'PzrPFEEtNS6YAJ65vMP4AiDGkPs'
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
    if (!req.file) {
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


router.use((error, req, res, next) => {
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