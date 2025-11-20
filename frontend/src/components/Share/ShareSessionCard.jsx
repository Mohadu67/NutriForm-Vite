import { useRef } from 'react';
import { FaDumbbell, FaClock, FaFire, FaCalendar } from 'react-icons/fa';
import styles from './ShareCard.module.css';

// Fonction helper pour deviner le groupe musculaire
function guessMuscleGroup(name = "") {
  const n = String(name).toLowerCase();
  if (/mollet|calf/.test(n)) return "Mollets";
  if (/pompe|push|bench|développé|developpe|pec/.test(n)) return "Pectoraux";
  if (/traction|pull|row|tirage|dos/.test(n)) return "Dos";
  if (/squat|presse|leg|fente|deadlift|soulevé|souleve|jambe/.test(n)) return "Jambes";
  if (/curl|biceps/.test(n)) return "Biceps";
  if (/triceps|dip/.test(n)) return "Triceps";
  if (/épaule|epaule|shoulder|overhead|militaire|lateral/.test(n)) return "Épaules";
  if (/abdo|crunch|gainage|core|planche/.test(n)) return "Abdos";
  return null;
}

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getExerciseCount = () => {
    return session.entries?.length || 0;
  };

  const getTotalSets = () => {
    return session.entries?.reduce((total, entry) => {
      return total + (entry.sets?.length || 0);
    }, 0) || 0;
  };

  const getMuscleGroups = () => {
    const muscles = new Set();
    session.entries?.forEach((entry) => {
      const muscleGroup = entry.muscleGroup || guessMuscleGroup(entry.exerciseName || entry.name || '');
      if (muscleGroup) {
        muscles.add(muscleGroup);
      }
    });
    return Array.from(muscles);
  };

  return (
    <div ref={cardRef} className={styles.shareCardContainer}>
      <div className={styles.shareCard}>
        <div className={styles.cardContent}>
          {/* Header avec avatar */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <FaDumbbell className={styles.logoIcon} />
              <span className={styles.brandName}>Harmonith</span>
            </div>
            <div className={styles.userBadge}>
              <div className={styles.userAvatar}>
                {(user?.displayName || user?.pseudo || 'A')[0].toUpperCase()}
              </div>
              <span className={styles.userName}>
                {user?.displayName || user?.pseudo || 'Athlète'}
              </span>
            </div>
          </div>

          {/* Titre de la séance */}
          <div className={styles.titleSection}>
            <h2 className={styles.sessionTitle}>{session.name || 'Séance de sport'}</h2>
            <p className={styles.subtitle}>Entraînement complété ! 🎉</p>
            <div className={styles.dateInfo}>
              <FaCalendar />
              <span>{formatDate(session.endedAt || session.createdAt)}</span>
            </div>
          </div>

          {/* Stats principales */}
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

          {/* Infos secondaires */}
          <div className={styles.secondaryInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoValue}>{getTotalSets()}</span>
              <span className={styles.infoLabel}>Séries</span>
            </div>
            {getMuscleGroups().length > 0 && (
              <>
                <span className={styles.infoDivider}>•</span>
                <div className={styles.infoItem}>
                  <span className={styles.infoValue}>{getMuscleGroups().slice(0, 3).join(', ')}</span>
                </div>
              </>
            )}
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
