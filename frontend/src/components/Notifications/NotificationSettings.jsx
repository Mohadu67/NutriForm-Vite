import { useState, useEffect } from 'react';
import {
  initializeNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isSubscribed
} from '../../services/notificationService';
import styles from './NotificationPrompt.module.css';

const NotificationSettings = () => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const { supported: isSupported } = await initializeNotifications();
    setSupported(isSupported);

    if (!isSupported) return;

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const isSub = await isSubscribed();
    setSubscribed(isSub);
  };

  const handleEnable = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await subscribeToNotifications();

      if (result.success) {
        setSubscribed(true);
        setPermission('granted');
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
      } else {
        setError(result.error?.message || 'Erreur lors de la désactivation');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.statusHeader}>
          <div className={styles.statusInfo}>
            <span className={styles.statusIcon}>🔔</span>
            <div>
              <h4>Notifications push</h4>
              <p className={styles.statusText}>
                Non supportées par votre navigateur
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusHeader}>
        <div className={styles.statusInfo}>
          <span className={styles.statusIcon}>🔔</span>
          <div>
            <h4>Notifications push</h4>
            <p className={styles.statusText}>
              {subscribed
                ? 'Activées - Vous recevrez des notifications'
                : permission === 'denied'
                ? 'Bloquées par votre navigateur'
                : 'Désactivées'}
            </p>
          </div>
        </div>

        {permission !== 'denied' && (
          <button
            onClick={subscribed ? handleDisable : handleEnable}
            disabled={loading}
            className={subscribed ? styles.disableBtn : styles.statusEnableBtn}
          >
            {loading
              ? '...'
              : subscribed
              ? 'Désactiver'
              : 'Activer'}
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {permission === 'denied' && (
        <p className={styles.deniedHelp}>
          Pour activer les notifications, autorisez-les dans les paramètres de votre navigateur.
        </p>
      )}
    </div>
  );
};

export default NotificationSettings;
