import { useEffect, useState } from 'react';
import logger from '../shared/utils/logger';

/**
 * Hook pour gérer les mises à jour de l'application
 * Affiche une notification quand une nouvelle version est disponible
 */
export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState(null);

  useEffect(() => {
    // Vérifier si le service worker est supporté
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Écouter les messages du Service Worker
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'NEW_VERSION') {
        logger.info('Nouvelle version détectée:', event.data.version);
        setNewVersion(event.data.version);
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Vérifier si une mise à jour du SW est en attente
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // Si un nouveau SW est en attente d'activation
        if (registration.waiting) {
          logger.info('Service Worker en attente détecté');
          setUpdateAvailable(true);
        }

        // Écouter les changements d'état du SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              logger.info('Nouvelle version du Service Worker installée');
              setUpdateAvailable(true);
            }
          });
        });

        // Forcer une vérification de mise à jour au démarrage
        registration.update();
      } catch (error) {
        logger.error('Erreur lors de la vérification des mises à jour:', error);
      }
    };

    checkForUpdates();

    // Vérifier périodiquement les mises à jour (toutes les 5 minutes)
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
        }
      });
    }, 5 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  const applyUpdate = () => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration && registration.waiting) {
        // Dire au SW en attente de prendre le contrôle
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Recharger la page pour appliquer la mise à jour
      window.location.reload();
    });
  };

  return {
    updateAvailable,
    newVersion,
    applyUpdate,
  };
}
