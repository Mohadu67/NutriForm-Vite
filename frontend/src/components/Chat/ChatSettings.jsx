import { useState } from 'react';
import styles from './ChatSettings.module.css';

/**
 * Modal de paramètres du chat
 */
export default function ChatSettings({
  conversation,
  onClose,
  onDelete,
  onMute,
  onSetTempMessages
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tempDuration, setTempDuration] = useState(conversation?.tempMessagesDuration || 0);

  const otherUser = conversation?.otherUser;
  const isMuted = conversation?.isMuted || false;

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    onDelete?.(conversation._id);
    onClose();
  };

  const handleMuteToggle = () => {
    onMute?.(conversation._id, !isMuted);
  };

  const handleTempMessages = (duration) => {
    setTempDuration(duration);
    onSetTempMessages?.(conversation._id, duration);
  };

  const tempOptions = [
    { value: 0, label: 'Désactivé' },
    { value: 24, label: '24 heures' },
    { value: 168, label: '7 jours' },
    { value: 720, label: '30 jours' }
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header avec avatar */}
        <div className={styles.header}>
          <img
            src={
              otherUser?.profile?.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.pseudo || otherUser?.prenom || 'U')}&background=f7b186&color=fff`
            }
            alt=""
            className={styles.avatar}
          />
          <div className={styles.userInfo}>
            <h3>{otherUser?.pseudo || otherUser?.prenom || 'Utilisateur'}</h3>
            <p>{otherUser?.profile?.city || 'Partenaire'}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Options */}
        <div className={styles.options}>
          {/* Sourdine */}
          <button
            className={`${styles.option} ${isMuted ? styles.active : ''}`}
            onClick={handleMuteToggle}
          >
            <span className={styles.optionIcon}>{isMuted ? '🔔' : '🔕'}</span>
            <span className={styles.optionText}>
              {isMuted ? 'Réactiver les notifications' : 'Mettre en sourdine'}
            </span>
            {isMuted && <span className={styles.optionBadge}>Activé</span>}
          </button>

          {/* Messages temporaires */}
          <div className={styles.optionGroup}>
            <div className={styles.optionHeader}>
              <span className={styles.optionIcon}>⏱️</span>
              <span className={styles.optionText}>Messages temporaires</span>
            </div>
            <p className={styles.optionHint}>
              Les messages disparaîtront après la durée sélectionnée
            </p>
            <div className={styles.tempOptions}>
              {tempOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.tempBtn} ${tempDuration === opt.value ? styles.tempActive : ''}`}
                  onClick={() => handleTempMessages(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Supprimer */}
          <button
            className={`${styles.option} ${styles.danger} ${showDeleteConfirm ? styles.confirmMode : ''}`}
            onClick={handleDelete}
          >
            <span className={styles.optionIcon}>🗑️</span>
            <span className={styles.optionText}>
              {showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer la conversation'}
            </span>
          </button>
          {showDeleteConfirm && (
            <button
              className={styles.cancelBtn}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
