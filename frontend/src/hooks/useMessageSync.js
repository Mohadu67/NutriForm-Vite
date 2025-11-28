import { useEffect, useRef, useCallback } from 'react';
import { getMessages } from '../shared/api/matchChat';
import { getChatHistory } from '../shared/api/chat';

/**
 * Hook pour synchroniser les messages en temps réel
 * @param {string} conversationId - ID de la conversation
 * @param {string} type - Type de conversation ('match' ou 'ai')
 * @param {function} onNewMessages - Callback appelé lors de nouveaux messages
 * @param {object} options - Options de configuration
 */
export function useMessageSync(conversationId, type, onNewMessages, options = {}) {
  const {
    pollingInterval = 15000, // Augmenté de 5s à 15s
    enabled = true,
    autoScroll = true,
    notifyOnNew = true
  } = options;

  const intervalRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const lastFetchTimeRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Charger les messages depuis l'API
   */
  const fetchMessages = useCallback(async () => {
    // Éviter les requêtes trop rapprochées
    const now = Date.now();
    if (lastFetchTimeRef.current && now - lastFetchTimeRef.current < 2000) {
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      let messages = [];

      if (type === 'match') {
        const response = await getMessages(conversationId, { limit: 100 });
        messages = response.messages || [];
      } else if (type === 'ai') {
        const response = await getChatHistory(conversationId);
        messages = response.messages || [];
      }

      if (!isMountedRef.current) return;

      // Détecter les nouveaux messages
      const lastMessage = messages[messages.length - 1];
      const hasNewMessages = lastMessage &&
        (!lastMessageIdRef.current || lastMessage._id !== lastMessageIdRef.current);

      if (hasNewMessages || !lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMessage?._id;

        // Appeler le callback avec les messages
        onNewMessages(messages, hasNewMessages);

        // Notification si nouveau message et options activées
        if (hasNewMessages && notifyOnNew && !document.hasFocus()) {
          notifyNewMessage(lastMessage, type);
        }

        // Auto-scroll si activé
        if (autoScroll && hasNewMessages) {
          requestAnimationFrame(() => {
            const messagesEnd = document.getElementById('messages-end');
            messagesEnd?.scrollIntoView({ behavior: 'smooth' });
          });
        }
      }
    } catch (error) {
      // Erreur silencieuse
    }
  }, [conversationId, type, onNewMessages, notifyOnNew, autoScroll]);

  /**
   * Notifier l'utilisateur d'un nouveau message
   */
  const notifyNewMessage = useCallback((message, type) => {
    if (Notification.permission !== 'granted') return;

    const title = type === 'match'
      ? message.sender?.name || 'Nouveau message'
      : 'Assistant NutriForm';

    const notification = new Notification(title, {
      body: message.content?.substring(0, 100) || 'Nouveau message',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: `msg-${conversationId}`,
      renotify: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-fermer après 5 secondes
    setTimeout(() => notification.close(), 5000);
  }, [conversationId]);

  /**
   * Démarrer le polling
   */
  const startPolling = useCallback(() => {
    if (!enabled || !conversationId) return;

    // Charger immédiatement
    fetchMessages();

    // Configurer l'intervalle
    intervalRef.current = setInterval(fetchMessages, pollingInterval);
  }, [enabled, conversationId, fetchMessages, pollingInterval, type]);

  /**
   * Arrêter le polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Rafraîchir manuellement
   */
  const refresh = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  /**
   * Effet pour gérer le cycle de vie du polling
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && conversationId) {
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [enabled, conversationId, startPolling, stopPolling]);

  /**
   * Écouter les événements de focus pour rafraîchir
   */
  useEffect(() => {
    const handleFocus = () => {
      if (enabled && conversationId) {
        refresh();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && enabled && conversationId) {
        refresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, conversationId, refresh]);

  return {
    refresh,
    stopPolling,
    startPolling
  };
}