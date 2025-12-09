import styles from './ProgramCard.module.css';
import { TimerIcon, FlameIcon, TrendingUpIcon } from '../ProgramIcons';
import { getDifficultyColor, getTypeLabel } from '../../../utils/programUtils';

export default function ProgramCard({ program, onClick }) {

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Sélectionner le programme ${program.name}`}
    >
      {program.coverImage && (
        <div className={styles.coverImage}>
          <img
            src={program.coverImage}
            alt={`Image du programme ${program.name}`}
            loading="lazy"
          />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{program.name}</h3>
          <span className={`${styles.type} ${styles[program.type]}`}>
            {getTypeLabel(program.type)}
          </span>
        </div>

        <p className={styles.description}>{program.description}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.icon}>
              <TimerIcon size={16} />
            </span>
            <span>{program.estimatedDuration} min</span>
          </div>

          <div className={styles.stat}>
            <span className={styles.icon}>
              <FlameIcon size={16} />
            </span>
            <span>{program.estimatedCalories} kcal</span>
          </div>

          <div className={`${styles.stat} ${getDifficultyColor(program.difficulty, styles)}`}>
            <span className={styles.icon}>
              <TrendingUpIcon size={16} />
            </span>
            <span>{program.difficulty}</span>
          </div>
        </div>

        {program.tags && program.tags.length > 0 && (
          <div className={styles.tags}>
            {program.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.startButton}>
          Commencer
        </button>
      </div>
    </div>
  );
}
