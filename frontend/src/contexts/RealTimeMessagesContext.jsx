import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getMessages } from '../shared/api/matchChat';
import { getChatHistory } from '../shared/api/chat';

const RealTimeMessagesContext = createContext();

export function RealTimeMessagesProvider({ children }) {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversationType, setConversationType] = useState(null); // 'match' ou 'ai'
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isPolling, setIsPolling] = useState(false);

  const pollingIntervalRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const lastFetchRef = useRef(null);

  // Configurer le polling (15 secondes pour conversation active, 60 secondes pour notifications)
  const ACTIVE_POLLING_INTERVAL = 15000; // 15 secondes (optimisé)
  const BACKGROUND_POLLING_INTERVAL = 60000; // 60 secondes (optimisé)
  const MIN_FETCH_INTERVAL = 3000; // 3 secondes minimum entre les requêtes

  /**
   * Charger les messages d'une conversation
   */
  const loadMessages = useCallback(async (conversationId, type) => {
    // Éviter les requêtes trop rapprochées
    const now = Date.now();
    if (lastFetchRef.current && now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      return;
    }
    lastFetchRef.current = now;

    try {
      let newMessages = [];

      if (type === 'match') {
        const { messages: msgs } = await getMessages(conversationId, { limit: 100 });
        newMessages = msgs || [];
      } else if (type === 'ai') {
        const { messages: history } = await getChatHistory(conversationId);
        newMessages = history || [];
      }

      // Vérifier s'il y a de nouveaux messages
      const lastMessage = newMessages[newMessages.length - 1];
      const hasNewMessages = lastMessage &&
        (!lastMessageIdRef.current || lastMessage._id !== lastMessageIdRef.current);

      if (hasNewMessages) {
        // Nouveaux messages détectés
        setMessages(newMessages);
        lastMessageIdRef.current = lastMessage._id;

        // Déclencher une notification si la conversation n'est pas active
        if (!document.hasFocus() || conversationId !== activeConversationId) {
          triggerNotification(lastMessage, conversationId, type);
        }
      } else if (!lastMessageIdRef.current) {
        // Première charge
        setMessages(newMessages);
        if (lastMessage) {
          lastMessageIdRef.current = lastMessage._id;
        }
      }
    } catch (error) {
      // Erreur silencieuse
    }
  }, [activeConversationId]);

  /**
   * Déclencher une notification pour un nouveau message
   */
  const triggerNotification = useCallback((message, conversationId, type) => {
    // Vérifier si les notifications sont autorisées
    if (Notification.permission !== 'granted') return;

    const isUserMessage = message.sender || message.role === 'user';
    if (isUserMessage && message.sender?._id === getCurrentUserId()) return;

    const title = type === 'match'
      ? message.sender?.name || 'Nouveau message'
      : 'Assistant NutriForm';

    const body = message.content?.substring(0, 100) || 'Nouveau message';

    const notification = new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: `message-${conversationId}`,
      renotify: true,
      data: { conversationId, type }
    });

    notification.onclick = () => {
      window.focus();
      // Émettre un événement pour ouvrir la conversation
      window.dispatchEvent(new CustomEvent('openConversation', {
        detail: { conversationId, type }
      }));
      notification.close();
    };
  }, []);

  /**
   * Obtenir l'ID de l'utilisateur actuel (à implémenter selon votre système d'auth)
   */
  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user._id || user.id;
  };

  /**
   * Démarrer le polling pour une conversation
   */
  const startPolling = useCallback((conversationId, type) => {
    // Arrêter le polling existant
    stopPolling();

    setActiveConversationId(conversationId);
    setConversationType(type);
    setIsPolling(true);
    lastMessageIdRef.current = null;

    // Charger immédiatement
    loadMessages(conversationId, type);

    // Configurer le polling
    pollingIntervalRef.current = setInterval(() => {
      loadMessages(conversationId, type);
    }, ACTIVE_POLLING_INTERVAL);
  }, [loadMessages]);

  /**
   * Arrêter le polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    lastMessageIdRef.current = null;
  }, []);

  /**
   * Polling en arrière-plan pour les notifications
   */
  useEffect(() => {
    let backgroundInterval;

    const checkForNewMessages = async () => {
      // Vérifier les nouvelles conversations/messages pour les notifications
      // Cette fonction peut être étendue pour vérifier plusieurs conversations
      try {
        // À implémenter : vérifier les messages non lus depuis le backend
        // const unreadMessages = await getUnreadMessages();
        // processUnreadMessages(unreadMessages);
      } catch (error) {
        // Erreur silencieuse
      }
    };

    // Démarrer le polling en arrière-plan si pas de conversation active
    if (!isPolling) {
      backgroundInterval = setInterval(checkForNewMessages, BACKGROUND_POLLING_INTERVAL);
    }

    return () => {
      if (backgroundInterval) {
        clearInterval(backgroundInterval);
      }
    };
  }, [isPolling]);

  /**
   * Nettoyer lors du démontage
   */
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  /**
   * Ajouter un message localement (optimistic update)
   */
  const addLocalMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  /**
   * Mettre à jour un message existant
   */
  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => prev.map(msg =>
      msg._id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  /**
   * Rafraîchir manuellement les messages
   */
  const refreshMessages = useCallback(() => {
    if (activeConversationId && conversationType) {
      loadMessages(activeConversationId, conversationType);
    }
  }, [activeConversationId, conversationType, loadMessages]);

  return (
    <RealTimeMessagesContext.Provider value={{
      messages,
      setMessages,
      isPolling,
      activeConversationId,
      conversationType,
      unreadCounts,
      startPolling,
      stopPolling,
      addLocalMessage,
      updateMessage,
      refreshMessages
    }}>
      {children}
    </RealTimeMessagesContext.Provider>
  );
}

export function useRealTimeMessages() {
  const context = useContext(RealTimeMessagesContext);
  if (!context) {
    throw new Error('useRealTimeMessages must be used within a RealTimeMessagesProvider');
  }
  return context;
}