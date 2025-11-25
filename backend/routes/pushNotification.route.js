const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const PushSubscription = require('../models/PushSubscription');

// S'abonner aux notifications
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { endpoint, keys, deviceInfo } = req.body;

    if (!endpoint || !keys) {
      return res.status(400).json({ error: 'endpoint et keys requis' });
    }

    // Vérifier si la subscription existe déjà
    let subscription = await PushSubscription.findOne({ endpoint });

    if (subscription) {
      // Mettre à jour
      subscription.userId = userId;
      subscription.keys = keys;
      subscription.deviceInfo = deviceInfo;
      subscription.active = true;
      await subscription.save();
    } else {
      // Créer nouvelle subscription
      subscription = new PushSubscription({
        userId,
        endpoint,
        keys,
        deviceInfo,
        active: true
      });
      await subscription.save();
    }

    res.json({
      success: true,
      message: 'Abonnement enregistré'
    });
  } catch (error) {
    console.error('Erreur subscribe:', error);
    res.status(500).json({ error: 'Erreur lors de l\'abonnement' });
  }
});

// Se désabonner
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { endpoint } = req.body;

    await PushSubscription.updateOne(
      { userId, endpoint },
      { active: false }
    );

    res.json({
      success: true,
      message: 'Désabonnement réussi'
    });
  } catch (error) {
    console.error('Erreur unsubscribe:', error);
    res.status(500).json({ error: 'Erreur lors du désabonnement' });
  }
});

// Récupérer la clé publique VAPID
router.get('/vapid-public-key', (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || ''
  });
});

module.exports = router;
