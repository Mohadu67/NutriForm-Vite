const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/notifications - Récupérer les notifications de l'utilisateur
router.get('/', notificationController.getNotifications);

// POST /api/notifications - Ajouter une notification pour l'utilisateur connecté
router.post('/', notificationController.addMyNotification);

// PUT /api/notifications/read-all - Marquer toutes comme lues
router.put('/read-all', notificationController.markAllAsRead);

// PUT /api/notifications/:notificationId/read - Marquer une notification comme lue
router.put('/:notificationId/read', notificationController.markAsRead);

// POST /api/notifications/:notificationId/click - Tracker un clic sur notification
router.post('/:notificationId/click', notificationController.trackClick);

// GET /api/notifications/stats/clicks - Statistiques de clics
router.get('/stats/clicks', notificationController.getClickStats);

// DELETE /api/notifications/clear - Supprimer toutes les notifications
router.delete('/clear', notificationController.clearAll);

// DELETE /api/notifications/:notificationId - Supprimer une notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;