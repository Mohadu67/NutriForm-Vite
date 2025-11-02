import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/authService';
import TopBar from '../../components/TopBar/TopBar';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './HIITProgramList.module.css';

const HIITProgramList = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall('/api/hiit/programs', { method: 'GET' });
      const data = await response.json();

      if (data.success) {
        setPrograms(data.data);
      } else {
        setError('Impossible de charger les programmes HIIT');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des programmes HIIT:', err);
      setError('Erreur lors du chargement des programmes');
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

  const handleProgramClick = (programId) => {
    navigate(`/hiit/program/${programId}`);
  };

  return (
    <>
      <TopBar />
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>⚡ Programmes HIIT</h1>
          <p className={styles.subtitle}>
            Entraînements haute intensité pour brûler un maximum de calories
          </p>
        </div>

        {loading ? (
          <div className={styles.loading}>Chargement des programmes...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : programs.length === 0 ? (
          <div className={styles.empty}>Aucun programme disponible pour le moment.</div>
        ) : (
          <div className={styles.programsGrid}>
            {programs.map((program) => (
              <div
                key={program._id}
                className={styles.programCard}
                onClick={() => handleProgramClick(program._id)}
              >
                {program.imageUrl && (
                  <div className={styles.programImage}>
                    <img src={program.imageUrl} alt={program.title} />
                  </div>
                )}
                <div className={styles.programContent}>
                  <div className={styles.programHeader}>
                    <h3 className={styles.programTitle}>{program.title}</h3>
                    <span
                      className={styles.programLevel}
                      style={{ backgroundColor: getDifficultyColor(program.level) }}
                    >
                      {getDifficultyLabel(program.level)}
                    </span>
                  </div>
                  <p className={styles.programDescription}>{program.description}</p>
                  <div className={styles.programMeta}>
                    <span className={styles.programDuration}>
                      ⏱️ {program.totalDuration} min
                    </span>
                    <span className={styles.programExercises}>
                      🏋️ {program.exercises?.length || 0} exercices
                    </span>
                  </div>
                  {program.trainer && (
                    <div className={styles.programTrainer}>
                      👤 Coach: {program.trainer}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default HIITProgramList;
