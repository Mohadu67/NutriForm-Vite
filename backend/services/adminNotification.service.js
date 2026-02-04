const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendNotificationToUser } = require('./pushNotification.service');
const logger = require('../utils/logger');

/**
 * Notifie tous les admins d'un événement
 * @param {Object} options - Options de notification
 * @param {string} options.title - Titre de la notification
 * @param {string} options.message - Message de la notification
 * @param {string} options.link - Lien vers la ressource
 * @param {string} options.type - Type de notification ('admin', 'support', 'system')
 * @param {Object} options.metadata - Métadonnées additionnelles
 * @param {Object} options.io - Instance Socket.IO (optionnel)
 * @param {string} options.icon - Icône pour push notification (optionnel)
 */
async function notifyAdmins({ title, message, link, type = 'admin', metadata = {}, io = null, icon = '/assets/icons/notif-support.svg' }) {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');

    if (admins.length === 0) {
      logger.info('Aucun admin à notifier');
      return;
    }

    const timestamp = Date.now();

    // 1. Envoyer via WebSocket (temps réel)
    if (io && io.notifyUser) {
      for (const admin of admins) {
        const notifId = `${type}-${timestamp}-${admin._id}`;
        io.notifyUser(admin._id.toString(), 'new_notification', {
          id: notifId,
          type,
          title,
          message,
          link,
          metadata,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }

    // 2. Sauvegarder en base de données
    const notificationsToCreate = admins.map(admin => ({
      userId: admin._id,
      type,
      title,
      message,
      link,
      metadata
    }));

    await Notification.create(notificationsToCreate).catch(err =>
      logger.error(`Erreur sauvegarde notifications ${type}:`, err)
    );

    // 3. Envoyer push notifications (avec gestion d'erreur améliorée)
    const pushResults = await Promise.allSettled(
      admins.map(admin =>
        sendNotificationToUser(admin._id, {
          type,
          title,
          body: message,
          icon,
          data: {
            type,
            url: link,
            ...metadata
          }
        })
      )
    );

    // ✅ FIX: Tracker combien de push notifications ont réussi
    const pushSuccess = pushResults.filter(r => r.status === 'fulfilled').length;
    const pushFailed = pushResults.filter(r => r.status === 'rejected').length;

    if (pushFailed > 0) {
      logger.warn(`⚠️  ${pushFailed}/${admins.length} push notifications admin échouées`);
    }

    logger.info(`${admins.length} admin(s) notifié(s) - ${type}: ${title}`);

  } catch (err) {
    logger.error('Erreur notifyAdmins:', err);
  }
}

/**
 * Notifie les admins et le support d'un nouveau ticket
 */
async function notifySupport({ title, message, link, metadata = {}, io = null }) {
  // Notifier admins + support
  const staffUsers = await User.find({
    role: { $in: ['admin', 'support'] }
  }).select('_id');

  if (staffUsers.length === 0) return;

  const timestamp = Date.now();

  if (io && io.notifyUser) {
    for (const user of staffUsers) {
      const notifId = `support-${timestamp}-${user._id}`;
      io.notifyUser(user._id.toString(), 'new_notification', {
        id: notifId,
        type: 'support',
        title,
        message,
        link,
        metadata,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  }

  const notificationsToCreate = staffUsers.map(user => ({
    userId: user._id,
    type: 'support',
    title,
    message,
    link,
    metadata
  }));

  await Notification.create(notificationsToCreate).catch(err =>
    logger.error('Erreur sauvegarde notifications support:', err)
  );

  // ✅ FIX: Utiliser Promise.allSettled pour tracker les erreurs
  const pushResults = await Promise.allSettled(
    staffUsers.map(user =>
      sendNotificationToUser(user._id, {
        type: 'support',
        title,
        body: message,
        icon: '/assets/icons/notif-support.svg',
        data: { type: 'support', url: link, ...metadata }
      })
    )
  );

  const pushSuccess = pushResults.filter(r => r.status === 'fulfilled').length;
  const pushFailed = pushResults.filter(r => r.status === 'rejected').length;

  logger.info(`${staffUsers.length} staff notifié(s) - support: ${title}${pushFailed > 0 ? ` (${pushFailed} push échouées)` : ''}`);
}

/**
 * Notifie TOUS les utilisateurs d'un événement (nouveau partenaire, promo, etc.)
 * @param {Object} options - Options de notification
 * @param {string} options.title - Titre de la notification
 * @param {string} options.message - Message de la notification
 * @param {string} options.link - Lien vers la ressource
 * @param {string} options.type - Type de notification
 * @param {Object} options.metadata - Métadonnées additionnelles
 * @param {Object} options.io - Instance Socket.IO (optionnel)
 * @param {string} options.icon - Icône pour push notification (optionnel)
 */
async function notifyAllUsers({ title, message, link, type = 'promo', metadata = {}, io = null, icon = '/assets/icons/notif-reward.svg' }) {
  try {
    const timestamp = Date.now();
    const BATCH_SIZE = 100;  // ✅ FIX: Traiter par batch au lieu de charger tous les users en mémoire
    let processed = 0;
    let totalError = 0;

    // ✅ FIX: Utiliser cursor pour pagination efficace (streaming)
    const cursor = User.find({ isActive: { $ne: false } }).select('_id').cursor();

    let batch = [];

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      batch.push(doc);

      if (batch.length === BATCH_SIZE) {
        // Traiter ce batch
        await processBatch(batch, { type, title, message, link, metadata, io, icon, timestamp });
        processed += batch.length;
        batch = [];
      }
    }

    // Traiter le dernier batch s'il reste des users
    if (batch.length > 0) {
      await processBatch(batch, { type, title, message, link, metadata, io, icon, timestamp });
      processed += batch.length;
    }

    logger.info(`✅ ${processed} utilisateur(s) notifié(s) - ${type}: ${title}`);

  } catch (err) {
    logger.error('Erreur notifyAllUsers:', err);
  }
}

/**
 * Traiter un batch de notifications
 */
async function processBatch(users, options) {
  const { type, title, message, link, metadata, io, icon, timestamp } = options;

  // 1. Sauvegarder en base de données (bulk)
  const notificationsToCreate = users.map(user => ({
    userId: user._id,
    type,
    title,
    message,
    link,
    metadata
  }));

  await Notification.insertMany(notificationsToCreate, { ordered: false }).catch(err =>
    logger.error(`Erreur sauvegarde notifications ${type}:`, err)
  );

  // 2. Envoyer via WebSocket (temps réel)
  if (io && io.notifyUser) {
    for (const user of users) {
      const notifId = `${type}-${timestamp}-${user._id}`;
      io.notifyUser(user._id.toString(), 'new_notification', {
        id: notifId,
        type,
        title,
        message,
        link,
        metadata,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  }

  // 3. Envoyer push notifications (en parallèle)
  await Promise.allSettled(
    users.map(user =>
      sendNotificationToUser(user._id, {
        type,
        title,
        body: message,
        icon,
        data: {
          type,
          url: link,
          ...metadata
        }
      }).catch(err => logger.error(`Erreur push ${user._id}:`, err.message))
    )
  );
}

module.exports = {
  notifyAdmins,
  notifySupport,
  notifyAllUsers
};
