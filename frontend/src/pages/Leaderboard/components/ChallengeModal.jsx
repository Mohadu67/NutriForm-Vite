import { useState } from 'react';
import { CHALLENGE_TYPES, CHALLENGE_DURATIONS } from '../hooks/useChallenges';
import styles from './ChallengeModal.module.css';

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function ChallengeModal({
  isOpen,
  onClose,
  onSubmit,
  opponent,
  loading = false
}) {
  const [type, setType] = useState('sessions');
  const [duration, setDuration] = useState(7);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const result = await onSubmit(opponent.userId, type, duration);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Erreur lors de la création du défi');
    }
  };

  const opponentName = opponent?.displayName || opponent?.pseudo || 'Adversaire';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>⚔️</span>
            Défier @{opponentName}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Type de défi */}
          <div className={styles.section}>
            <label className={styles.label}>Type de défi</label>
            <div className={styles.typeGrid}>
              {Object.entries(CHALLENGE_TYPES).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.typeBtn} ${type === key ? styles.selected : ''}`}
                  onClick={() => setType(key)}
                >
                  <span className={styles.typeIcon}>{info.icon}</span>
                  <span className={styles.typeLabel}>{info.label}</span>
                  <span className={styles.typeMetric}>{info.metric}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Durée */}
          <div className={styles.section}>
            <label className={styles.label}>Durée du défi</label>
            <div className={styles.durationGrid}>
              {CHALLENGE_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`${styles.durationBtn} ${duration === d.value ? styles.selected : ''}`}
                  onClick={() => setDuration(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Résumé */}
          <div className={styles.summary}>
            <div className={styles.summaryIcon}>
              {CHALLENGE_TYPES[type]?.icon}
            </div>
            <div className={styles.summaryText}>
              <p>
                <strong>Défi:</strong> Plus de {CHALLENGE_TYPES[type]?.metric} en {duration} jours
              </p>
              <p className={styles.summaryHint}>
                Le gagnant remporte <strong>50 XP</strong> et un badge!
              </p>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loadingSpinner} />
              ) : (
                <>
                  <span>⚔️</span> Envoyer le défi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
