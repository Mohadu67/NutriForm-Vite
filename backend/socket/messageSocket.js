const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Map pour stocker les utilisateurs connectés: userId -> socketId
const connectedUsers = new Map();

// Map pour stocker les utilisateurs présents dans chaque conversation: conversationId -> Set<userId>
const conversationPresence = new Map();

// Map pour stocker les utilisateurs qui ont ChatHistory ouvert (peuvent voir les messages dans la liste)
const usersInChatList = new Set();

/**
 * Extraire le token depuis les cookies
 */
const extractTokenFromCookie = (cookieHeader) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  return cookies.token || null;
};

/**
 * Middleware d'authentification pour Socket.io
 */
const authenticateSocket = async (socket, next) => {
  try {
    // Essayer d'abord le token dans auth, puis dans le cookie
    const authToken = socket.handshake.auth?.token;
    const cookieToken = extractTokenFromCookie(socket.handshake.headers.cookie);
    const token = authToken || cookieToken;

    // Log détaillé pour debug en production
    const origin = socket.handshake.headers.origin || 'unknown';
    logger.info(`🔌 WebSocket Auth attempt from ${origin}: authToken=${!!authToken}, cookieToken=${!!cookieToken}`);

    if (!token) {
      logger.warn(`WebSocket: Aucun token trouvé (origin: ${origin})`);
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    // Accepter soit 'userId' soit 'id' du token (pour compatibilité)
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      logger.error(`🔌 WebSocket: Token invalide - userId/id manquant (origin: ${origin})`);
      return next(new Error('Authentication error: Invalid token structure'));
    }

    logger.info(`🔌 WebSocket Auth SUCCESS: userId=${userId}`);
    socket.userId = userId;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error.message);
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
    const userIdStr = userId.toString();

    // Vérifier que l'authentification a réussi
    if (!userId) {
      logger.warn('🔌 WebSocket: Connexion sans userId, déconnexion...');
      socket.disconnect(true);
      return;
    }

    // Enregistrer l'utilisateur comme connecté
    connectedUsers.set(userIdStr, socket.id);
    logger.info(`🔌 WebSocket: Utilisateur ${userIdStr} connecté (socket: ${socket.id})`);

    // Rejoindre la room personnelle de l'utilisateur
    socket.join(`user:${userIdStr}`);

    // Informer l'utilisateur qu'il est connecté
    socket.emit('connected', { userId: userIdStr, socketId: socket.id });

    // Notifier tous les utilisateurs que cet utilisateur est en ligne
    socket.broadcast.emit('user_online', { userId: userIdStr });

    // Envoyer la liste des utilisateurs en ligne au nouveau connecté
    socket.emit('online_users_list', { users: Array.from(connectedUsers.keys()) });

    // Rejoindre une conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      logger.info(`👥 User ${userIdStr} a rejoint la conversation ${conversationId}`);

      // Notifier le nouvel arrivant des utilisateurs déjà présents dans cette conversation
      const presentUsers = conversationPresence.get(conversationId);
      if (presentUsers && presentUsers.size > 0) {
        presentUsers.forEach(presentUserId => {
          if (presentUserId !== userIdStr) {
            // Envoyer la présence des autres utilisateurs au nouvel arrivant
            socket.emit('user_presence', {
              conversationId,
              userId: presentUserId,
              isPresent: true
            });
            logger.info(`👁️ Notifié ${userIdStr} que ${presentUserId} est présent dans ${conversationId}`);
          }
        });
      }

      socket.emit('conversation_joined', { conversationId });
    });

    // Quitter une conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);

      // Nettoyer la présence de l'utilisateur dans cette conversation
      const presentUsers = conversationPresence.get(conversationId);
      if (presentUsers) {
        presentUsers.delete(userIdStr);
        if (presentUsers.size === 0) {
          conversationPresence.delete(conversationId);
        }
      }

      logger.info(`👋 User ${userIdStr} a quitté la conversation ${conversationId}`);
    });

    // Notification de saisie en cours
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: userIdStr,
        isTyping,
        conversationId
      });
    });

    // Notification de présence dans une conversation
    socket.on('user_presence', ({ conversationId, isPresent }) => {
      // Mettre à jour le tracking de présence
      if (isPresent) {
        if (!conversationPresence.has(conversationId)) {
          conversationPresence.set(conversationId, new Set());
        }
        conversationPresence.get(conversationId).add(userIdStr);
      } else {
        const presentUsers = conversationPresence.get(conversationId);
        if (presentUsers) {
          presentUsers.delete(userIdStr);
          if (presentUsers.size === 0) {
            conversationPresence.delete(conversationId);
          }
        }
      }

      // Broadcaster aux autres utilisateurs dans la conversation
      socket.to(`conversation:${conversationId}`).emit('user_presence', {
        conversationId,
        userId: userIdStr,
        isPresent
      });
      logger.info(`👁️ User ${userIdStr} presence in ${conversationId}: ${isPresent}`);
    });

    // Notification de présence dans ChatHistory (liste des conversations)
    // Permet de savoir si l'autre peut VOIR le message dans sa liste (✓✓ gris)
    socket.on('chat_list_presence', ({ isPresent }) => {
      if (isPresent) {
        usersInChatList.add(userIdStr);
      } else {
        usersInChatList.delete(userIdStr);
      }

      // Notifier tous les autres utilisateurs
      socket.broadcast.emit('user_chat_list_status', {
        userId: userIdStr,
        isInChatList: isPresent
      });
      logger.info(`📋 User ${userIdStr} chat list presence: ${isPresent}`);
    });

    // Marquer comme lu en temps réel
    socket.on('mark_read', ({ conversationId, messageIds }) => {
      socket.to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        messageIds,
        readBy: userIdStr
      });
    });

    // Déconnexion
    socket.on('disconnect', () => {
      connectedUsers.delete(userIdStr);
      logger.info(`🔌 WebSocket: Utilisateur ${userIdStr} déconnecté`);

      // Nettoyer la présence dans ChatHistory
      if (usersInChatList.has(userIdStr)) {
        usersInChatList.delete(userIdStr);
        socket.broadcast.emit('user_chat_list_status', {
          userId: userIdStr,
          isInChatList: false
        });
      }

      // Nettoyer la présence de l'utilisateur dans toutes les conversations
      conversationPresence.forEach((presentUsers, conversationId) => {
        if (presentUsers.has(userIdStr)) {
          presentUsers.delete(userIdStr);
          // Notifier les autres utilisateurs dans cette conversation
          socket.to(`conversation:${conversationId}`).emit('user_presence', {
            conversationId,
            userId: userIdStr,
            isPresent: false
          });
          if (presentUsers.size === 0) {
            conversationPresence.delete(conversationId);
          }
        }
      });

      // Notifier tous les utilisateurs que cet utilisateur est hors ligne
      socket.broadcast.emit('user_offline', { userId: userIdStr });
    });

    // Gestion des erreurs
    socket.on('error', (error) => {
      logger.error(`❌ WebSocket error for user ${userIdStr}:`, error);
    });
  });

  /**
   * Fonction utilitaire pour émettre un nouveau message à tous les participants
   * Émet dans la room de conversation ET dans les rooms personnelles des participants
   */
  io.emitNewMessage = (conversationId, message, participantIds = []) => {
    // Émettre dans la room de conversation (pour ceux qui sont dans ChatDetail)
    io.to(`conversation:${conversationId}`).emit('new_message', {
      conversationId,
      message
    });

    // Émettre aussi dans les rooms personnelles des participants
    // (pour ceux qui sont sur ConversationsScreen et ne sont pas dans la room conversation)
    participantIds.forEach(userId => {
      const userIdStr = userId.toString();
      io.to(`user:${userIdStr}`).emit('new_message', {
        conversationId,
        message
      });
    });

    logger.info(`📨 Nouveau message émis dans conversation ${conversationId} + ${participantIds.length} rooms utilisateur`);
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

  /**
   * Vérifier si un utilisateur est dans sa liste de conversations (ChatHistory)
   */
  io.isUserInChatList = (userId) => {
    return usersInChatList.has(userId.toString());
  };

  logger.info('✅ WebSocket configuré pour la messagerie temps réel');
};
