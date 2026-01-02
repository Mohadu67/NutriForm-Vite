const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const PushSubscription = require('../models/PushSubscription');
const logger = require('../utils/logger.js');

// S'abonner aux notifications
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
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
    logger.error('Erreur subscribe:', error);
    res.status(500).json({ error: 'Erreur lors de l\'abonnement' });
  }
});

// Se désabonner
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
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
    logger.error('Erreur unsubscribe:', error);
    res.status(500).json({ error: 'Erreur lors du désabonnement' });
  }
});

// Récupérer la clé publique VAPID
router.get('/vapid-public-key', (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || ''
  });
});

// Enregistrer un token Expo Push (mobile)
router.post('/register', authMiddleware, async (req, res) => {
  try {
    logger.info('[PUSH] /register appelé');

    const userId = req.userId || req.user?._id;
    if (!userId) {
      logger.error('[PUSH] userId manquant');
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { pushToken, deviceInfo } = req.body;
    logger.info(`[PUSH] userId: ${userId}, token: ${pushToken ? 'présent' : 'manquant'}`);

    if (!pushToken) {
      return res.status(400).json({ error: 'pushToken requis' });
    }

    // Vérifier si c'est un token Expo valide
    if (!pushToken.startsWith('ExponentPushToken[')) {
      logger.warn(`[PUSH] Token format invalide`);
      return res.status(400).json({ error: 'Token Expo invalide' });
    }

    // Utiliser findOneAndUpdate avec upsert pour éviter les race conditions
    const subscription = await PushSubscription.findOneAndUpdate(
      { expoPushToken: pushToken },
      {
        $set: {
          userId: userId,
          expoPushToken: pushToken,
          deviceInfo: deviceInfo || {},
          active: true,
          type: 'expo'
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    logger.info(`[PUSH] ✅ Token enregistré pour user ${userId}, subscription: ${subscription._id}`);
    res.json({
      success: true,
      message: 'Token push enregistré'
    });
  } catch (error) {
    logger.error('[PUSH] ❌ Erreur:', error.message);
    if (error.code) logger.error('[PUSH] Code erreur MongoDB:', error.code);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du token', details: error.message });
  }
});

// Désinscrire un token Expo Push (mobile)
router.post('/unregister', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { pushToken } = req.body;

    if (pushToken) {
      await PushSubscription.updateOne(
        { userId, expoPushToken: pushToken },
        { active: false }
      );
    } else {
      // Désactiver tous les tokens de l'utilisateur
      await PushSubscription.updateMany(
        { userId },
        { active: false }
      );
    }

    res.json({
      success: true,
      message: 'Token push désinscrit'
    });
  } catch (error) {
    logger.error('Erreur unregister push token:', error);
    res.status(500).json({ error: 'Erreur lors de la désinscription' });
  }
});

module.exports = router;
