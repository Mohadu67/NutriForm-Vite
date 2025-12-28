const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const logger = require('../utils/logger.js');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folder = 'harmonith/chat';

    if (file.mimetype.startsWith('image/')) {
      return {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' }],
        public_id: `${req.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        resource_type: 'image'
      };
    } else if (file.mimetype.startsWith('video/')) {
      return {
        folder,
        allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
        public_id: `${req.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        resource_type: 'video'
      };
    } else {
      return {
        folder,
        public_id: `${req.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        resource_type: 'raw'
      };
    }
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedVideos = /mp4|mov|avi|webm/;
  const allowedDocs = /pdf|doc|docx|txt|xlsx|xls/;

  const ext = file.originalname.split('.').pop().toLowerCase();
  const isImage = allowedImages.test(ext) && file.mimetype.startsWith('image/');
  const isVideo = allowedVideos.test(ext) && file.mimetype.startsWith('video/');
  const isDoc = allowedDocs.test(ext);

  if (isImage || isVideo || isDoc) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = { upload };
