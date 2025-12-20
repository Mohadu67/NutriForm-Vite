const Notification = require('../models/Notification');
const logger = require('../utils/logger.js');

// Récupérer les notifications d'un utilisateur
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = parseInt(req.query.skip) || 0;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit
    });
  } catch (error) {
    logger.error('Erreur getNotifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications.' });
  }
};

// Créer une notification (utilisé en interne ou par admin)
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, avatar, link, metadata } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: 'userId et title sont requis.' });
    }

    const notification = new Notification({
      userId,
      type: type || 'system',
      title,
      message,
      avatar,
      link,
      metadata
    });

    await notification.save();

    res.status(201).json({ notification });
  } catch (error) {
    logger.error('Erreur createNotification:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la notification.' });
  }
};

// Ajouter une notification pour l'utilisateur connecté (via WebSocket sync)
exports.addMyNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, title, message, avatar, link, metadata, id: clientId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title est requis.' });
    }

    const notification = new Notification({
      userId,
      type: type || 'system',
      title,
      message,
      avatar,
      link,
      metadata: { ...metadata, clientId }
    });

    await notification.save();

    res.status(201).json({ notification });
  } catch (error) {
    logger.error('Erreur addMyNotification:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la notification.' });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    // Essayer de trouver par _id MongoDB ou par metadata.clientId
    const mongoose = require('mongoose');
    let notification;

    if (mongoose.Types.ObjectId.isValid(notificationId)) {
      notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true }
      );
    }

    // Si pas trouvé par _id, chercher par clientId dans metadata
    if (!notification) {
      notification = await Notification.findOneAndUpdate(
        { 'metadata.clientId': notificationId, userId },
        { read: true },
        { new: true }
      );
    }

    if (!notification) {
      // Pas d'erreur, juste ignorer (notification peut être locale uniquement)
      return res.json({ message: 'OK' });
    }

    res.json({ notification });
  } catch (error) {
    logger.error('Erreur markAsRead:', error);
    res.status(500).json({ error: 'Erreur lors du marquage de la notification.' });
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      message: 'Toutes les notifications ont été marquées comme lues.',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    logger.error('Erreur markAllAsRead:', error);
    res.status(500).json({ error: 'Erreur lors du marquage des notifications.' });
  }
};

// Supprimer une notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée.' });
    }

    res.json({ message: 'Notification supprimée.' });
  } catch (error) {
    logger.error('Erreur deleteNotification:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la notification.' });
  }
};

// Supprimer toutes les notifications
exports.clearAll = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ userId });

    res.json({
      message: 'Toutes les notifications ont été supprimées.',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    logger.error('Erreur clearAll:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des notifications.' });
  }
};

// Tracker un clic sur une notification
exports.trackClick = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const mongoose = require('mongoose');
    let notification;

    if (mongoose.Types.ObjectId.isValid(notificationId)) {
      notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          $set: { clickedAt: new Date(), read: true },
          $inc: { clickCount: 1 }
        },
        { new: true }
      );
    }

    if (!notification) {
      notification = await Notification.findOneAndUpdate(
        { 'metadata.clientId': notificationId, userId },
        {
          $set: { clickedAt: new Date(), read: true },
          $inc: { clickCount: 1 }
        },
        { new: true }
      );
    }

    if (!notification) {
      return res.json({ message: 'OK' });
    }

    res.json({ notification });
  } catch (error) {
    logger.error('Erreur trackClick:', error);
    res.status(500).json({ error: 'Erreur lors du tracking du clic.' });
  }
};

// Obtenir les statistiques de clics sur notifications
exports.getClickStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Stats globales
    const stats = await Notification.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          clicked: { $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] } },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    // Taux de clic global
    const globalStats = await Notification.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          clicked: { $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] } },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    res.json({
      byType: stats,
      global: globalStats[0] || { total: 0, clicked: 0, totalClicks: 0 },
      period: days
    });
  } catch (error) {
    logger.error('Erreur getClickStats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des stats.' });
  }
};

// Helper: Créer une notification en interne (appelé depuis d'autres controllers)
exports.createNotificationInternal = async (userId, data) => {
  try {
    const notification = new Notification({
      userId,
      type: data.type || 'system',
      title: data.title,
      message: data.message,
      avatar: data.avatar,
      link: data.link,
      metadata: data.metadata
    });

    await notification.save();
    return notification;
  } catch (error) {
    logger.error('Erreur createNotificationInternal:', error);
    return null;
  }
};

module.exports = exports;