const webPush = require('web-push');
const { Expo } = require('expo-server-sdk');
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
  logger.warn('⚠️  Clés VAPID manquantes - Notifications push web désactivées');
}

// Client Expo Push
const expo = new Expo();

/**
 * Envoyer une notification à un utilisateur (web + mobile)
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

    // Séparer les subscriptions web et Expo
    const webSubs = subscriptions.filter(sub => sub.type === 'web' && sub.endpoint);
    const expoSubs = subscriptions.filter(sub => sub.type === 'expo' && sub.expoPushToken);

    let successCount = 0;

    // Envoyer les notifications web (VAPID)
    if (webSubs.length > 0) {
      const webResults = await Promise.allSettled(
        webSubs.map(sub =>
          webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            JSON.stringify(payload)
          ).catch(err => {
            if (err.statusCode === 410) {
              sub.active = false;
              sub.save();
            }
            throw err;
          })
        )
      );
      successCount += webResults.filter(r => r.status === 'fulfilled').length;
    }

    // Envoyer les notifications Expo (mobile)
    if (expoSubs.length > 0) {
      const expoResults = await sendExpoPushNotifications(expoSubs, payload);
      successCount += expoResults.successCount;
    }

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
 * Envoyer des notifications via Expo Push
 */
async function sendExpoPushNotifications(subscriptions, payload) {
  const messages = [];

  for (const sub of subscriptions) {
    if (!Expo.isExpoPushToken(sub.expoPushToken)) {
      logger.warn(`Token Expo invalide: ${sub.expoPushToken}`);
      continue;
    }

    messages.push({
      to: sub.expoPushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: 1
    });
  }

  if (messages.length === 0) {
    return { successCount: 0, failCount: 0 };
  }

  // Envoyer par chunks
  const chunks = expo.chunkPushNotifications(messages);
  let successCount = 0;
  let failCount = 0;

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

      for (let i = 0; i < ticketChunk.length; i++) {
        const ticket = ticketChunk[i];
        if (ticket.status === 'ok') {
          successCount++;
        } else {
          failCount++;
          // Si le token est invalide, désactiver la subscription
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const token = chunk[i].to;
            await PushSubscription.updateOne(
              { expoPushToken: token },
              { active: false }
            );
            logger.info(`Token Expo désactivé (DeviceNotRegistered): ${token}`);
          }
        }
      }
    } catch (error) {
      logger.error('Erreur envoi chunk Expo:', error);
      failCount += chunk.length;
    }
  }

  return { successCount, failCount };
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
      type: 'message',
      url: '/chat',
      conversationId: messageData.conversationId,
      senderName: messageData.senderName,
      senderAvatar: messageData.senderPhoto,
      otherUser: messageData.otherUser || {
        _id: messageData.senderId,
        pseudo: messageData.senderName,
        photo: messageData.senderPhoto
      }
    }
  };

  return sendNotificationToUser(userId, payload);
}

module.exports = {
  sendNotificationToUser,
  notifyNewMatch,
  notifyNewMessage
};
