const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const auth = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/chatUpload.middleware');
const logger = require('../utils/logger.js');

router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }

    const file = req.file;
    const mediaData = {
      url: file.path,
      publicId: file.filename,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    };

    if (file.mimetype.startsWith('image/')) {
      mediaData.type = 'image';
      if (file.width && file.height) {
        mediaData.dimensions = { width: file.width, height: file.height };
      }
    } else if (file.mimetype.startsWith('video/')) {
      mediaData.type = 'video';
      const thumbnailUrl = cloudinary.url(file.filename, {
        resource_type: 'video',
        transformation: [{ width: 400, height: 400, crop: 'fill' }, { quality: 'auto' }],
        format: 'jpg'
      });
      mediaData.thumbnail = thumbnailUrl;
    } else {
      mediaData.type = 'file';
    }

    res.json({ success: true, media: mediaData });
  } catch (error) {
    logger.error('Erreur upload chat media:', error);
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename, {
        resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
      });
    }
    res.status(500).json({ success: false, message: 'Erreur upload' });
  }
});

module.exports = router;
