import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { secureStorage } from './storageService';
import { logger } from './logger';

/**
 * Obtenir l'URL du serveur WebSocket (même logique que l'API)
 */
const getWebSocketUrl = () => {
  if (__DEV__) {
    // En dev, utiliser le même host que l'API
    const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (expoHost) {
      return `http://${expoHost}:3000`;
    }
    return 'http://localhost:3000';
  }
  // Production
  return 'https://api.harmonith.com';
};

/**
 * Service WebSocket pour les communications en temps réel
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Se connecter au serveur WebSocket
   */
  async connect() {
    if (this.socket?.connected) {
      logger.websocket.info('Already connected to WebSocket');
      return;
    }

    try {
      const token = await secureStorage.getToken();
      if (!token) {
        logger.websocket.warn('No token available for WebSocket connection');
        return;
      }

      const SOCKET_URL = getWebSocketUrl();
      logger.websocket.info('Connecting to WebSocket...', { url: SOCKET_URL });

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['polling', 'websocket'], // Essayer polling d'abord, puis upgrade vers websocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventListeners();

    } catch (error) {
      logger.websocket.error('Failed to connect to WebSocket', error);
    }
  }

  /**
   * Configurer les listeners d'événements Socket.IO
   */
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      logger.websocket.info('✅ Connected to WebSocket', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      logger.websocket.warn('❌ Disconnected from WebSocket', { reason });
    });

    this.socket.on('connect_error', (error) => {
      logger.websocket.error('WebSocket connection error', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      logger.websocket.info('🔄 Reconnected to WebSocket', { attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      logger.websocket.error('Reconnection error', error);
    });

    this.socket.on('reconnect_failed', () => {
      logger.websocket.error('Failed to reconnect after all attempts');
    });
  }

  /**
   * Se déconnecter du serveur
   */
  disconnect() {
    if (this.socket) {
      logger.websocket.info('Disconnecting from WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Rejoindre une room (conversation)
   */
  joinConversation(conversationId) {
    if (!this.socket?.connected) {
      logger.websocket.warn('Cannot join conversation: not connected');
      return;
    }

    logger.websocket.debug('Joining conversation', { conversationId });
    this.socket.emit('join_conversation', conversationId);
  }

  /**
   * Quitter une room (conversation)
   */
  leaveConversation(conversationId) {
    if (!this.socket?.connected) {
      return;
    }

    logger.websocket.debug('Leaving conversation', { conversationId });
    this.socket.emit('leave_conversation', conversationId);
  }

  /**
   * Écouter un événement
   */
  on(event, callback) {
    if (!this.socket) {
      logger.websocket.warn('Cannot listen to event: not connected', { event });
      return;
    }

    // Stocker le callback pour pouvoir le retirer plus tard
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
    logger.websocket.debug('Registered listener for event', { event });
  }

  /**
   * Arrêter d'écouter un événement
   */
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Retirer du Map de listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }

    logger.websocket.debug('Unregistered listener for event', { event });
  }

  /**
   * Émettre un événement
   */
  emit(event, data) {
    if (!this.socket?.connected) {
      logger.websocket.warn('Cannot emit event: not connected', { event });
      return;
    }

    logger.websocket.debug('Emitting event', { event, data });
    this.socket.emit(event, data);
  }

  /**
   * Obtenir le statut de connexion
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
    };
  }
}

// Export d'une instance singleton
export default new WebSocketService();
