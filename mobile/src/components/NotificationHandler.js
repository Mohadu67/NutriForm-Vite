import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import notificationService from '../services/notificationService';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../services/logger';
import websocketService from '../services/websocket';

/**
 * Composant qui gere les notifications push, WebSocket et affiche les toasts
 * Doit etre place a l'interieur des providers Toast et Navigation
 */
export default function NotificationHandler() {
  const navigation = useNavigation();
  const { showMessageNotification, showInfo } = useToast();

  // Refs pour les callbacks stables dans le listener WebSocket
  const showMessageNotificationRef = useRef(showMessageNotification);
  const showInfoRef = useRef(showInfo);
  const navigationRef = useRef(navigation);
  useEffect(() => { showMessageNotificationRef.current = showMessageNotification; }, [showMessageNotification]);
  useEffect(() => { showInfoRef.current = showInfo; }, [showInfo]);
  useEffect(() => { navigationRef.current = navigation; }, [navigation]);

  /**
   * Naviguer vers le bon ecran selon le type de notification
   */
  const navigateForNotification = (data) => {
    const nav = navigationRef.current;
    if (!nav) return;

    const type = data?.type || data?.metadata?.action || '';

    if (type === 'message' || data?.conversationId) {
      nav.navigate('ChatDetail', {
        conversationId: data.conversationId,
        otherUser: data.otherUser,
      });
    } else if (type === 'match' || type === 'new_match') {
      nav.navigate('Social', { screen: 'Matching' });
    } else if (type.startsWith('challenge') || type === 'activity') {
      nav.navigate('Social', { screen: 'Challenges' });
    } else if (type === 'follow' || type === 'like' || type === 'comment') {
      nav.navigate('Social', { screen: 'Flux' });
    } else if (type === 'badge' || type === 'achievement') {
      nav.navigate('Social', { screen: 'Leaderboard' });
    }
  };

  // Listener push notifications (Expo)
  useEffect(() => {
    notificationService.setupNotificationListeners(
      // Notification recue en foreground
      (notification) => {
        logger.notifications.info('Notification recue', notification);
        const { title, body, data } = notification.request.content;
        const type = data?.type || '';

        if (type === 'message' || type === 'new_message' || data?.conversationId) {
          showMessageNotification({
            senderName: title || data?.senderName || 'Nouveau message',
            senderAvatar: data?.senderAvatar || data?.avatar,
            messagePreview: body || data?.messagePreview,
            isOnline: data?.isOnline,
            onPress: () => navigateForNotification(data),
          });
        } else {
          showInfo(title || 'Notification', body);
        }
      },
      // Notification tapped (background/killed)
      (response) => {
        logger.notifications.info('Notification tapped', response);
        const { data } = response.notification.request.content;
        navigateForNotification(data);
      }
    );

    return () => {
      // Cleanup gere dans App.js
    };
  }, [navigation, showMessageNotification, showInfo]);

  // Listener WebSocket global pour new_notification (toujours actif)
  useEffect(() => {
    const handleNewNotification = (notification) => {
      logger.notifications.info('WebSocket new_notification', notification);

      const type = notification?.type || notification?.metadata?.action || '';
      const title = notification?.title || 'Notification';
      const body = notification?.message || notification?.body || '';

      // Messages de chat : utiliser le toast message dédié
      if (type === 'message' || type === 'new_message' || notification?.metadata?.conversationId) {
        showMessageNotificationRef.current({
          senderName: title,
          senderAvatar: notification?.avatar,
          messagePreview: body,
          isOnline: true,
          onPress: () => navigateForNotification({
            type: 'message',
            conversationId: notification?.metadata?.conversationId || notification?.link,
            otherUser: notification?.metadata?.otherUser,
          }),
        });
        return;
      }

      // Toutes les autres notifications : toast info
      showInfoRef.current(title, body);
    };

    websocketService.on('new_notification', handleNewNotification);
    return () => websocketService.off('new_notification', handleNewNotification);
  }, []);

  return null;
}
