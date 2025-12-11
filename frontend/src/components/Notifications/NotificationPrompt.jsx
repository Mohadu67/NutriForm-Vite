import { useState, useEffect } from 'react';
import {
  initializeNotifications,
  requestNotificationPermission,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isSubscribed
} from '../../services/notificationService';
import { storage } from '../../shared/utils/storage';
import { isAuthenticated as isAuthenticatedLocal } from '../../utils/authService';
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
    // Vérifier si le prompt a été dismissed récemment (moins de 24h)
    const dismissedTime = storage.get('notificationPromptDismissed');
    if (dismissedTime) {
      const now = Date.now();
      const dismissed = parseInt(dismissedTime, 10);
      const hoursSinceDismiss = (now - dismissed) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return;
      }
    }

    // Vérifier l'authentification (utiliser la version locale qui vérifie le localStorage)
    const auth = isAuthenticatedLocal();
    setIsAuth(auth);

    if (!auth) return;

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
    if (isSupported && auth && !isSub && Notification.permission !== 'denied') {
      // Afficher après 3 secondes pour ne pas déranger immédiatement
      setTimeout(() => setShowPrompt(true), 3000);
    }
  };

  const handleEnable = async () => {
    // Vérifier l'authentification avant de s'abonner
    if (!isAuth) {
      setError('Vous devez être connecté pour activer les notifications');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await subscribeToNotifications();

      if (result.success) {
        setSubscribed(true);
        setPermission('granted');
        setShowPrompt(false);
      } else {
        setError(result.error?.message || 'Erreur lors de l\'activation');
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
    // Réafficher dans 24h
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
              <span className={styles.promptIcon}>🔔</span>
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
