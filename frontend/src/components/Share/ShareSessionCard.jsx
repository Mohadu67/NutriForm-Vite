import { useRef } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FaDumbbell, FaClock, FaFire, FaCalendar } from 'react-icons/fa';
import styles from './ShareCard.module.css';

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
      if (entry.muscleGroup) {
        muscles.add(entry.muscleGroup);
      }
    });
    return Array.from(muscles);
  };

  return (
    <div ref={cardRef} className={styles.shareCardContainer}>
      <Card className={styles.shareCard}>
        <Card.Body>
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
            <FaCalendar className="me-2" />
            {formatDate(session.endedAt || session.createdAt)}
          </div>

          {/* Main Stats */}
          <Row className={styles.mainStats}>
            <Col xs={4} className="text-center">
              <div className={styles.statIcon}>
                <FaClock size={24} />
              </div>
              <div className={styles.statValue}>{formatDuration(session.durationSec || 0)}</div>
              <div className={styles.statLabel}>Durée</div>
            </Col>
            <Col xs={4} className="text-center">
              <div className={styles.statIcon}>
                <FaFire size={24} />
              </div>
              <div className={styles.statValue}>{session.calories || 0}</div>
              <div className={styles.statLabel}>kcal</div>
            </Col>
            <Col xs={4} className="text-center">
              <div className={styles.statIcon}>
                <FaDumbbell size={24} />
              </div>
              <div className={styles.statValue}>{getExerciseCount()}</div>
              <div className={styles.statLabel}>Exercices</div>
            </Col>
          </Row>

          {/* Additional Stats */}
          <Row className={styles.additionalStats}>
            <Col xs={6} className="text-center">
              <strong>{getTotalSets()}</strong> séries
            </Col>
            <Col xs={6} className="text-center">
              <strong>{getMuscleGroups().length}</strong> groupes musculaires
            </Col>
          </Row>

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
        </Card.Body>
      </Card>
    </div>
  );
};

export default ShareSessionCard;