import { memo } from 'react';
import styles from './HIITTimer.module.css';
import useHIITTimer from './useHIITTimer';

function HIITTimer({
  workDuration = 30,
  restDuration = 15,
  rounds = 8,
  onRoundComplete,
  onComplete
}) {
  const {
    isRunning,
    isPaused,
    currentRound,
    totalRounds,
    phase,
    timeLeft,
    start,
    pause,
    resume,
    reset,
    skip,
  } = useHIITTimer({
    workDuration,
    restDuration,
    rounds,
    onRoundComplete,
    onComplete
  });

  const isWork = phase === 'work';
  const displayTime = Math.ceil(timeLeft);
  const totalDuration = isWork ? workDuration : restDuration;
  const progress = (timeLeft / totalDuration) * 100;

  // SVG circle parameters
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.container}>
      {/* Timer Display */}
      <div className={`${styles.timerCard} ${isWork ? styles.isWork : styles.isRest}`}>
        <div className={styles.phaseLabel}>
          {isWork ? '💪 WORK' : '😌 REST'}
        </div>

        <div className={styles.timerCircle}>
          <svg className={styles.progressRing} width="200" height="200">
            <defs>
              <linearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f7b186" />
                <stop offset="100%" stopColor="#ff8c5a" />
              </linearGradient>
              <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b8ddd1" />
                <stop offset="100%" stopColor="#91c7b8" />
              </linearGradient>
            </defs>

            {/* Background circle */}
            <circle
              className={styles.progressRingBg}
              cx="100"
              cy="100"
              r={radius}
              strokeWidth="8"
            />

            {/* Progress circle */}
            <circle
              className={styles.progressRingCircle}
              cx="100"
              cy="100"
              r={radius}
              strokeWidth="8"
              stroke={isWork ? "url(#workGradient)" : "url(#restGradient)"}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          <div className={styles.timeDisplay}>
            <div className={styles.timeValue}>{displayTime}</div>
            <div className={styles.timeUnit}>sec</div>
          </div>
        </div>

        <div className={styles.roundInfo}>
          Round {currentRound} / {totalRounds}
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {!isRunning ? (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnStart}`}
            onClick={start}
          >
            Démarrer
          </button>
        ) : isPaused ? (
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnResume}`}
              onClick={resume}
            >
              Reprendre
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnReset}`}
              onClick={reset}
            >
              Reset
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPause}`}
              onClick={pause}
            >
              Pause
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSkip}`}
              onClick={skip}
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(HIITTimer);
