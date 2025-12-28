import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { logger } from './logger';
import client from '../api/client';

/**
 * Configuration du comportement des notifications
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Enregistrer l'appareil pour les notifications push
   */
  async registerForPushNotifications() {
    let token = null;

    try {
      // Vérifier si c'est un appareil physique
      if (!Device.isDevice) {
        logger.notifications.info('Push notifications désactivées (simulateur)');
        return null;
      }

      // Demander la permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.notifications.warn('Permission de notification refusée');
        return null;
      }

      // Configuration Android spécifique (doit être fait avant getExpoPushTokenAsync)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Récupérer le token Expo Push
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '0ba81f53-11f3-4012-bc49-1fd0834f7ade'
        });
        token = tokenData.data;
        this.expoPushToken = token;
        logger.notifications.info('Expo Push Token obtenu', { token: token.substring(0, 20) + '...' });

        // Envoyer le token au backend
        await this.sendTokenToBackend(token);
      } catch (tokenError) {
        logger.notifications.warn('Impossible d\'obtenir le token push (projectId non configuré?)', tokenError.message);
        // Continuer sans push externe, les notifications locales fonctionneront
      }

      return token;
    } catch (error) {
      logger.notifications.error('Erreur lors de l\'enregistrement des notifications', error);
      return null;
    }
  }

  /**
   * Envoyer le token au backend
   */
  async sendTokenToBackend(token) {
    try {
      await client.post('/api/push/register', { pushToken: token });
      logger.notifications.info('Push token envoyé au backend');
    } catch (error) {
      logger.notifications.error('Erreur lors de l\'envoi du token', error);
    }
  }

  /**
   * Configurer les listeners de notifications
   */
  setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
    // Listener quand une notification est reçue (app au premier plan)
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      logger.notifications.debug('Notification reçue', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener quand l'utilisateur tape sur une notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.notifications.debug('Notification tapped', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });
  }

  /**
   * Afficher une notification locale (in-app)
   */
  async showLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Afficher immédiatement
      });
    } catch (error) {
      logger.notifications.error('Erreur lors de l\'affichage de la notification locale', error);
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      logger.notifications.error('Erreur lors de la récupération du badge count', error);
      return 0;
    }
  }

  /**
   * Définir le nombre de notifications non lues (badge)
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      logger.notifications.error('Erreur lors de la définition du badge count', error);
    }
  }

  /**
   * Nettoyer les listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Export singleton
export default new NotificationService();
