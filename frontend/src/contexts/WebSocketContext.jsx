import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { storage } from '../shared/utils/storage';

const WebSocketContext = createContext();

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  /**
   * Connexion au serveur WebSocket
   */
  const connect = useCallback(() => {
    // Ne pas reconnecter si déjà connecté
    if (socketRef.current?.connected) {
      return;
    }

    // Obtenir le token d'authentification
    const token = storage.get('token');
    if (!token) {
      return;
    }

    // Créer la connexion Socket.io
    const newSocket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS
    });

    // Événements de connexion
    newSocket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('connected', () => {
      // WebSocket authentifié
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);

      // Reconnecter automatiquement si déconnexion involontaire
      if (reason === 'io server disconnect') {
        // Le serveur a déconnecté, on doit reconnecter manuellement
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          setTimeout(() => newSocket.connect(), 2000);
        }
      }
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return newSocket;
  }, []);

  /**
   * Déconnexion du serveur WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  /**
   * Rejoindre une conversation
   */
  const joinConversation = useCallback((conversationId) => {
    if (!socketRef.current || !conversationId) return;

    socketRef.current.emit('join_conversation', conversationId);
    setActiveConversationId(conversationId);
  }, []);

  /**
   * Quitter une conversation
   */
  const leaveConversation = useCallback((conversationId) => {
    if (!socketRef.current || !conversationId) return;

    socketRef.current.emit('leave_conversation', conversationId);

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  /**
   * Indiquer qu'on est en train de taper
   */
  const setTyping = useCallback((conversationId, isTyping) => {
    if (!socketRef.current || !conversationId) return;

    socketRef.current.emit('typing', { conversationId, isTyping });
  }, []);

  /**
   * Marquer des messages comme lus
   */
  const markAsRead = useCallback((conversationId, messageIds) => {
    if (!socketRef.current || !conversationId) return;

    socketRef.current.emit('mark_read', { conversationId, messageIds });
  }, []);

  /**
   * Écouter un événement spécifique
   */
  const on = useCallback((event, callback) => {
    if (!socketRef.current) return;

    socketRef.current.on(event, callback);

    // Retourner une fonction de nettoyage
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  /**
   * Arrêter d'écouter un événement
   */
  const off = useCallback((event, callback) => {
    if (!socketRef.current) return;

    socketRef.current.off(event, callback);
  }, []);

  /**
   * Connexion automatique au montage
   */
  useEffect(() => {
    const token = storage.get('token');
    if (token) {
      connect();
    }

    // Reconnecter si l'utilisateur se connecte
    const handleLogin = () => {
      const newToken = storage.get('token');
      if (newToken) {
        connect();
      }
    };

    window.addEventListener('userLoggedIn', handleLogin);

    // Déconnexion au démontage
    return () => {
      disconnect();
      window.removeEventListener('userLoggedIn', handleLogin);
    };
  }, [connect, disconnect]);

  const value = {
    socket: socketRef.current,
    isConnected,
    activeConversationId,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    setTyping,
    markAsRead,
    on,
    off
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
