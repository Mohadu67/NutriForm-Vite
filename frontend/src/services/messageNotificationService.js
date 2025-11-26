import { getConversations } from '../shared/api/matchChat';
import { getChatHistory } from '../shared/api/chat';
import logger from '../shared/utils/logger';

class MessageNotificationService {
  constructor() {
    this.checkInterval = null;
    this.lastCheckedTimestamp = Date.now();
    this.notifiedMessageIds = new Set();
    this.isActive = false;
  }

  /**
   * Démarrer le service de vérification des nouveaux messages
   */
  start() {
    if (this.isActive) return;

    this.isActive = true;
    this.lastCheckedTimestamp = Date.now();

    // Demander la permission pour les notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Vérifier immédiatement puis toutes les 30 secondes
    this.checkForNewMessages();
    this.checkInterval = setInterval(() => {
      this.checkForNewMessages();
    }, 30000);

    logger.info('Service de notification des messages démarré');
  }

  /**
   * Arrêter le service
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isActive = false;
    logger.info('Service de notification des messages arrêté');
  }

  /**
   * Vérifier les nouveaux messages
   */
  async checkForNewMessages() {
    if (!this.isActive) return;

    try {
      // Récupérer toutes les conversations
      const { conversations } = await getConversations();

      for (const conv of conversations) {
        // Vérifier les messages non lus
        if (conv.unreadCount > 0 && conv.lastMessage) {
          const messageId = conv.lastMessage._id || conv.lastMessage.id;

          // Ne pas notifier deux fois le même message
          if (!this.notifiedMessageIds.has(messageId)) {
            this.notifiedMessageIds.add(messageId);

            // Vérifier si le message est récent (dans les 5 dernières minutes)
            const messageTime = new Date(conv.lastMessage.createdAt).getTime();
            if (Date.now() - messageTime < 5 * 60 * 1000) {
              this.showNotification(conv);
            }
          }
        }
      }

      // Nettoyer les anciens IDs (garder seulement les 100 derniers)
      if (this.notifiedMessageIds.size > 100) {
        const idsArray = Array.from(this.notifiedMessageIds);
        this.notifiedMessageIds = new Set(idsArray.slice(-100));
      }
    } catch (error) {
      logger.error('Erreur vérification nouveaux messages:', error);
    }
  }

  /**
   * Afficher une notification
   */
  showNotification(conversation) {
    if (Notification.permission !== 'granted') return;
    if (document.hasFocus()) return; // Pas de notification si l'app est active

    const senderName = conversation.otherUser?.name || 'Nouveau message';
    const messageContent = conversation.lastMessage?.content || 'Nouveau message';
    const truncatedContent = messageContent.length > 100
      ? messageContent.substring(0, 97) + '...'
      : messageContent;

    const notification = new Notification(senderName, {
      body: truncatedContent,
      icon: conversation.otherUser?.avatar || '/favicon.png',
      badge: '/favicon.png',
      tag: `conv-${conversation._id}`,
      renotify: true,
      requireInteraction: false
    });

    // Gérer le clic sur la notification
    notification.onclick = () => {
      window.focus();

      // Émettre un événement pour ouvrir la conversation
      window.dispatchEvent(new CustomEvent('openMatchConversation', {
        detail: { conversation }
      }));

      notification.close();
    };

    // Auto-fermer après 10 secondes
    setTimeout(() => notification.close(), 10000);
  }

  /**
   * Marquer un message comme notifié
   */
  markAsNotified(messageId) {
    this.notifiedMessageIds.add(messageId);
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.notifiedMessageIds.clear();
    this.lastCheckedTimestamp = Date.now();
  }
}

// Créer une instance unique (singleton)
const messageNotificationService = new MessageNotificationService();

// Démarrer automatiquement si l'utilisateur est connecté
if (localStorage.getItem('token')) {
  messageNotificationService.start();
}

// Écouter les événements de connexion/déconnexion
window.addEventListener('userLogin', () => {
  messageNotificationService.start();
});

window.addEventListener('userLogout', () => {
  messageNotificationService.stop();
  messageNotificationService.reset();
});

// Gérer les changements de focus pour optimiser les vérifications
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Réduire la fréquence quand l'app est en arrière-plan
    messageNotificationService.stop();
    messageNotificationService.checkInterval = setInterval(() => {
      messageNotificationService.checkForNewMessages();
    }, 60000); // 1 minute en arrière-plan
  } else {
    // Reprendre la fréquence normale quand l'app revient
    messageNotificationService.stop();
    messageNotificationService.start();
  }
});

export default messageNotificationService;