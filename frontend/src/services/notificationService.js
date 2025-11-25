import { secureApiCall } from '../utils/authService';
import { isAuthenticated } from '../shared/api/auth';
import { getConversations } from '../shared/api/matchChat';

let swRegistration = null;

/**
 * Initialiser les notifications
 */
export async function initializeNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { supported: false };
  }

  // Ne pas enregistrer le service worker en mode dev pour éviter les conflits avec Vite HMR
  if (import.meta.env.DEV) {
    return { supported: false, reason: 'dev-mode' };
  }

  try {
    // Enregistrer le service worker (production uniquement)
    swRegistration = await navigator.serviceWorker.register('/sw.js');
    return { supported: true, registration: swRegistration };
  } catch (error) {
    return { supported: false, error };
  }
}

/**
 * Demander la permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * S'abonner aux notifications
 */
export async function subscribeToNotifications() {
  try {
    // Vérifier la permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permission refusée');
    }

    // Récupérer la clé publique VAPID
    const response = await secureApiCall('/push/vapid-public-key');
    const data = await response.json();
    const publicKey = data.publicKey;

    if (!publicKey) {
      throw new Error('Clé VAPID manquante');
    }

    // S'abonner
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Envoyer la subscription au backend
    const subscribeResponse = await secureApiCall('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth'))
        },
        deviceInfo: {
          browser: navigator.userAgent,
          os: navigator.platform
        }
      })
    });

    if (!subscribeResponse.ok) {
      throw new Error('Erreur lors de l\'abonnement');
    }

    return { success: true, subscription };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Se désabonner
 */
export async function unsubscribeFromNotifications() {
  try {
    const subscription = await swRegistration.pushManager.getSubscription();

    if (subscription) {
      await secureApiCall('/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      await subscription.unsubscribe();
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Vérifier si abonné
 */
export async function isSubscribed() {
  if (!swRegistration) return false;

  try {
    const subscription = await swRegistration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    return false;
  }
}

// Helpers
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Vérifier les messages non lus au chargement de l'app
 * et afficher une notification locale si nécessaire
 */
export async function checkUnreadMessagesOnLoad() {
  try {
    // Vérifier si l'utilisateur est connecté
    const auth = await isAuthenticated();
    if (!auth) return;

    // Vérifier la permission de notifications
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Récupérer les conversations
    const { conversations } = await getConversations();
    if (!conversations || conversations.length === 0) return;

    // Compter le total de messages non lus
    const totalUnread = conversations.reduce((sum, conv) => {
      const count = conv.unreadCount || 0;
      return sum + count;
    }, 0);

    // Si des messages non lus, afficher une notification locale
    if (totalUnread > 0) {
      new Notification('💬 Nouveaux messages', {
        body: `Vous avez ${totalUnread} message${totalUnread > 1 ? 's' : ''} non lu${totalUnread > 1 ? 's' : ''}`,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'unread-messages',
        requireInteraction: false
      });
    }
  } catch (error) {
    // Silencieux
  }
}
