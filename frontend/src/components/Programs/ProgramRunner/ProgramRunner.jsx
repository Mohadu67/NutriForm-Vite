import { useState, useEffect, useRef } from 'react';
import { formatDuration, getCycleTypeLabel } from '../../../utils/programUtils';
import styles from './ProgramRunner.module.css';
import logger from '../../../shared/utils/logger';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  TimerIcon,
  FlameIcon
} from '../ProgramIcons';

export default function ProgramRunner({ program, onComplete, onCancel, onBackToList, isPremium, saveStatus }) {
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const timerRef = useRef(null);
  const transitionRef = useRef(null);
  const audioRef = useRef(null);

  const cycles = program?.cycles || [];
  const currentCycle = cycles[currentCycleIndex];

  // Compter uniquement les exercices (pas les repos/transitions)
  const exerciseCycles = cycles.filter(c => c.type === 'exercise');
  const exercisesCompleted = cycles
    .slice(0, currentCycleIndex + 1)
    .filter(c => c.type === 'exercise').length;
  const totalExercises = exerciseCycles.length;

  // Calculer la durée du cycle actuel
  const getCycleDuration = (cycle) => {
    if (!cycle) return 0;

    if (cycle.type === 'exercise') {
      return cycle.durationSec || 0;
    } else if (cycle.type === 'rest' || cycle.type === 'transition') {
      return cycle.restSec || 0;
    }

    return 0;
  };

  // Timer unifié - gère initialisation, décompte et transition
  useEffect(() => {
    // Initialiser le timer au changement de cycle
    if (currentCycle) {
      const duration = getCycleDuration(currentCycle);
      setTimeRemaining(duration);
      // Nettoyer toute transition en cours
      if (transitionRef.current) {
        clearTimeout(transitionRef.current);
        transitionRef.current = null;
      }

      // Annoncer le nouveau cycle au screen reader
      const cycleName = currentCycle.type === 'exercise'
        ? currentCycle.exerciseName
        : getCycleTypeLabel(currentCycle.type);
      setAnnouncement(`${getCycleTypeLabel(currentCycle.type)} : ${cycleName}. Durée : ${formatTime(duration)}`);
    }

    // Ne pas démarrer le timer si pausé ou terminé
    if (isPaused || isFinished) {
      return;
    }

    // Timer principal
    const interval = setInterval(() => {
      setTotalElapsedTime((prev) => prev + 1);

      setTimeRemaining((prev) => {
        // Si temps écoulé, déclencher transition après 800ms (une seule fois)
        if (prev <= 1 && !transitionRef.current) {
          transitionRef.current = setTimeout(() => {
            transitionRef.current = null;
            if (currentCycleIndex < cycles.length - 1) {
              setCurrentCycleIndex((prevIndex) => prevIndex + 1);
            } else {
              handleFinish();
            }
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      // Nettoyer transition au démontage
      if (transitionRef.current) {
        clearTimeout(transitionRef.current);
        transitionRef.current = null;
      }
    };
  }, [isPaused, isFinished, currentCycleIndex, cycles.length, currentCycle]);

  // Sons d'alerte
  useEffect(() => {
    if (timeRemaining === 3 && currentCycle?.type === 'rest') {
      playBeep();
    }
  }, [timeRemaining]);

  const playBeep = () => {
    try {
      if (audioRef.current) {
        audioRef.current.play();
      }
    } catch (error) {
      logger.error('Erreur lors de la lecture du son:', error);
    }
  };

  const handleFinish = () => {
    setIsFinished(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const result = {
      programId: program.id,
      programName: program.name,
      programType: program.type,
      cyclesCompleted: cycles.length,
      cyclesTotal: cycles.length,
      durationSec: totalElapsedTime,
      estimatedCalories: program.estimatedCalories || 0,
    };

    onComplete(result);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setShowCancelModal(false);
    onCancel();
  };

  const handleCancelCancel = () => {
    setShowCancelModal(false);
  };

  const progress = ((currentCycleIndex + 1) / cycles.length) * 100;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCycleColor = (type) => {
    switch (type) {
      case 'exercise':
        return styles.exerciseColor;
      case 'rest':
        return styles.restColor;
      case 'transition':
        return styles.transitionColor;
      default:
        return '';
    }
  };

  if (isFinished) {
    return (
      <div className={styles.finished}>
        <div className={styles.finishedIcon}>
          <CheckCircleIcon size={64} />
        </div>
        <h2 className={styles.finishedTitle}>Programme terminé !</h2>
        <p className={styles.finishedText}>
          Bravo, vous avez complété le programme "{program.name}"
        </p>

        <div className={styles.finishedStats}>
          <div className={styles.finishedStat}>
            <div className={styles.statIcon}>
              <TimerIcon size={24} />
            </div>
            <span className={styles.statLabel}>Durée totale</span>
            <span className={styles.statValue}>{formatTime(totalElapsedTime)}</span>
          </div>
          <div className={styles.finishedStat}>
            <div className={styles.statIcon}>
              <FlameIcon size={24} />
            </div>
            <span className={styles.statLabel}>Calories estimées</span>
            <span className={styles.statValue}>{program.estimatedCalories} kcal</span>
          </div>
        </div>

        {/* Statut de sauvegarde */}
        {saveStatus === 'saving' && (
          <div className={styles.saveStatus}>
            <div className={styles.spinner}></div>
            <p>Sauvegarde en cours...</p>
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className={styles.saveStatusSuccess}>
            ✅ Session sauvegardée avec succès !
          </div>
        )}
        {saveStatus === 'saved_locally' && (
          <div className={styles.saveStatusWarning}>
            ⚠️ Session sauvegardée localement. Sera synchronisée à la prochaine connexion.
          </div>
        )}
        {saveStatus === 'error' && (
          <div className={styles.saveStatusError}>
            ❌ Erreur lors de la sauvegarde. Vérifiez votre connexion.
          </div>
        )}
        {saveStatus === 'not_saved' && !isPremium && (
          <div className={styles.premiumCta}>
            <p>
              <strong>Devenez Premium</strong> pour sauvegarder votre progression et
              suivre vos statistiques dans le dashboard !
            </p>
          </div>
        )}

        {/* Bouton retour */}
        <button onClick={onBackToList} className={styles.backButton}>
          Retour aux programmes
        </button>
      </div>
    );
  }

  return (
    <div className={styles.runner}>

      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Progression : ${Math.round(progress)}%`}
      >
        <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
      </div>

      <div className={styles.header}>
        <h2 className={styles.programName}>{program.name}</h2>
        {currentCycle?.type === 'exercise' ? (
          <p className={styles.cycleCounter}>
            Exercice {exercisesCompleted} / {totalExercises}
          </p>
        ) : (
          <p className={styles.cycleCounter}>
            {getCycleTypeLabel(currentCycle?.type)}
          </p>
        )}
      </div>

      <div className={`${styles.currentCycle} ${getCycleColor(currentCycle?.type)}`}>
        <div className={styles.cycleType}>{getCycleTypeLabel(currentCycle?.type)}</div>

        {currentCycle?.image && currentCycle?.type === 'exercise' && (
          <div className={styles.cycleImageContainer}>
            <img
              src={currentCycle.image}
              alt={`Démonstration de l'exercice : ${currentCycle?.exerciseName || getCycleTypeLabel(currentCycle?.type)}`}
              className={styles.cycleImage}
              loading="lazy"
            />
          </div>
        )}

        <h3 className={styles.cycleName}>
          {currentCycle?.type === 'exercise'
            ? currentCycle.exerciseName
            : currentCycle?.notes || getCycleTypeLabel(currentCycle?.type)}
        </h3>

        {currentCycle?.intensity && (
          <div className={styles.intensity}>
            Intensité : {currentCycle.intensity}/10
          </div>
        )}
      </div>

      <div className={styles.timerContainer}>
        <div
          className={`${styles.timer} ${timeRemaining <= 3 ? styles.timerWarning : ''}`}
          role="timer"
          aria-live="off"
          aria-label={`${isPaused ? 'Pause - ' : ''}${formatTime(timeRemaining)} restant`}
        >
          {formatTime(timeRemaining)}
        </div>
        <div className={styles.timerLabel}>
          {isPaused ? 'En pause' : 'Temps restant'}
        </div>
      </div>

      {/* Annonce accessible seulement lors des transitions de cycle */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      <div className={styles.controls} role="group" aria-label="Contrôles du programme">
        <button
          onClick={handleCancelClick}
          className={styles.cancelButton}
          aria-label="Arrêter le programme d'entraînement"
        >
          <StopIcon size={20} />
          <span>Arrêter</span>
        </button>
        <button
          onClick={handlePauseResume}
          className={styles.pauseButton}
          aria-label={isPaused ? 'Reprendre le programme' : 'Mettre en pause'}
        >
          {isPaused ? (
            <>
              <PlayIcon size={20} />
              <span>Reprendre</span>
            </>
          ) : (
            <>
              <PauseIcon size={20} />
              <span>Pause</span>
            </>
          )}
        </button>
      </div>

      {currentCycleIndex < cycles.length - 1 && (
        <div className={styles.nextCycle}>
          <ArrowRightIcon size={20} />
          <div className={styles.nextContent}>
            <span className={styles.nextLabel}>Prochain</span>
            <span className={styles.nextName}>
              {cycles[currentCycleIndex + 1].exerciseName ||
                getCycleTypeLabel(cycles[currentCycleIndex + 1].type)}
            </span>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWS46NqgNgoPUKLh7K1gHQo4jdf0y3ksAyB5xfDfkEAKE1612u+nVRQKRJze8r5tIQUsg87y2Yk2CBhku+jamDcJD1Ci4e2rXx0KOIXX8st5KwQfecTw35BACRNVs9vxqFUUCkSb3vK+bSEFLYLP8tmJNwgYZLzn2p04CQ9Qo+LtqlkUD1S98r5uIQUrj87y2Yk3CBhluujanDYHD1Gi4e2rXx0JOI/Y88x6KwQgecTw35FCChRWtNvxp1USCkOb3fK+bCIFK47P8diJNggZZLzn2p05CRBQo+LtqFMVE1W98r1rIAUsjc/y2Io3CBhluujanDYHEFGi4e2rXhwJN4/Y88x6KwMgeMPv3pBDChRWtN3yp1UUC0Kb3fO+ayEGLI3P8diINgcZZbrn2p05CQ9Po+LtqFMVE1S98r1rIAQrjs/y2Io3CBlmuujanDQKE1Ci4e2rXhsJN47Y88x5KwQfeMPv35BDChNVtN3yp1YVCkOb3fO+aiEGK4zP8dmJNggZZbzn2p05CQ9Po+PtqFIUE1S98r1qIAQrjs/y2Io3CBlmuujanDQKE1Ci4e2rXhsJN47Y88x5KwQfeMPv35BDChNVtN3yp1YVCkOb3fO+aiEGK4zP8dmJNggZZbzn2p05CQ9Po+PtqFIUE1S98r1qIAQrjc/y2Io3CBlmuujanDQKE1Ci4e2rXhsJN47Y88x5KwQfeMPv35BDChNVtN3yp1YVCkOb3fO+aiEGK4zP8dmJNggZZbzn2p05CQ9Po+PtqFIUE1S98r1qIAQrjc/y2Io3CBlmuujanDQKE1Ci4e2rXhsJN47Y88x5KwQfeMPv35BDChNVtN3yp1YVCkOb3fO+aiEGK4zP8dmJNggZZbzn2p05CQ9Po+PtqFIUE1S98r1qIAQrjc/y2Io3CBlmuujanDQKE1Ci4e2rXhsJN47Y88x5KwQfeMPv35BDChNVtN3yp1YVCkOb3fO+aiEGK4zP8dmJNggZZbzn2p05CQ9Po+PtqFIUE1S98r1qIAQrjc/y2Io3CBlmuujanDQKE1Ci4e2rXhsJN47Y88x5KwQfeMPv35BDChNVtN3yp1YVCkOb3fO+aiEGK4zP8dmJNggZZbzn2p05"
      />

      <ConfirmModal
        isOpen={showCancelModal}
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelCancel}
        title="Arrêter le programme ?"
        message="Êtes-vous sûr de vouloir arrêter le programme ? Votre progression ne sera pas sauvegardée."
      />
    </div>
  );
}
