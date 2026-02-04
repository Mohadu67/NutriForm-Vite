const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const auth = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');

// Configuration Cloudinary (déjà configurée dans upload.js mais on s'assure)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  logger.warn('⚠️ Cloudinary credentials manquants - Upload depuis URL désactivé');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * @route   POST /api/upload/from-url
 * @desc    Télécharge une image depuis une URL et l'upload sur Cloudinary
 * @access  Private
 * @body    { url: string, folder?: string }
 */
router.post('/', auth, async (req, res) => {
  try {
    const { url, folder = 'harmonith/recipes' } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL de l\'image requise'
      });
    }

    // Valider l'URL
    let imageUrl;
    try {
      imageUrl = new URL(url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'URL invalide'
      });
    }

    // Sécurité: autoriser seulement HTTP(S)
    if (!['http:', 'https:'].includes(imageUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: 'Protocole non autorisé'
      });
    }

    logger.info(`🔄 Upload depuis URL pour user ${req.userId}: ${url}`);

    // Vérifier si l'image existe et est accessible
    let imageResponse;
    try {
      imageResponse = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Harmonith/1.0'
        }
      });

      // Vérifier que c'est bien une image
      const contentType = imageResponse.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          message: 'L\'URL ne pointe pas vers une image valide'
        });
      }

      // Vérifier la taille (max 10MB)
      const contentLength = parseInt(imageResponse.headers['content-length'] || '0');
      if (contentLength > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'L\'image est trop grande (max 10MB)'
        });
      }
    } catch (err) {
      logger.error('Erreur lors de la vérification de l\'image:', err.message);
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'accéder à l\'image. Vérifiez l\'URL.'
      });
    }

    // Upload sur Cloudinary directement depuis l'URL
    // Cloudinary peut télécharger depuis une URL !
    const uploadOptions = {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
      ],
      public_id: `recipe-${req.userId}-${Date.now()}`
    };

    const uploadResult = await cloudinary.uploader.upload(url, uploadOptions);

    logger.info(`✅ Image uploadée sur Cloudinary: ${uploadResult.secure_url}`);

    res.status(200).json({
      success: true,
      message: 'Image uploadée avec succès',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format
    });

  } catch (error) {
    logger.error('Erreur upload depuis URL:', error);

    // Gérer les erreurs spécifiques de Cloudinary
    if (error.http_code === 400) {
      return res.status(400).json({
        success: false,
        message: 'Image invalide ou inaccessible'
      });
    }

    if (error.message?.includes('File size too large')) {
      return res.status(400).json({
        success: false,
        message: 'L\'image est trop grande'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de l\'image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
