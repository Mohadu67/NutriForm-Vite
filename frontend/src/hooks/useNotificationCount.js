import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { secureApiCall } from '../utils/authService';
import endpoints from '../shared/api/endpoints';
import { storage } from '../shared/utils/storage';

/**
 * Hook pour récupérer le nombre de notifications non lues
 * Utilisé pour afficher le badge sur l'icône de notifications
 */
export function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const webSocketContext = useWebSocket();
  const { on, isConnected } = webSocketContext || {};

  const isLoggedIn = Boolean(storage.get('user'));

  // Charger le nombre de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await secureApiCall(endpoints.notifications.list);
      if (response.ok) {
        const data = await response.json();
        const notifications = data.notifications || [];
        const count = notifications.filter(n => !n.read).length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Erreur chargement notifications count:', error);
    }
  }, [isLoggedIn]);

  // Charger au montage
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Écouter les nouvelles notifications via WebSocket
  useEffect(() => {
    if (!isConnected || !on || !isLoggedIn) return;

    const cleanup = on('new_notification', () => {
      setUnreadCount(prev => prev + 1);
    });

    return cleanup;
  }, [on, isConnected, isLoggedIn]);

  // Écouter les événements locaux de notification
  useEffect(() => {
    const handleNewNotification = () => {
      setUnreadCount(prev => prev + 1);
    };

    const handleNotificationRead = () => {
      loadUnreadCount(); // Recharger pour avoir le compte exact
    };

    window.addEventListener('addNotification', handleNewNotification);
    window.addEventListener('notificationRead', handleNotificationRead);
    window.addEventListener('notificationsCleared', () => setUnreadCount(0));

    return () => {
      window.removeEventListener('addNotification', handleNewNotification);
      window.removeEventListener('notificationRead', handleNotificationRead);
      window.removeEventListener('notificationsCleared', () => setUnreadCount(0));
    };
  }, [loadUnreadCount]);

  return { unreadCount, refreshCount: loadUnreadCount };
}

export default useNotificationCount;
