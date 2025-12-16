const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const logger = require('../utils/logger');

// Configuration web-push (réutilise les clés VAPID existantes)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contact@harmonith.fr',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Store en mémoire pour les subscriptions à notifier
// En production, on pourrait utiliser Redis pour persister entre les restarts
const pendingNotifications = new Map();

// Durée du rate limit (15 minutes)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * POST /api/rate-limit/notify-when-ready
 * Enregistre une subscription pour être notifiée quand le rate limit est levé
 */
router.post('/notify-when-ready', async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Subscription invalide'
      });
    }

    // Générer un ID unique pour cette subscription
    const subscriptionId = Buffer.from(subscription.endpoint).toString('base64').slice(0, 32);

    // Calculer quand notifier (dans 15 minutes)
    const notifyAt = Date.now() + RATE_LIMIT_WINDOW_MS;

    // Stocker la subscription
    pendingNotifications.set(subscriptionId, {
      subscription,
      notifyAt,
      createdAt: Date.now()
    });

    logger.info(`📬 Rate-limit notification enregistrée, sera envoyée dans 15 min (ID: ${subscriptionId.slice(0, 8)}...)`);

    // Programmer l'envoi de la notification
    setTimeout(async () => {
      await sendRateLimitClearedNotification(subscriptionId);
    }, RATE_LIMIT_WINDOW_MS);

    res.json({
      success: true,
      message: 'Tu seras notifié quand le site sera de nouveau accessible',
      notifyAt: new Date(notifyAt).toISOString()
    });

  } catch (error) {
    logger.error('Erreur enregistrement notification rate-limit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement'
    });
  }
});

/**
 * Envoie la notification push quand le rate limit est levé
 */
async function sendRateLimitClearedNotification(subscriptionId) {
  const pending = pendingNotifications.get(subscriptionId);

  if (!pending) {
    logger.warn(`Notification rate-limit ${subscriptionId} non trouvée (déjà envoyée ou expirée)`);
    return;
  }

  try {
    const payload = JSON.stringify({
      title: 'Harmonith est de retour !',
      body: 'Le trafic s\'est calmé, tu peux revenir sur le site',
      icon: '/assets/icons/notif-congrats.svg',
      badge: '/assets/icons/badge-96x96.png',
      tag: 'rate-limit-cleared',
      data: {
        url: '/',
        type: 'rate-limit-cleared'
      }
    });

    await webpush.sendNotification(pending.subscription, payload);
    logger.info(`✅ Notification rate-limit envoyée (ID: ${subscriptionId.slice(0, 8)}...)`);

  } catch (error) {
    if (error.statusCode === 410) {
      logger.info(`Subscription expirée (410), suppression`);
    } else {
      logger.error('Erreur envoi notification rate-limit:', error.message);
    }
  } finally {
    // Supprimer de la liste dans tous les cas
    pendingNotifications.delete(subscriptionId);
  }
}

// Nettoyage périodique des notifications expirées (toutes les heures)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, data] of pendingNotifications.entries()) {
    // Supprimer les entrées de plus d'1 heure
    if (now - data.createdAt > 60 * 60 * 1000) {
      pendingNotifications.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`🧹 Nettoyage: ${cleaned} notifications rate-limit expirées supprimées`);
  }
}, 60 * 60 * 1000);

module.exports = router;
