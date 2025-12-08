import {
  getDifficultyClass,
  getCycleTypeLabel,
  getCycleBadgeClass,
  formatCycleDuration
} from '../../../utils/programUtils';
import styles from './ProgramPreview.module.css';
import {
  TimerIcon,
  FlameIcon,
  TrendingUpIcon,
  PlayIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  InfoIcon
} from '../ProgramIcons';

export default function ProgramPreview({ program, onStart, onBack }) {
  const totalCycles = program.cycles?.length || 0;
  const totalExercises = program.cycles?.filter(c => c.type === 'exercise').length || 0;

  return (
    <div className={styles.preview}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeftIcon size={20} />
          <span>Retour</span>
        </button>
      </div>

      {/* Program Info */}
      <div className={styles.programInfo}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{program.name}</h1>
          <span className={`${styles.difficulty} ${styles[getDifficultyClass(program.difficulty)]}`}>
            {program.difficulty}
          </span>
        </div>

        <p className={styles.description}>{program.description}</p>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statIcon}>
              <TimerIcon size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{program.estimatedDuration}</span>
              <span className={styles.statLabel}>minutes</span>
            </div>
          </div>

          <div className={styles.stat}>
            <div className={styles.statIcon}>
              <FlameIcon size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{program.estimatedCalories}</span>
              <span className={styles.statLabel}>kcal</span>
            </div>
          </div>

          <div className={styles.stat}>
            <div className={styles.statIcon}>
              <CheckCircleIcon size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{totalExercises}</span>
              <span className={styles.statLabel}>exercices</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {program.instructions && (
          <div className={styles.infoBox}>
            <div className={styles.infoHeader}>
              <InfoIcon size={20} />
              <h3>Instructions</h3>
            </div>
            <p>{program.instructions}</p>
          </div>
        )}

        {/* Tips */}
        {program.tips && (
          <div className={styles.tipsBox}>
            <div className={styles.infoHeader}>
              <span>💡</span>
              <h3>Conseils</h3>
            </div>
            <p>{program.tips}</p>
          </div>
        )}
      </div>

      {/* Cycles List */}
      <div className={styles.cyclesSection}>
        <h2 className={styles.sectionTitle}>
          Programme ({totalCycles} étapes)
        </h2>

        <div className={styles.cyclesList}>
          {program.cycles?.map((cycle, index) => (
            <div key={index} className={styles.cycleItem}>
              <div className={styles.cycleNumber}>{index + 1}</div>
              <div className={styles.cycleContent}>
                <div className={styles.cycleHeader}>
                  <span className={`${styles.cycleBadge} ${styles[getCycleBadgeClass(cycle.type)]}`}>
                    {getCycleTypeLabel(cycle.type)}
                  </span>
                  <span className={styles.cycleDuration}>{formatCycleDuration(cycle)}</span>
                </div>
                <div className={styles.cycleName}>
                  {cycle.type === 'exercise'
                    ? cycle.exerciseName
                    : (cycle.notes || getCycleTypeLabel(cycle.type))}
                </div>
                {cycle.intensity && (
                  <div className={styles.cycleIntensity}>
                    Intensité: {cycle.intensity}/10
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button onClick={onStart} className={styles.startButton}>
          <PlayIcon size={20} />
          <span>Démarrer le programme</span>
        </button>
      </div>
    </div>
  );
}
