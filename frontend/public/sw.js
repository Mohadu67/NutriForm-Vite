// Service Worker pour NutriForm
// Gère le cache et les notifications push

const CACHE_NAME = 'nutriform-v2';
const API_CACHE = 'nutriform-api-v2';

// Événement d'installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  self.skipWaiting();
});

// Événement d'activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== API_CACHE) {
            console.log('Service Worker: Suppression ancien cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache: Network First pour API, Cache First pour assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les requêtes externes (Cloudinary, Google Analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // API: Network First avec fallback cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Assets: Cache First avec fallback network (seulement pour assets locaux)
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      });
    })
  );
});

// =============================================
// GESTION DES NOTIFICATIONS PUSH
// =============================================

// Recevoir une notification push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push reçu', event);

  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('Erreur parsing push data:', error);
    notificationData = {
      title: 'Nouvelle notification',
      body: event.data ? event.data.text() : 'Vous avez reçu une notification',
      icon: '/favicon.png'
    };
  }

  const {
    title = 'NutriForm',
    body = '',
    icon = '/favicon.png',
    badge = '/favicon.png',
    data = {},
    type = 'default'
  } = notificationData;

  const options = {
    body,
    icon,
    badge,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      type,
      ...data
    },
    actions: [],
    tag: type,
    requireInteraction: type === 'new_match' // Match reste visible jusqu'à interaction
  };

  // Ajouter des actions selon le type
  if (type === 'new_match') {
    options.actions = [
      { action: 'view', title: 'Voir le profil', icon: '/favicon.png' },
      { action: 'close', title: 'Fermer', icon: '/favicon.png' }
    ];
  } else if (type === 'new_message') {
    options.actions = [
      { action: 'reply', title: 'Répondre', icon: '/favicon.png' },
      { action: 'close', title: 'Fermer', icon: '/favicon.png' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification cliquée', event);

  event.notification.close();

  const { data, action } = event;
  const urlToOpen = data?.url || '/';

  // Si l'utilisateur clique sur "Fermer", ne rien faire
  if (action === 'close') {
    return;
  }

  // Ouvrir ou focus la fenêtre de l'application
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focus
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Envoyer un message pour naviguer vers l'URL
            return client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              data
            });
          });
        }
      }

      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message du client (pour skip waiting, etc.)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
