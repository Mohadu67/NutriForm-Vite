import { useRef } from 'react';
import { FaDumbbell, FaClock, FaFire, FaCalendar, FaTrophy } from 'react-icons/fa';
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
      year: 'numeric',
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
        {/* Background decoratif */}
        <div className={styles.backgroundPattern}></div>

        <div className={styles.cardContent}>
          {/* Header compact */}
          <div className={styles.header}>
            <div className={styles.brandLogo}>
              <div className={styles.logoCircle}>
                <FaDumbbell />
              </div>
              <span className={styles.brandName}>NutriForm</span>
            </div>
            <div className={styles.userBadge}>
              <div className={styles.userAvatar}>
                {(user?.displayName || user?.pseudo || 'A')[0].toUpperCase()}
              </div>
              <span className={styles.userName}>{user?.displayName || user?.pseudo || 'Athlète'}</span>
            </div>
          </div>

          {/* Session Title avec trophy */}
          <div className={styles.titleSection}>
            <div className={styles.trophyIcon}>
              <FaTrophy />
            </div>
            <h2 className={styles.sessionTitle}>{session.name || 'Séance de sport'}</h2>
            <div className={styles.dateInfo}>
              <FaCalendar />
              <span>{formatDate(session.endedAt || session.createdAt)}</span>
            </div>
          </div>

          {/* Stats principales avec cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper} data-color="purple">
                <FaClock />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{formatDuration(session.durationSec || 0)}</div>
                <div className={styles.statLabel}>Durée</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrapper} data-color="orange">
                <FaFire />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{session.calories || 0}</div>
                <div className={styles.statLabel}>kcal</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconWrapper} data-color="blue">
                <FaDumbbell />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{getExerciseCount()}</div>
                <div className={styles.statLabel}>Exercices</div>
              </div>
            </div>
          </div>

          {/* Séries et groupes musculaires */}
          <div className={styles.secondaryStats}>
            <div className={styles.secondaryStat}>
              <div className={styles.secondaryValue}>{getTotalSets()}</div>
              <div className={styles.secondaryLabel}>Séries</div>
            </div>
            <div className={styles.dividerDot}></div>
            <div className={styles.secondaryStat}>
              <div className={styles.secondaryValue}>{getMuscleGroups().length}</div>
              <div className={styles.secondaryLabel}>Groupes</div>
            </div>
          </div>

          {/* Muscle Groups pills */}
          {getMuscleGroups().length > 0 && (
            <div className={styles.muscleGroups}>
              {getMuscleGroups().slice(0, 4).map((muscle, index) => (
                <span key={index} className={styles.musclePill}>
                  {muscle}
                </span>
              ))}
              {getMuscleGroups().length > 4 && (
                <span className={styles.musclePill} data-more>
                  +{getMuscleGroups().length - 4}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.achievement}>
              <span className={styles.checkmark}>✓</span>
              <span>Entraînement complété</span>
            </div>
            <div className={styles.branding}>nutriform.fr</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareSessionCard;
