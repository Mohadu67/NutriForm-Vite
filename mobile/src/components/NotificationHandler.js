import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import notificationService from '../services/notificationService';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../services/logger';

/**
 * Composant qui gere les notifications push et affiche les toasts
 * Doit etre place a l'interieur des providers Toast et Navigation
 */
export default function NotificationHandler() {
  const navigation = useNavigation();
  const { showMessageNotification, showInfo } = useToast();

  useEffect(() => {
    // Configurer les listeners de notifications
    notificationService.setupNotificationListeners(
      // Quand une notification est recue (app au premier plan)
      (notification) => {
        logger.notifications.info('Notification recue', notification);
        const { title, body, data } = notification.request.content;

        // Si c'est une notification de message
        if (data?.type === 'message' || data?.conversationId) {
          showMessageNotification({
            senderName: title || data?.senderName || 'Nouveau message',
            senderAvatar: data?.senderAvatar || data?.avatar,
            messagePreview: body || data?.messagePreview,
            isOnline: data?.isOnline,
            onPress: () => {
              // Naviguer vers la conversation
              if (data?.conversationId) {
                navigation.navigate('ChatDetail', {
                  conversationId: data.conversationId,
                  otherUser: data.otherUser,
                });
              }
            },
          });
        } else {
          // Notification generique
          showInfo(title || 'Notification', body);
        }
      },
      // Quand l'utilisateur tape sur une notification
      (response) => {
        logger.notifications.info('Notification tapped', response);
        const { data } = response.notification.request.content;

        // Naviguer vers la conversation si applicable
        if (data?.conversationId) {
          navigation.navigate('ChatDetail', {
            conversationId: data.conversationId,
            otherUser: data.otherUser,
          });
        }
      }
    );

    return () => {
      // Le cleanup est gere dans App.js
    };
  }, [navigation, showMessageNotification, showInfo]);

  // Ce composant ne rend rien visuellement
  return null;
}
