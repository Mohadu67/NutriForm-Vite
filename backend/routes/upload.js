const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../frontend/public/uploads/profiles');

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique : userId-timestamp.extension
    const ext = path.extname(file.originalname);
    const filename = `${req.userId}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// Filtrer les types de fichiers acceptés
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
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Middleware d'authentification
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// POST - Upload de photo de profil
router.post('/profile-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune photo fournie'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(req.userId);

    if (!user) {
      // Supprimer le fichier uploadé si l'utilisateur n'existe pas
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer l'ancienne photo si elle existe
    if (user.photo) {
      const oldPhotoPath = path.join(__dirname, '../../frontend/public', user.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Mettre à jour le chemin de la photo dans la base de données
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

    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo'
    });
  }
});

// DELETE - Supprimer la photo de profil
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

    // Supprimer le fichier physique
    const photoPath = path.join(__dirname, '../../frontend/public', user.photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Mettre à jour la base de données
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

// Gestion des erreurs multer
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