import { useState, useEffect } from 'react';
import {
  initializeNotifications,
  requestNotificationPermission,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isSubscribed
} from '../../services/notificationService';
import { storage } from '../../shared/utils/storage';
import { secureApiCall } from '../../utils/authService';
import { BellIcon } from '../Icons/GlobalIcons';
import styles from './NotificationPrompt.module.css';

const NotificationPrompt = () => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    checkAuthAndNotificationStatus();
  }, []);

  const checkAuthAndNotificationStatus = async () => {
    // Vérifier si le prompt a été dismissed récemment
    const dismissedTime = storage.get('notificationPromptDismissed');
    const dismissCount = parseInt(storage.get('notificationPromptDismissCount') || '0', 10);

    if (dismissedTime) {
      const now = Date.now();
      const dismissed = parseInt(dismissedTime, 10);
      const hoursSinceDismiss = (now - dismissed) / (1000 * 60 * 60);

      // Augmenter le délai selon le nombre de dismiss: 24h, 72h, 168h (1 semaine)
      const minHours = dismissCount <= 1 ? 24 : dismissCount <= 2 ? 72 : 168;

      if (hoursSinceDismiss < minHours) {
        return;
      }
    }

    // Vérifier l'authentification côté SERVEUR (pas juste localStorage)
    try {
      const response = await secureApiCall('/me');
      if (!response.ok || response.status === 401) {
        setIsAuth(false);
        return;
      }
      setIsAuth(true);
    } catch {
      setIsAuth(false);
      return;
    }

    // Vérifier le support
    const { supported: isSupported } = await initializeNotifications();
    setSupported(isSupported);

    if (!isSupported) return;

    // Vérifier la permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Vérifier l'abonnement
    const isSub = await isSubscribed();
    setSubscribed(isSub);

    // Afficher le prompt si supporté, authentifié, pas encore abonné, et permission pas refusée
    if (isSupported && !isSub && Notification.permission !== 'denied') {
      // Afficher après 3 secondes pour ne pas déranger immédiatement
      setTimeout(() => setShowPrompt(true), 3000);
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await subscribeToNotifications();

      if (result.success) {
        setSubscribed(true);
        setPermission('granted');
        setShowPrompt(false);
        // Réinitialiser le compteur de dismiss
        storage.remove('notificationPromptDismissCount');
        storage.remove('notificationPromptDismissed');
      } else {
        // Gérer l'erreur de session expirée
        if (result.error?.message === 'SESSION_EXPIRED') {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
          setIsAuth(false);
          // Fermer le prompt après 2 secondes
          setTimeout(() => setShowPrompt(false), 2000);
        } else {
          setError(result.error?.message || 'Erreur lors de l\'activation');
        }
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await unsubscribeFromNotifications();

      if (result.success) {
        setSubscribed(false);
        setShowPrompt(false);
      } else {
        setError(result.error?.message || 'Erreur lors de la désactivation');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Incrémenter le compteur de dismiss et sauvegarder le timestamp
    const currentCount = parseInt(storage.get('notificationPromptDismissCount') || '0', 10);
    storage.set('notificationPromptDismissCount', (currentCount + 1).toString());
    storage.set('notificationPromptDismissed', Date.now().toString());
  };

  // Ne rien afficher si pas supporté
  if (!supported) return null;

  // Afficher le prompt de notification
  if (showPrompt && !subscribed && permission !== 'denied') {
    return (
      <div className={styles.promptOverlay} onClick={handleDismiss}>
        <div className={styles.promptCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.promptHeader}>
            <div className={styles.iconWrapper}>
              <span className={styles.iconBg}></span>
              <span className={styles.promptIcon}><BellIcon size={28} /></span>
            </div>
          </div>

          <div className={styles.promptContent}>
            <h3>Restez connecté avec Harmonith</h3>
            <p>
              Ne manquez aucun match ni message de la communauté.
              Activez les notifications pour rester informé en temps réel.
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.promptActions}>
            <button
              onClick={handleEnable}
              disabled={loading}
              className={styles.enableBtn}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Activation...
                </>
              ) : (
                'Activer les notifications'
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={loading}
              className={styles.dismissBtn}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ne rien afficher si pas de prompt
  return null;
};

export default NotificationPrompt;
