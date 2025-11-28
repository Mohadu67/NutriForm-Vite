const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Map pour stocker les utilisateurs connectés: userId -> socketId
const connectedUsers = new Map();

/**
 * Middleware d'authentification pour Socket.io
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Initialiser Socket.io pour la messagerie temps réel
 */
module.exports = (io) => {
  // Appliquer le middleware d'authentification
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Enregistrer l'utilisateur comme connecté
    connectedUsers.set(userId.toString(), socket.id);
    logger.info(`🔌 WebSocket: Utilisateur ${userId} connecté (socket: ${socket.id})`);

    // Rejoindre la room personnelle de l'utilisateur
    socket.join(`user:${userId}`);

    // Informer l'utilisateur qu'il est connecté
    socket.emit('connected', { userId, socketId: socket.id });

    // Rejoindre une conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      logger.info(`👥 User ${userId} a rejoint la conversation ${conversationId}`);
      socket.emit('conversation_joined', { conversationId });
    });

    // Quitter une conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`👋 User ${userId} a quitté la conversation ${conversationId}`);
    });

    // Notification de saisie en cours
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        isTyping,
        conversationId
      });
    });

    // Marquer comme lu en temps réel
    socket.on('mark_read', ({ conversationId, messageIds }) => {
      socket.to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        messageIds,
        readBy: userId
      });
    });

    // Déconnexion
    socket.on('disconnect', () => {
      connectedUsers.delete(userId.toString());
      logger.info(`🔌 WebSocket: Utilisateur ${userId} déconnecté`);
    });

    // Gestion des erreurs
    socket.on('error', (error) => {
      logger.error(`❌ WebSocket error for user ${userId}:`, error);
    });
  });

  /**
   * Fonction utilitaire pour émettre un nouveau message à tous les participants
   */
  io.emitNewMessage = (conversationId, message) => {
    io.to(`conversation:${conversationId}`).emit('new_message', {
      conversationId,
      message
    });
    logger.info(`📨 Nouveau message émis dans conversation ${conversationId}`);
  };

  /**
   * Fonction utilitaire pour notifier un utilisateur spécifique
   */
  io.notifyUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  /**
   * Vérifier si un utilisateur est en ligne
   */
  io.isUserOnline = (userId) => {
    return connectedUsers.has(userId.toString());
  };

  /**
   * Obtenir tous les utilisateurs en ligne
   */
  io.getOnlineUsers = () => {
    return Array.from(connectedUsers.keys());
  };

  logger.info('✅ WebSocket configuré pour la messagerie temps réel');
};
