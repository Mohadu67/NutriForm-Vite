import { useRef } from 'react';
import { FaDumbbell, FaClock, FaFire } from 'react-icons/fa';
import styles from './ShareCard.module.css';

const ShareSessionCard = ({ session, user }) => {
  const cardRef = useRef(null);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h${minutes}`;
    }
    return `${minutes}min`;
  };

  const getExerciseCount = () => {
    return session.entries?.length || 0;
  };

  return (
    <div ref={cardRef} className={styles.shareCardContainer}>
      <div className={styles.shareCard}>
        <div className={styles.cardContent}>
          {/* Header simple */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <FaDumbbell className={styles.logoIcon} />
              <span className={styles.brandName}>Harmonith</span>
            </div>
            <div className={styles.userInfo}>
              {user?.displayName || user?.pseudo || 'Athlète'}
            </div>
          </div>

          {/* Titre de la séance */}
          <div className={styles.titleSection}>
            <h2 className={styles.sessionTitle}>{session.name || 'Séance de sport'}</h2>
            <p className={styles.subtitle}>Entraînement complété ! 🎉</p>
          </div>

          {/* Stats simples */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <FaClock className={styles.statIcon} />
              <div className={styles.statContent}>
                <div className={styles.statValue}>{formatDuration(session.durationSec || 0)}</div>
                <div className={styles.statLabel}>Durée</div>
              </div>
            </div>

            <div className={styles.stat}>
              <FaFire className={styles.statIcon} />
              <div className={styles.statContent}>
                <div className={styles.statValue}>{session.calories || 0}</div>
                <div className={styles.statLabel}>kcal</div>
              </div>
            </div>

            <div className={styles.stat}>
              <FaDumbbell className={styles.statIcon} />
              <div className={styles.statContent}>
                <div className={styles.statValue}>{getExerciseCount()}</div>
                <div className={styles.statLabel}>Exercices</div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className={styles.cta}>
            <p className={styles.ctaText}>Rejoins-moi sur Harmonith !</p>
            <div className={styles.ctaLink}>harmonith.fr</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareSessionCard;
