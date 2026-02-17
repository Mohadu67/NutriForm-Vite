const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const adminMiddleware = require('../middlewares/admin.middleware');
const logger = require('../utils/logger.js');


const optionalAuth = (req, res, next) => {
  let token = null;

  // Priorité 1: Cookie httpOnly
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Priorité 2: Header Authorization
  else if (req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    } catch (err) {
      // Token invalide, on continue sans userId
    }
  }
  next();
};


router.get('/users', async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(50) 
      .populate('userId', 'photo pseudo') 
      .select('-isReported -__v'); 

    
    const reviewsWithPhotos = reviews.map(review => ({
      ...review.toObject(),
      photo: review.userId?.photo || review.photo || null
    }));

    res.status(200).json({
      success: true,
      count: reviewsWithPhotos.length,
      reviews: reviewsWithPhotos
    });
  } catch (error) {
    logger.error('Erreur récupération avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis'
    });
  }
});


router.post('/users', optionalAuth, async (req, res) => {
  try {
    const { name, rating, comment } = req.body;

    
    if (!name || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être entre 1 et 5'
      });
    }

    if (comment.length < 10 || comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Le commentaire doit contenir entre 10 et 500 caractères'
      });
    }

    
    const review = await Review.create({
      userId: req.userId || null,
      name,
      rating,
      comment,
      isApproved: true 
    });

    res.status(201).json({
      success: true,
      message: 'Avis soumis avec succès ! Il sera publié après modération.',
      review: {
        _id: review._id,
        name: review.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    logger.error('Erreur création avis:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis'
    });
  }
});


router.put('/users/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    logger.info(`[ADMIN] Review approved by ${req.user?.email || 'unknown'}: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Avis approuvé',
      review
    });
  } catch (error) {
    logger.error('Erreur approbation avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation'
    });
  }
});


router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    logger.info(`[ADMIN] Review deleted by ${req.user?.email || 'unknown'}: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Avis supprimé'
    });
  } catch (error) {
    logger.error('Erreur suppression avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});


router.get('/users/pending', async (req, res) => {
  try {
    
    const reviews = await Review.find({ isApproved: false })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    logger.error('Erreur récupération avis en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
});


router.get('/users/all', adminMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .select('-isReported -__v');

    logger.info(`[ADMIN] All reviews requested by ${req.user?.email || 'unknown'}`);

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    logger.error('Erreur récupération tous les avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
});

module.exports = router;