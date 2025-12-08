import { useEffect } from 'react';
import styles from './Toast.module.css';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  const ariaLabels = {
    success: 'Succès',
    error: 'Erreur',
    info: 'Information',
    warning: 'Avertissement'
  };

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      role="alert"
      aria-live="polite"
      aria-label={ariaLabels[type]}
    >
      <span className={styles.icon} aria-hidden="true">
        {icons[type]}
      </span>
      <span className={styles.message}>{message}</span>
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Fermer la notification"
      >
        ✕
      </button>
    </div>
  );
}
