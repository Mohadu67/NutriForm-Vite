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
          JSON.stringify(payload)
        ).catch(err => {
          // Si erreur 410 (Gone), désactiver la subscription
          if (err.statusCode === 410) {
            sub.active = false;
            sub.save();
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
  const payload = {
    type: 'new_match',
    title: 'Nouveau Match !',
    body: `${matchData.username} a liké ton profil !`,
    icon: matchData.photo || '/assets/icons/notif-match.svg',
    badge: '/assets/icons/badge-72x72.png',
    data: {
      url: '/matching',
      matchId: matchData.matchId
    }
  };

  return sendNotificationToUser(userId, payload);
}

/**
 * Notifier un nouveau message
 */
async function notifyNewMessage(userId, messageData) {
  const payload = {
    type: 'new_message',
    title: `${messageData.senderName}`,
    body: messageData.message,
    icon: messageData.senderPhoto || '/assets/icons/notif-message.svg',
    badge: '/assets/icons/badge-72x72.png',
    data: {
      url: '/chat',
      conversationId: messageData.conversationId
    }
  };

  return sendNotificationToUser(userId, payload);
}

module.exports = {
  sendNotificationToUser,
  notifyNewMatch,
  notifyNewMessage
};
