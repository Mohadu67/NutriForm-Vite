const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middlewares/auth.middleware');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../frontend/public/uploads/profiles');

    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    
    const ext = path.extname(file.originalname);
    const filename = `${req.userId}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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
      
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    
    if (user.photo) {
      const oldPhotoPath = path.join(__dirname, '../../frontend/public', user.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }


    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    user.photo = photoUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Photo de profil mise à jour',
      photo: photoUrl
    });
  } catch (error) {
    console.error('Erreur upload photo:', error);

    
    if (req.file) {
      fs.unlinkSync(req.file.path);
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

    
    const photoPath = path.join(__dirname, '../../frontend/public', user.photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    
    user.photo = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Photo de profil supprimée'
    });
  } catch (error) {
    console.error('Erreur suppression photo:', error);
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