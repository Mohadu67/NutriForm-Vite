import { useEffect, useState } from 'react';
import { SwordsIcon, DumbbellIcon, FlameIcon, TimerIcon } from '../../../components/Icons/GlobalIcons';
import styles from './ChallengeSentCard.module.css';

export default function ChallengeSentCard({ isOpen, onClose, opponentName, challengeType }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto-close après 4 secondes
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Attendre la fin de l'animation
  };

  if (!isOpen && !isVisible) return null;

  const TYPE_ICONS = {
    sessions: DumbbellIcon,
    calories: FlameIcon,
    duration: TimerIcon
  };

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.visible : ''}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.card} ${isVisible ? styles.cardVisible : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti animation */}
        <div className={styles.confetti}>
          {[...Array(12)].map((_, i) => (
            <span key={i} className={styles.confettiPiece} style={{ '--i': i }} />
          ))}
        </div>

        {/* Swords crossed icon */}
        <div className={styles.iconContainer}>
          <SwordsIcon size={40} />
        </div>

        {/* Message */}
        <h2 className={styles.title}>Défi lancé !</h2>

        <p className={styles.message}>
          Tu as défié <strong>@{opponentName}</strong>
        </p>

        <div className={styles.challengeInfo}>
          <span className={styles.typeIcon}>
            {(() => {
              const IconComponent = TYPE_ICONS[challengeType] || DumbbellIcon;
              return <IconComponent size={20} />;
            })()}
          </span>
          <span className={styles.typeText}>
            {challengeType === 'sessions' && 'Plus de séances'}
            {challengeType === 'calories' && 'Plus de calories'}
            {challengeType === 'duration' && 'Plus de minutes'}
          </span>
        </div>

        <p className={styles.hint}>
          En attente de sa réponse...
        </p>

        {/* Close button */}
        <button className={styles.closeBtn} onClick={handleClose}>
          C'est parti !
        </button>
      </div>
    </div>
  );
}
