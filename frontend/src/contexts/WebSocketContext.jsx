import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { storage } from '../shared/utils/storage';
import { isAuthenticated } from '../utils/authService';

const WebSocketContext = createContext(null);

// Extraire l'URL de base (sans /api) pour le WebSocket
const API_URL = import.meta.env.VITE_API_URL || '';
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '') || 'http://localhost:3000';

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

    // Vérifier si l'utilisateur est authentifié (via cookie httpOnly)
    const authenticated = isAuthenticated();
    if (!authenticated) {
      return;
    }

    // Récupérer le token pour WebSocket
    const wsToken = storage.get('wsToken');

    // Créer la connexion Socket.io
    const newSocket = io(BACKEND_URL, {
      path: '/socket.io',
      auth: { token: wsToken }, // Token pour authentification WebSocket
      withCredentials: true,
      transports: ['polling', 'websocket'], // Polling d'abord, plus stable
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      forceNew: true // Forcer une nouvelle connexion
    });

    // Événements de connexion
    newSocket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('connected', () => {
      // Authentification confirmée par le serveur
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
    let isMounted = true;

    // Petit délai pour éviter les problèmes avec React StrictMode (double mount)
    const connectTimeout = setTimeout(() => {
      if (isMounted && isAuthenticated()) {
        connect();
      }
    }, 100);

    // Reconnecter si l'utilisateur se connecte
    const handleLogin = () => {
      if (isMounted && isAuthenticated()) {
        connect();
      }
    };

    window.addEventListener('userLoggedIn', handleLogin);

    // Déconnexion au démontage
    return () => {
      isMounted = false;
      clearTimeout(connectTimeout);
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
  // Retourner le contexte même s'il est null (pour éviter les erreurs sur Safari lors du lazy loading)
  return context;
}
