const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * @route   GET /api/image-proxy
 * @desc    Proxy pour les images externes (contourner CORS)
 * @access  Public
 * @query   url - URL de l'image à charger
 */
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL de l\'image requise'
      });
    }

    // Vérifier que c'est une URL valide
    let imageUrl;
    try {
      imageUrl = new URL(url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'URL invalide'
      });
    }

    // Sécurité: autoriser seulement les images HTTP(S)
    if (!['http:', 'https:'].includes(imageUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: 'Protocole non autorisé'
      });
    }

    // Charger l'image depuis l'URL externe
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 secondes max
      headers: {
        'User-Agent': 'Harmonith/1.0'
      }
    });

    // Déterminer le type MIME
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Vérifier que c'est bien une image
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu n\'est pas une image'
      });
    }

    // Cache pour 1 jour
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });

    res.send(response.data);

  } catch (error) {
    logger.error('Erreur proxy image:', error.message);

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Timeout lors du chargement de l\'image'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement de l\'image'
    });
  }
});

module.exports = router;
