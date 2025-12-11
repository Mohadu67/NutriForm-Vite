import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../../shared/utils/storage';
import styles from './NotificationCenter.module.css';

// SVG Icon pour la cloche
const BellIcon = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Types de notifications
const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  SYSTEM: 'system',
  ACTIVITY: 'activity',
  ADMIN: 'admin'
};

// Icônes par type
const TypeIcons = {
  message: '💬',
  system: '🔔',
  activity: '🏃',
  admin: '👑'
};

export default function NotificationCenter({ className = '' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Charger les notifications depuis le localStorage
  const loadNotifications = useCallback(() => {
    try {
      const stored = storage.get('notificationCenter');
      if (stored) {
        const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
        setNotifications(parsed || []);
      }
    } catch {
      setNotifications([]);
    }
  }, []);

  // Sauvegarder les notifications
  const saveNotifications = useCallback((notifs) => {
    storage.set('notificationCenter', JSON.stringify(notifs));
  }, []);

  // Ajouter une notification (appelable de l'extérieur via window event)
  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50); // Garder max 50
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Marquer comme lu
  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Supprimer toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, [saveNotifications]);

  // Compter les non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  // Gérer le clic sur une notification
  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification.id);

    // Navigation selon le type
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === NOTIFICATION_TYPES.MESSAGE) {
      // Ouvrir le chat
      window.dispatchEvent(new CustomEvent('openChat'));
    } else if (notification.type === NOTIFICATION_TYPES.ADMIN) {
      navigate('/admin');
    }

    setIsOpen(false);
  }, [markAsRead, navigate]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Écouter les événements de nouvelles notifications
  useEffect(() => {
    const handleNewNotification = (event) => {
      addNotification(event.detail);
    };

    window.addEventListener('addNotification', handleNewNotification);

    return () => {
      window.removeEventListener('addNotification', handleNewNotification);
    };
  }, [addNotification]);

  // Formater le timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      {/* Icône avec badge */}
      <button
        className={styles.iconButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={isOpen}
      >
        <BellIcon size={22} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Header */}
          <div className={styles.header}>
            <h3>Notifications</h3>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={styles.markAllBtn}
                >
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          {/* Liste des notifications */}
          <div className={styles.list}>
            {isLoading ? (
              <div className={styles.loading}>
                <span className={styles.spinner}></span>
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔔</span>
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={`${styles.item} ${!notif.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={styles.itemIcon}>
                    {notif.avatar ? (
                      <img src={notif.avatar} alt="" className={styles.avatar} />
                    ) : (
                      <span className={styles.typeIcon}>
                        {TypeIcons[notif.type] || TypeIcons.system}
                      </span>
                    )}
                  </div>
                  <div className={styles.itemContent}>
                    <p className={styles.itemTitle}>{notif.title}</p>
                    {notif.message && (
                      <p className={styles.itemMessage}>{notif.message}</p>
                    )}
                    <span className={styles.itemTime}>{formatTime(notif.timestamp)}</span>
                  </div>
                  {!notif.read && <span className={styles.unreadDot}></span>}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className={styles.footer}>
              <button onClick={clearAll} className={styles.clearBtn}>
                Effacer tout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export des helpers pour ajouter des notifications depuis n'importe où
export const addNotification = (notification) => {
  window.dispatchEvent(new CustomEvent('addNotification', { detail: notification }));
};

export { NOTIFICATION_TYPES };
