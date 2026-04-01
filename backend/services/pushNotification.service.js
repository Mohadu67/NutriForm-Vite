const webPush = require('web-push');
const { Expo } = require('expo-server-sdk');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');
const logger = require('../utils/logger.js');

/**
 * Mapping type de notification → clé de préférence utilisateur
 * Les types absents de ce mapping sont TOUJOURS envoyés (admin, system, etc.)
 */
const NOTIFICATION_TYPE_TO_PREF = {
  // Social — matches & interactions
  new_match: 'matches',
  match: 'matches',
  new_message: 'messages',
  message: 'messages',
  follow: 'matches',
  like: 'matches',
  comment: 'matches',
  // Contenu
  new_program: 'newPrograms',
  program: 'newPrograms',
  content: 'newPrograms',
  new_recipe: 'newRecipes',
  recipe: 'newRecipes',
  promo: 'promoCodes',
  partner: 'promoCodes',
  partner_redemption: 'promoCodes',
  // Gamification — défis
  challenge_received: 'challengeUpdates',
  challenge_accepted: 'challengeUpdates',
  challenge_declined: 'challengeUpdates',
  challenge_update: 'challengeUpdates',
  challenge_ending: 'challengeUpdates',
  challenge_session: 'challengeUpdates',
  challenge_won: 'challengeUpdates',
  challenge_lost: 'challengeUpdates',
  challenge_draw: 'challengeUpdates',
  congratulations: 'challengeUpdates',
  // Gamification — badges & XP
  badge_unlocked: 'badgeUnlocked',
  xp_update: 'xpUpdates',
  xp_premium_expired: 'xpUpdates',
  xp_redemption: 'xpUpdates',
  leaderboard_update: 'leaderboardUpdates',
  // Rappels
  daily_reminder: 'dailyReminder',
  streak_danger: 'streakReminders',
  streak_congrats: 'streakReminders',
  inactive_reminder: 'dailyReminder',
  weekly_recap: 'weeklyRecapPush',
  content_creation_tip: 'contentCreationTips',
  // Support (admin/support notifs ne sont pas filtrées — pas dans ce mapping)
  support_reply: 'supportReplies',
};

// Configuration VAPID (skip en mode test)
if (process.env.NODE_ENV !== 'test' && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contact@nutriform.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else if (process.env.NODE_ENV !== 'test') {
  logger.warn('⚠️  Clés VAPID manquantes - Notifications web push désactivées');
}

// Client Expo Push
const expoClient = new Expo();

/**
 * Envoyer une notification push Expo (mobile)
 */
async function sendExpoPushNotifications(subscriptions, payload) {
  const messages = [];

  for (const sub of subscriptions) {
    const token = sub.expoPushToken;
    if (!token || !Expo.isExpoPushToken(token)) {
      logger.warn(`⚠️  Token Expo invalide pour sub ${sub._id}: ${token}`);
      continue;
    }

    messages.push({
      to: token,
      sound: 'default',
      title: payload.title || 'Harmonith',
      body: payload.body || payload.message || '',
      data: payload.data || {},
      badge: 1,
      channelId: 'default',
    });
  }

  if (messages.length === 0) return { sent: 0, total: 0 };

  // Expo recommande d'envoyer par chunks
  const chunks = expoClient.chunkPushNotifications(messages);
  let sent = 0;

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expoClient.sendPushNotificationsAsync(chunk);

      for (let i = 0; i < ticketChunk.length; i++) {
        const ticket = ticketChunk[i];
        if (ticket.status === 'ok') {
          sent++;
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          // Token invalide, désactiver la subscription
          const token = chunk[i].to;
          await PushSubscription.updateOne(
            { expoPushToken: token },
            { active: false }
          );
          logger.info(`📱 Token Expo désactivé (DeviceNotRegistered): ${token}`);
        } else {
          logger.warn(`⚠️  Expo push ticket error:`, ticket);
        }
      }
    } catch (error) {
      logger.error('Erreur envoi chunk Expo push:', error);
    }
  }

  return { sent, total: messages.length };
}

/**
 * Envoyer une notification web push (VAPID)
 */
async function sendWebPushNotifications(subscriptions, payload) {
  const payloadString = JSON.stringify(payload);
  const payloadSize = Buffer.byteLength(payloadString, 'utf8');

  if (payloadSize > 4096) {
    logger.warn(`⚠️  Payload web push trop volumineux (${payloadSize}B > 4KB)`);
    return { sent: 0, total: subscriptions.length };
  }

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payloadString
      ).catch(async err => {
        if (err.statusCode === 410) {
          sub.active = false;
          await sub.save();
          logger.info(`📱 Web push subscription ${sub._id} désactivée (endpoint expiré)`);
        }
        throw err;
      })
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return { sent, total: subscriptions.length };
}

/**
 * Envoyer une notification à un utilisateur (web + mobile)
 */
async function sendNotificationToUser(userId, payload) {
  try {
    // Vérifier les préférences utilisateur avant d'envoyer
    const notifType = payload.type || payload.data?.type;
    const prefKey = NOTIFICATION_TYPE_TO_PREF[notifType];

    if (prefKey) {
      const user = await User.findById(userId).select('notificationPreferences').lean();
      if (user?.notificationPreferences?.[prefKey] === false) {
        logger.info(`🔕 Notification ${notifType} bloquée par préférence "${prefKey}" pour userId: ${userId}`);
        return { success: false, message: 'Blocked by user preference', prefKey };
      }
    }

    const subscriptions = await PushSubscription.find({ userId, active: true });

    if (subscriptions.length === 0) {
      logger.info(`Aucune subscription pour userId: ${userId}`);
      return { success: false, message: 'No subscriptions' };
    }

    const webSubs = subscriptions.filter(s => s.type === 'web' && s.endpoint);
    const expoSubs = subscriptions.filter(s => s.type === 'expo' && s.expoPushToken);

    let webResult = { sent: 0, total: 0 };
    let expoResult = { sent: 0, total: 0 };

    // Envoyer web push
    if (webSubs.length > 0) {
      webResult = await sendWebPushNotifications(webSubs, payload);
    }

    // Envoyer Expo push (mobile)
    if (expoSubs.length > 0) {
      expoResult = await sendExpoPushNotifications(expoSubs, payload);
    }

    const totalSent = webResult.sent + expoResult.sent;
    const totalTargets = webResult.total + expoResult.total;

    logger.info(`📬 Push envoyé à userId ${userId}: ${totalSent}/${totalTargets} (web: ${webResult.sent}, expo: ${expoResult.sent})`);

    return {
      success: totalSent > 0,
      sent: totalSent,
      total: totalTargets
    };
  } catch (error) {
    logger.error('Erreur sendNotificationToUser:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Notifier un nouveau match
 */
async function notifyNewMatch(userId, matchData) {
  try {
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
        type: 'match',
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
        type: 'message',
        url: '/chat',
        conversationId,
        senderId: messageData.senderId?.toString(),
        senderName,
        senderAvatar: messageData.senderPhoto,
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
