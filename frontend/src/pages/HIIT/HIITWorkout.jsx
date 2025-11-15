import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/authService';
import TopBar from '../../components/TopBar/TopBar';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './HIITWorkout.module.css';

const HIITWorkout = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Workout state
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchProgram();
    // Create audio for beep sound
    audioRef.current = new Audio('/beep.mp3'); // You'll need to add this sound file
  }, [programId]);

  useEffect(() => {
    if (isStarted && !isPaused && program) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Move to next exercise
            const nextIndex = currentExerciseIndex + 1;
            if (nextIndex < program.exercises.length) {
              playBeep();
              setCurrentExerciseIndex(nextIndex);
              return program.exercises[nextIndex].durationSec;
            } else {
              // Workout complete
              handleWorkoutComplete();
              return 0;
            }
          }
          return prev - 1;
        });
        setTotalElapsed((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [isStarted, isPaused, currentExerciseIndex, program]);

  const fetchProgram = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(`/api/hiit/programs/${programId}`, { method: 'GET' });
      const data = await response.json();

      if (data.success) {
        setProgram(data.data);
        if (data.data.exercises && data.data.exercises.length > 0) {
          setTimeRemaining(data.data.exercises[0].durationSec);
        }
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

  const playBeep = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const handleStart = () => {
    setIsStarted(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleSkip = () => {
    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex < program.exercises.length) {
      setCurrentExerciseIndex(nextIndex);
      setTimeRemaining(program.exercises[nextIndex].durationSec);
    } else {
      handleWorkoutComplete();
    }
  };

  const handleQuit = () => {
    if (window.confirm('Êtes-vous sûr de vouloir quitter cet entraînement ?')) {
      navigate('/hiit');
    }
  };

  const handleWorkoutComplete = () => {
    setIsStarted(false);
    clearInterval(timerRef.current);
    // Navigate to completion screen or show modal
    alert('Félicitations ! Entraînement terminé ! 🎉');
    navigate('/hiit');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!program || !program.exercises || !program.exercises[currentExerciseIndex]) return 0;
    const currentDuration = program.exercises[currentExerciseIndex].durationSec;
    return ((currentDuration - timeRemaining) / currentDuration) * 100;
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
        </div>
        <Footer />
      </>
    );
  }

  const currentExercise = program.exercises[currentExerciseIndex];
  const totalExercises = program.exercises.length;

  return (
    <>
      <TopBar />
      <Header />
      <div className={styles.container}>
        <div className={styles.workoutCard}>
          {/* Header */}
          <div className={styles.workoutHeader}>
            <div className={styles.programInfo}>
              <h2 className={styles.programTitle}>{program.title}</h2>
              <div className={styles.progressText}>
                Exercice {currentExerciseIndex + 1} / {totalExercises}
              </div>
            </div>
            <button className={styles.quitButton} onClick={handleQuit}>
              ✕
            </button>
          </div>

          {/* Current Exercise Display */}
          <div className={styles.exerciseDisplay}>
            <div className={styles.exerciseName}>
              {currentExercise?.name || 'Chargement...'}
            </div>
            {currentExercise?.isRest && (
              <div className={styles.restBadge}>REPOS</div>
            )}
          </div>

          {/* Timer */}
          <div className={styles.timerSection}>
            <div className={styles.timerCircle}>
              <svg className={styles.progressRing} width="250" height="250">
                <circle
                  className={styles.progressRingBackground}
                  cx="125"
                  cy="125"
                  r="110"
                />
                <circle
                  className={styles.progressRingProgress}
                  cx="125"
                  cy="125"
                  r="110"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 110}`,
                    strokeDashoffset: `${2 * Math.PI * 110 * (1 - getProgressPercentage() / 100)}`
                  }}
                />
              </svg>
              <div className={styles.timerText}>
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            {!isStarted ? (
              <button className={styles.startButton} onClick={handleStart}>
                ▶️ Commencer
              </button>
            ) : isPaused ? (
              <button className={styles.resumeButton} onClick={handleResume}>
                ▶️ Reprendre
              </button>
            ) : (
              <button className={styles.pauseButton} onClick={handlePause}>
                ⏸️ Pause
              </button>
            )}

            {isStarted && (
              <button className={styles.skipButton} onClick={handleSkip}>
                ⏭️ Suivant
              </button>
            )}
          </div>

          {/* Next Exercise Preview */}
          {currentExerciseIndex < totalExercises - 1 && (
            <div className={styles.nextExercise}>
              <div className={styles.nextLabel}>Prochain exercice:</div>
              <div className={styles.nextName}>
                {program.exercises[currentExerciseIndex + 1]?.name}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Temps écoulé</div>
              <div className={styles.statValue}>{formatTime(totalElapsed)}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Temps restant</div>
              <div className={styles.statValue}>
                {formatTime((program.totalDuration * 60) - totalElapsed)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HIITWorkout;
