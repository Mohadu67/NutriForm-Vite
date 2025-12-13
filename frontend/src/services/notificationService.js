import { secureApiCall, isAuthenticated } from '../utils/authService';
import client from '../shared/api/client';

let swRegistration = null;
let initializationPromise = null;

/**
 * Initialiser les notifications
 */
export async function initializeNotifications() {
  // Éviter les appels concurrents
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { supported: false };
    }

    try {
      // Enregistrer le service worker manuel pour les push notifications
      swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Si l'utilisateur est authentifié et a accordé la permission, synchroniser la subscription
      if (isAuthenticated() && Notification.permission === 'granted') {
        await syncSubscriptionWithServer();
      }

      return { supported: true, registration: swRegistration };
    } catch (error) {
      console.error('Erreur enregistrement SW:', error);
      return { supported: false, error };
    }
  })();

  return initializationPromise;
}

/**
 * Synchroniser la subscription avec le serveur
 * S'assure que la subscription du navigateur est bien enregistrée côté backend
 */
async function syncSubscriptionWithServer() {
  try {
    if (!swRegistration) return { synced: false };

    const subscription = await swRegistration.pushManager.getSubscription();

    if (subscription) {
      // Envoyer/mettre à jour la subscription au backend
      const response = await secureApiCall('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth'))
          },
          deviceInfo: {
            browser: navigator.userAgent,
            os: navigator.userAgentData?.platform || navigator.platform || 'unknown'
          }
        })
      });

      if (response.ok) {
        return { synced: true };
      }
    }
    return { synced: false };
  } catch (error) {
    console.error('Erreur synchronisation subscription:', error);
    return { synced: false, error };
  }
}

/**
 * Synchroniser après connexion utilisateur
 * À appeler après un login réussi
 */
export async function syncNotificationsOnLogin() {
  if (!('Notification' in window)) return;

  // Attendre que le SW soit prêt
  await initializeNotifications();

  // Si l'utilisateur a déjà accordé la permission, synchroniser
  if (Notification.permission === 'granted') {
    await syncSubscriptionWithServer();
  }
}

// Écouter l'événement de connexion pour synchroniser automatiquement
if (typeof window !== 'undefined') {
  window.addEventListener('userLoggedIn', () => {
    syncNotificationsOnLogin();
  });
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

    // Récupérer la clé publique VAPID (endpoint public, pas besoin d'auth)
    const vapidResponse = await client.get('/push/vapid-public-key');
    const publicKey = vapidResponse.data.publicKey;

    if (!publicKey) {
      throw new Error('Clé VAPID manquante');
    }

    // S'abonner
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Envoyer la subscription au backend (nécessite auth)
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
          os: navigator.userAgentData?.platform || navigator.platform || 'unknown'
        }
      })
    });

    if (subscribeResponse.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }

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
