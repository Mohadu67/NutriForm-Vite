import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/authService';
import TopBar from '../../components/TopBar/TopBar';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './HIITProgramPreview.module.css';

const HIITProgramPreview = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgram();
  }, [programId]);

  const fetchProgram = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(`/api/hiit/programs/${programId}`, { method: 'GET' });
      const data = await response.json();

      if (data.success) {
        setProgram(data.data);
      } else {
        setError('Programme introuvable');
      }
    } catch (err) {
      console.error('Erreur lors du chargement du programme:', err);
      setError('Erreur lors du chargement du programme');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level) => {
    if (level === 'debutant') return '#4CAF50';
    if (level === 'intermediaire') return '#FF9800';
    if (level === 'avance') return '#F44336';
    return '#757575';
  };

  const getDifficultyLabel = (level) => {
    if (level === 'debutant') return 'Débutant';
    if (level === 'intermediaire') return 'Intermédiaire';
    if (level === 'avance') return 'Avancé';
    return level;
  };

  const handleStart = () => {
    navigate(`/hiit/workout/${programId}`);
  };

  if (loading) {
    return (
      <>
        <TopBar />
        <Header />
        <div className={styles.container}>
          <div className={styles.loading}>Chargement...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !program) {
    return (
      <>
        <TopBar />
        <Header />
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Programme introuvable'}</div>
          <button className={styles.backButton} onClick={() => navigate('/hiit')}>
            ← Retour
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const totalWorkTime = program.exercises?.filter(e => !e.isRest).reduce((sum, e) => sum + e.durationSec, 0) || 0;
  const totalRestTime = program.exercises?.filter(e => e.isRest).reduce((sum, e) => sum + e.durationSec, 0) || 0;

  return (
    <>
      <TopBar />
      <Header />
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => navigate('/hiit')}>
          ← Programmes
        </button>

        <div className={styles.previewCard}>
          {/* En-tête avec niveau */}
          <div className={styles.headerSection}>
            <h1 className={styles.title}>{program.title}</h1>
            <span
              className={styles.levelBadge}
              style={{ backgroundColor: getDifficultyColor(program.level) }}
            >
              {getDifficultyLabel(program.level)}
            </span>
          </div>

          {/* Stats principales */}
          <div className={styles.mainStats}>
            <div className={styles.stat}>
              <div className={styles.statIcon}>⏱️</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{program.totalDuration}</div>
                <div className={styles.statLabel}>minutes</div>
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statIcon}>🏋️</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{program.exercises?.length || 0}</div>
                <div className={styles.statLabel}>exercices</div>
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statIcon}>🔥</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>~{Math.round(program.totalDuration * 10)}</div>
                <div className={styles.statLabel}>calories</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {program.description && (
            <p className={styles.description}>{program.description}</p>
          )}

          {/* Coach */}
          {program.trainer && (
            <div className={styles.trainer}>
              <span className={styles.trainerIcon}>👤</span>
              <span>Avec <strong>{program.trainer}</strong></span>
            </div>
          )}

          {/* Détails supplémentaires */}
          <div className={styles.additionalStats}>
            <div className={styles.miniStat}>
              <span className={styles.miniStatLabel}>Travail:</span>
              <span className={styles.miniStatValue}>{Math.floor(totalWorkTime / 60)}min {totalWorkTime % 60}s</span>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.miniStatLabel}>Repos:</span>
              <span className={styles.miniStatValue}>{Math.floor(totalRestTime / 60)}min {totalRestTime % 60}s</span>
            </div>
          </div>

          {/* Liste simplifiée des exercices */}
          <div className={styles.exercisesSection}>
            <h3 className={styles.sectionTitle}>Au programme</h3>
            <div className={styles.exercisesList}>
              {program.exercises && program.exercises.map((exercise, index) => (
                !exercise.isRest && (
                  <div key={index} className={styles.exerciseItem}>
                    {exercise.imageUrl && (
                      <div className={styles.exerciseImage}>
                        <img src={exercise.imageUrl} alt={exercise.name} />
                      </div>
                    )}
                    <div className={styles.exerciseInfo}>
                      <div className={styles.exerciseName}>{exercise.name}</div>
                      <div className={styles.exerciseDuration}>{exercise.durationSec}s</div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Bouton démarrer */}
          <button className={styles.startButton} onClick={handleStart}>
            ⚡ C'est parti !
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HIITProgramPreview;
