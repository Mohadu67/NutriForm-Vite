import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { secureApiCall } from '../../utils/authService';
import endpoints from '../../shared/api/endpoints';
import styles from './SessionCongratsModal.module.css';

export default function SessionCongratsModal({
  isOpen,
  onClose,
  sessionData,
  opponentName,
  opponentAvatar,
  challengeId,
  sessionUserId
}) {
  const [congratsSent, setCongratsSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCongratsSent(false);
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}h${remainMins > 0 ? ` ${remainMins}min` : ''}`;
    }
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  const handleCongrats = async () => {
    if (congratsSent || sending || !sessionUserId) return;

    try {
      setSending(true);
      await secureApiCall(endpoints.challenges.congratulate, {
        method: 'POST',
        body: JSON.stringify({
          challengeId,
          targetUserId: sessionUserId
        })
      });
      setCongratsSent(true);
    } catch (error) {
      console.error('Erreur envoi félicitations:', error);
    } finally {
      setSending(false);
    }
  };

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.avatarSection}>
            {opponentAvatar ? (
              <img src={opponentAvatar} alt={opponentName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {opponentName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className={styles.headerText}>
              <h3>{opponentName || 'Adversaire'}</h3>
              <span className={styles.subtitle}>vient de terminer une séance!</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          {sessionData && (
            <>
              <div className={styles.sessionTitle}>
                {sessionData.sessionName || 'Séance terminée'}
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>⏱️</span>
                  <span className={styles.statValue}>{formatDuration(sessionData.duration)}</span>
                  <span className={styles.statLabel}>Durée</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>🔥</span>
                  <span className={styles.statValue}>{sessionData.calories || 0}</span>
                  <span className={styles.statLabel}>Calories</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>💪</span>
                  <span className={styles.statValue}>{sessionData.exerciseCount || 0}</span>
                  <span className={styles.statLabel}>Exercices</span>
                </div>
              </div>
            </>
          )}

          {!sessionData && (
            <p className={styles.noData}>Détails de la séance non disponibles</p>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.closeAction} onClick={onClose}>
            Fermer
          </button>
          <button
            className={`${styles.congratsBtn} ${congratsSent ? styles.sent : ''}`}
            onClick={handleCongrats}
            disabled={congratsSent || sending}
          >
            {sending ? 'Envoi...' : congratsSent ? '🎉 Félicitations envoyées!' : '👏 Féliciter'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
