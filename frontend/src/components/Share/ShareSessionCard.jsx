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
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
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
      // Utiliser muscleGroup existant ou le deviner
      const muscleGroup = entry.muscleGroup || guessMuscleGroup(entry.exerciseName || entry.name || '');
      if (muscleGroup) {
        muscles.add(muscleGroup);
      }
    });
    return Array.from(muscles);
  };

  // Composant Grid pour remplacer Bootstrap Row/Col
  const StatsGrid = ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {children}
    </div>
  );

  const StatColumn = ({ children }) => (
    <div style={{ textAlign: 'center' }}>
      {children}
    </div>
  );

  return (
    <div ref={cardRef} className={styles.shareCardContainer}>
      <div className={styles.shareCard}>
        <div style={{ padding: '1.5rem' }}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <FaDumbbell size={30} />
              <span className={styles.appName}>NutriForm</span>
            </div>
            <div className={styles.userName}>{user?.displayName || user?.pseudo || 'Athlète'}</div>
          </div>

          {/* Session Title */}
          <div className={styles.sessionTitle}>
            {session.name || 'Séance de sport'}
          </div>

          {/* Date */}
          <div className={styles.date}>
            <FaCalendar style={{ marginRight: '0.5rem' }} />
            {formatDate(session.endedAt || session.createdAt)}
          </div>

          {/* Main Stats */}
          <div className={styles.mainStats}>
            <StatsGrid>
              <StatColumn>
                <div className={styles.statIcon}>
                  <FaClock size={24} />
                </div>
                <div className={styles.statValue}>{formatDuration(session.durationSec || 0)}</div>
                <div className={styles.statLabel}>Durée</div>
              </StatColumn>
              <StatColumn>
                <div className={styles.statIcon}>
                  <FaFire size={24} />
                </div>
                <div className={styles.statValue}>{session.calories || 0}</div>
                <div className={styles.statLabel}>kcal</div>
              </StatColumn>
              <StatColumn>
                <div className={styles.statIcon}>
                  <FaDumbbell size={24} />
                </div>
                <div className={styles.statValue}>{getExerciseCount()}</div>
                <div className={styles.statLabel}>Exercices</div>
              </StatColumn>
            </StatsGrid>
          </div>

          {/* Additional Stats */}
          <div className={styles.additionalStats}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <strong>{getTotalSets()}</strong> séries
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong>{getMuscleGroups().length}</strong> groupes musculaires
              </div>
            </div>
          </div>

          {/* Muscle Groups */}
          {getMuscleGroups().length > 0 && (
            <div className={styles.muscleGroups}>
              {getMuscleGroups().map((muscle, index) => (
                <span key={index} className={styles.muscleTag}>
                  {muscle}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.footerText}>Entraînement complété avec succès</div>
            <div className={styles.branding}>nutriform.fr</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareSessionCard;
