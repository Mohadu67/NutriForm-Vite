import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { useChat } from '../../../contexts/ChatContext';
import { secureApiCall } from '../../../utils/authService';
import endpoints from '../../../shared/api/endpoints';
import ConfirmModal from '../../Modal/ConfirmModal';
import {
  BellIcon,
  MessageCircleIcon,
  HeartIcon,
  CrownIcon,
  ActivityIcon
} from '../../Icons/GlobalIcons';
import styles from './NotificationCenter.module.css';

// Types de notifications
const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  SYSTEM: 'system',
  ACTIVITY: 'activity',
  ADMIN: 'admin',
  SUPPORT: 'support'
};

// Icônes SVG par type
const TypeIcons = {
  message: <MessageCircleIcon size={18} />,
  match: <HeartIcon size={18} filled />,
  system: <BellIcon size={18} />,
  activity: <ActivityIcon size={18} />,
  admin: <CrownIcon size={18} />,
  support: <MessageCircleIcon size={18} />
};

export default function NotificationCenter({ className = '', mode = 'dropdown', onClose }) {
  const navigate = useNavigate();
  const webSocketContext = useWebSocket();
  const chatContext = useChat();
  const { on, isConnected } = webSocketContext || {};
  const { openMatchChatById, openAIChat } = chatContext || {};
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading] = useState(false);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, programName: '', reason: '' });
  const dropdownRef = useRef(null);

  // En mode panel, toujours "ouvert"
  const isPanel = mode === 'panel';

  // Charger les notifications depuis le serveur
  const loadNotifications = useCallback(async () => {
    try {
      const response = await secureApiCall(endpoints.notifications.list);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      setNotifications([]);
    }
  }, []);

  // Sauvegarder une notification sur le serveur
  const saveNotificationToServer = useCallback(async (notif) => {
    try {
      await secureApiCall(endpoints.notifications.add, {
        method: 'POST',
        body: JSON.stringify(notif)
      });
    } catch (error) {
      console.error('Erreur sauvegarde notification:', error);
    }
  }, []);

  // Ajouter une notification (appelable de l'extérieur via window event)
  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: notification.id || Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    // Ajouter localement d'abord pour UX réactive
    setNotifications(prev => {
      // Éviter les doublons par id
      if (prev.some(n => n.id === newNotif.id || n._id === newNotif.id)) {
        return prev;
      }
      return [newNotif, ...prev].slice(0, 50);
    });

    // Sauvegarder sur le serveur en arrière-plan
    saveNotificationToServer(newNotif);
  }, [saveNotificationToServer]);

  // Marquer comme lu
  const markAsRead = useCallback(async (id) => {
    // Mise à jour locale immédiate
    setNotifications(prev => prev.map(n =>
      (n.id === id || n._id === id) ? { ...n, read: true } : n
    ));

    // Sync serveur en arrière-plan
    try {
      const notifId = id;
      await secureApiCall(endpoints.notifications.markAsRead(notifId), {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Erreur markAsRead:', error);
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    // Mise à jour locale immédiate
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Sync serveur
    try {
      await secureApiCall(endpoints.notifications.markAllRead, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
    }
  }, []);

  // Supprimer toutes les notifications
  const clearAll = useCallback(async () => {
    // Mise à jour locale immédiate
    setNotifications([]);

    // Sync serveur
    try {
      await secureApiCall(endpoints.notifications.clearAll, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erreur clearAll:', error);
    }
  }, []);

  // Compter les non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  // Gérer le clic sur une notification
  const handleNotificationClick = useCallback(async (notification) => {
    markAsRead(notification.id);

    // Pour les notifications de programme refusé, afficher un modal avec la raison
    if (notification.type === 'system' && notification.metadata?.action === 'rejected') {
      setRejectionModal({
        isOpen: true,
        programName: notification.metadata.programName || 'Programme',
        reason: notification.metadata.reason || 'Aucune raison spécifiée'
      });
      setIsOpen(false);
      if (isPanel && onClose) {
        onClose();
      }
      return;
    }

    // Pour les notifications de programme approuvé, rediriger vers la page programmes
    if (notification.type === 'system' && notification.metadata?.action === 'approved') {
      navigate('/programs');
      setIsOpen(false);
      if (isPanel && onClose) {
        onClose();
      }
      return;
    }

    // Pour les notifications support
    if (notification.type === 'support') {
      // Si c'est une notification admin (a un lien vers /admin/support-tickets), naviguer vers la page
      if (notification.link && notification.link.includes('/admin/')) {
        navigate(notification.link);
        setIsOpen(false);
        if (isPanel && onClose) {
          onClose();
        }
        return;
      }
      // Sinon c'est une notification user (réponse du support), ouvrir le chat IA
      if (openAIChat) {
        const conversationId = notification.metadata?.conversationId;
        if (conversationId) {
          openAIChat(conversationId);
          setIsOpen(false);
          if (isPanel && onClose) {
            onClose();
          }
          return;
        }
      }
    }

    // Pour les messages match, ouvrir directement la conversation dans le modal
    if (notification.type === 'message' && notification.link && openMatchChatById) {
      // Extraire le conversationId du link: /matching?conversation=xxx
      const match = notification.link.match(/conversation=([a-f0-9]+)/i);
      if (match && match[1]) {
        const conversationId = match[1];
        await openMatchChatById(conversationId);
        setIsOpen(false);
        if (isPanel && onClose) {
          onClose();
        }
        return;
      }
    }

    // Pour les autres types, navigation classique
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === NOTIFICATION_TYPES.MESSAGE) {
      // Fallback: ouvrir le chat history
      window.dispatchEvent(new CustomEvent('openChat'));
    } else if (notification.type === NOTIFICATION_TYPES.ADMIN) {
      navigate('/admin');
    }

    setIsOpen(false);
    // Fermer le panel si en mode panel
    if (isPanel && onClose) {
      onClose();
    }
  }, [markAsRead, navigate, isPanel, onClose, openMatchChatById, openAIChat]);

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

  // Écouter les événements de nouvelles notifications (CustomEvent local)
  useEffect(() => {
    const handleNewNotification = (event) => {
      addNotification(event.detail);
    };

    window.addEventListener('addNotification', handleNewNotification);

    return () => {
      window.removeEventListener('addNotification', handleNewNotification);
    };
  }, [addNotification]);

  // Écouter les notifications via WebSocket
  useEffect(() => {
    if (!isConnected || !on) return;

    const cleanup = on('new_notification', (notification) => {
      addNotification(notification);
    });

    return cleanup;
  }, [on, isConnected, addNotification]);

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

  // Contenu des notifications (partagé entre dropdown et panel)
  const notificationContent = (
    <>
      {/* Header - différent selon le mode */}
      {!isPanel && (
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
      )}

      {/* Actions pour le mode panel */}
      {isPanel && unreadCount > 0 && (
        <div className={styles.panelActions}>
          <button
            onClick={markAllAsRead}
            className={styles.markAllBtn}
          >
            Tout marquer lu
          </button>
        </div>
      )}

      {/* Liste des notifications */}
      <div className={`${styles.list} ${isPanel ? styles.panelList : ''}`}>
        {isLoading ? (
          <div className={styles.loading}>
            <span className={styles.spinner}></span>
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}><BellIcon size={32} /></span>
            <p>Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif._id || notif.id}
              className={`${styles.item} ${!notif.read ? styles.unread : ''}`}
              onClick={() => handleNotificationClick({ ...notif, id: notif._id || notif.id })}
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
                <span className={styles.itemTime}>{formatTime(notif.createdAt || notif.timestamp)}</span>
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
    </>
  );

  // Mode panel : afficher directement le contenu sans wrapper dropdown
  if (isPanel) {
    return (
      <>
        <div className={`${styles.panelContainer} ${className}`}>
          {notificationContent}
        </div>
        <ConfirmModal
          isOpen={rejectionModal.isOpen}
          onClose={() => setRejectionModal({ isOpen: false, programName: '', reason: '' })}
          onConfirm={() => {
            setRejectionModal({ isOpen: false, programName: '', reason: '' });
            navigate('/programs');
          }}
          title={`Programme "${rejectionModal.programName}" refusé`}
          message={`Raison du refus :\n\n${rejectionModal.reason}`}
          confirmText="Voir mes programmes"
          type="warning"
          showCancel={false}
        />
      </>
    );
  }

  // Modal de refus de programme
  const rejectionModalElement = (
    <ConfirmModal
      isOpen={rejectionModal.isOpen}
      onClose={() => setRejectionModal({ isOpen: false, programName: '', reason: '' })}
      onConfirm={() => {
        setRejectionModal({ isOpen: false, programName: '', reason: '' });
        navigate('/programs');
      }}
      title={`Programme "${rejectionModal.programName}" refusé`}
      message={`Raison du refus :\n\n${rejectionModal.reason}`}
      confirmText="Voir mes programmes"
      type="warning"
      showCancel={false}
    />
  );

  // Mode dropdown (comportement par défaut)
  return (
    <>
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
            {notificationContent}
          </div>
        )}
      </div>
      {rejectionModalElement}
    </>
  );
}

// Export des helpers pour ajouter des notifications depuis n'importe où
export const addNotification = (notification) => {
  window.dispatchEvent(new CustomEvent('addNotification', { detail: notification }));
};

export { NOTIFICATION_TYPES };
