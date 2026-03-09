const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const logger = require('../utils/logger.js');

// Configuration VAPID (skip en mode test)
if (process.env.NODE_ENV !== 'test' && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contact@nutriform.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else if (process.env.NODE_ENV !== 'test') {
  logger.warn('⚠️  Clés VAPID manquantes - Notifications push désactivées');
}

/**
 * Envoyer une notification à un utilisateur
 */
async function sendNotificationToUser(userId, payload) {
  try {
    // ✅ FIX: Valider la taille du payload (max 4KB pour Web Push)
    const payloadString = JSON.stringify(payload);
    const payloadSize = Buffer.byteLength(payloadString, 'utf8');

    if (payloadSize > 4096) {
      logger.warn(`⚠️  Payload trop volumineux (${payloadSize}B > 4KB) pour userId: ${userId}`);
      return { success: false, message: 'Payload too large' };
    }

    const subscriptions = await PushSubscription.find({
      userId,
      active: true
    });

    if (subscriptions.length === 0) {
      logger.info(`Aucune subscription pour userId: ${userId}`);
      return { success: false, message: 'No subscriptions' };
    }

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          payloadString  // ✅ FIX: Utiliser la variable pré-validée
        ).catch(async err => {
          // Si erreur 410 (Gone), désactiver la subscription
          if (err.statusCode === 410) {
            sub.active = false;
            await sub.save();  // ✅ FIX: Ajouter await
            logger.info(`📱 Push subscription ${sub._id} désactivée (endpoint expiré)`);
          }
          throw err;
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return {
      success: successCount > 0,
      sent: successCount,
      total: subscriptions.length
    };
  } catch (error) {
    logger.error('Erreur sendNotificationToUser:', error);
    throw error;
  }
}

/**
 * Notifier un nouveau match
 */
async function notifyNewMatch(userId, matchData) {
  try {
    // ✅ FIX: Valider les données d'entrée
    if (!userId || !matchData) {
      logger.warn('⚠️  notifyNewMatch: données manquantes');
      return { success: false, message: 'Missing required data' };
    }

    const username = (matchData.username || 'Un utilisateur').substring(0, 50);
    const matchId = matchData.matchId?.toString() || null;

    if (!matchId) {
      logger.warn('⚠️  notifyNewMatch: matchId manquant');
      return { success: false, message: 'Missing matchId' };
    }

    const payload = {
      type: 'new_match',
      title: 'Nouveau Match !',
      body: `${username} a liké ton profil !`,
      icon: matchData.photo || '/assets/icons/notif-match.svg',
      badge: '/assets/icons/badge-72x72.png',
      data: {
        url: '/matching',
        matchId
      }
    };

    return sendNotificationToUser(userId, payload);
  } catch (error) {
    logger.error('Erreur notifyNewMatch:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Notifier un nouveau message
 */
async function notifyNewMessage(userId, messageData) {
  try {
    // ✅ FIX: Valider les données d'entrée
    if (!userId || !messageData) {
      logger.warn('⚠️  notifyNewMessage: données manquantes');
      return { success: false, message: 'Missing required data' };
    }

    const senderName = (messageData.senderName || 'Un utilisateur').substring(0, 50);
    const messageText = (messageData.message || 'Nouveau message').substring(0, 100);
    const conversationId = messageData.conversationId?.toString() || null;

    if (!conversationId) {
      logger.warn('⚠️  notifyNewMessage: conversationId manquant');
      return { success: false, message: 'Missing conversationId' };
    }

    const payload = {
      type: 'new_message',
      title: senderName,
      body: messageText,
      icon: messageData.senderPhoto || '/assets/icons/notif-message.svg',
      badge: '/assets/icons/badge-72x72.png',
      data: {
        url: '/chat',
        conversationId
      }
    };

    return sendNotificationToUser(userId, payload);
  } catch (error) {
    logger.error('Erreur notifyNewMessage:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  sendNotificationToUser,
  notifyNewMatch,
  notifyNewMessage
};
