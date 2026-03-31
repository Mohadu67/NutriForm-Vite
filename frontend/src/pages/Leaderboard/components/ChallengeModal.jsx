import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CHALLENGE_TYPES, CHALLENGE_DURATIONS } from '../hooks/useChallenges';
import styles from './ChallengeModal.module.css';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CATEGORIES = [
  { key: 'ongoing', label: 'En durée', desc: 'Compétition sur plusieurs jours' },
  { key: 'max', label: 'Record max', desc: 'Qui fait le meilleur score' },
];

export default function ChallengeModal({
  isOpen,
  onClose,
  onSubmit,
  opponent,
  loading = false
}) {
  const [category, setCategory] = useState('ongoing');
  const [type, setType] = useState('sessions');
  const [duration, setDuration] = useState(7);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const isMax = category === 'max';

  const filteredTypes = Object.entries(CHALLENGE_TYPES).filter(
    ([, info]) => info.category === category
  );

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    // Auto-select first type of new category
    const firstType = Object.entries(CHALLENGE_TYPES).find(([, info]) => info.category === cat);
    if (firstType) setType(firstType[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const result = await onSubmit(opponent.userId, type, isMax ? 0 : duration);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Erreur lors de la création du défi');
    }
  };

  const opponentName = opponent?.displayName || opponent?.pseudo || 'Adversaire';
  const selectedType = CHALLENGE_TYPES[type];

  const getSummaryText = () => {
    if (isMax) {
      return `Record de ${selectedType?.label?.toLowerCase()} — qui fait le meilleur score`;
    }
    return `Le plus de ${selectedType?.metric} en ${duration} jours`;
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.titleIcon}>⚔️</div>
            <div>
              <h2 className={styles.title}>Lancer un défi</h2>
              <p className={styles.subtitle}>vs @{opponentName}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Category Tabs */}
          <div className={styles.section}>
            <label className={styles.label}>Catégorie</label>
            <div className={styles.categoryTabs}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`${styles.categoryTab} ${category === cat.key ? styles.activeTab : ''}`}
                  onClick={() => handleCategoryChange(cat.key)}
                >
                  <span className={styles.categoryLabel}>{cat.label}</span>
                  <span className={styles.categoryDesc}>{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type de défi */}
          <div className={styles.section}>
            <label className={styles.label}>Type de défi</label>
            <div className={styles.typeGrid}>
              {filteredTypes.map(([key, info]) => (
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

          {/* Durée — only for ongoing challenges */}
          {!isMax && (
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
          )}

          {/* Résumé */}
          <div className={styles.summary}>
            <div className={styles.summaryIcon}>
              {selectedType?.icon}
            </div>
            <div className={styles.summaryText}>
              <p className={styles.summaryTitle}>{getSummaryText()}</p>
              <p className={styles.summaryHint}>
                Le gagnant remporte <strong>50 XP</strong> et un badge
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
                <>Envoyer le défi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
