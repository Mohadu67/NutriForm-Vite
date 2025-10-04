const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Middleware optionnel d'authentification
const optionalAuth = (req, res, next) => {
  // Si un token est présent, on peut récupérer l'userId
  // Sinon on continue sans bloquer
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    } catch (err) {
      // Token invalide mais on continue quand même
    }
  }
  next();
};

// GET - Récupérer tous les avis approuvés
router.get('/users', async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(50) // Limite à 50 avis
      .populate('userId', 'photo pseudo') // Récupérer la photo et le pseudo de l'utilisateur
      .select('-isReported -__v'); // Exclure certains champs

    // Ajouter la photo de l'utilisateur dans chaque avis
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
    console.error('Erreur récupération avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis'
    });
  }
});

// POST - Créer un nouvel avis
router.post('/users', optionalAuth, async (req, res) => {
  try {
    const { name, rating, comment } = req.body;

    // Validation
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

    // Créer l'avis
    const review = await Review.create({
      userId: req.userId || null,
      name,
      rating,
      comment,
      isApproved: true // TODO: Mettre à false en production pour modération
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
    console.error('Erreur création avis:', error);

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

// PUT - Approuver un avis (admin seulement)
router.put('/users/:id/approve', async (req, res) => {
  try {
    // TODO: Ajouter middleware admin
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

    res.status(200).json({
      success: true,
      message: 'Avis approuvé',
      review
    });
  } catch (error) {
    console.error('Erreur approbation avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation'
    });
  }
});

// DELETE - Supprimer un avis (admin seulement)
router.delete('/users/:id', async (req, res) => {
  try {
    // TODO: Ajouter middleware admin
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Avis supprimé'
    });
  } catch (error) {
    console.error('Erreur suppression avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// GET - Récupérer les avis en attente de modération (admin)
router.get('/users/pending', async (req, res) => {
  try {
    // TODO: Ajouter middleware admin
    const reviews = await Review.find({ isApproved: false })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Erreur récupération avis en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
});

// GET - Récupérer TOUS les avis (approuvés et non approuvés) - DEV ONLY
router.get('/users/all', async (req, res) => {
  try {
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .select('-isReported -__v');

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Erreur récupération tous les avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
});

module.exports = router;