const express = require('express');
const router = express.Router();
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const verifyCaptcha = require('../middlewares/recaptcha.middleware');


router.post('/subscribe', verifyCaptcha, async (req, res) => {
  try {
    const { email } = req.body;

    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'L\'email est requis'
      });
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide. Vérifie ton adresse email.'
      });
    }

    
    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà inscrit à notre newsletter'
        });
      } else {
        
        existing.isActive = true;
        existing.subscribedAt = new Date();
        await existing.save();

        return res.status(200).json({
          success: true,
          message: 'Ton abonnement a été réactivé avec succès !'
        });
      }
    }

    
    const subscriber = new NewsletterSubscriber({
      email: email.toLowerCase(),
      source: 'website'
    });

    await subscriber.save();

    res.status(201).json({
      success: true,
      message: 'Merci de ton inscription ! Tu vas recevoir nos meilleures actus.'
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);

    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà inscrit'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue. Réessaye plus tard.'
    });
  }
});


router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'L\'email est requis'
      });
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide.'
      });
    }

    const subscriber = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email non trouvé dans notre liste'
      });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: 'Tu as été désinscrit(e) avec succès'
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue'
    });
  }
});


router.get('/subscribers', async (req, res) => {
  try {
    const { active } = req.query;

    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const subscribers = await NewsletterSubscriber.find(filter)
      .select('email subscribedAt isActive')
      .sort({ subscribedAt: -1 });

    res.status(200).json({
      success: true,
      count: subscribers.length,
      subscribers
    });

  } catch (error) {
    console.error('Newsletter get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des abonnés'
    });
  }
});


router.get('/stats', async (req, res) => {
  try {
    const totalSubscribers = await NewsletterSubscriber.countDocuments({ isActive: true });
    const totalUnsubscribed = await NewsletterSubscriber.countDocuments({ isActive: false });
    const totalAll = await NewsletterSubscriber.countDocuments();

    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubscribers = await NewsletterSubscriber.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo },
      isActive: true
    });

    res.status(200).json({
      success: true,
      stats: {
        active: totalSubscribers,
        inactive: totalUnsubscribed,
        total: totalAll,
        last30Days: recentSubscribers
      }
    });

  } catch (error) {
    console.error('Newsletter stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;