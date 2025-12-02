import { useTranslation } from 'react-i18next';
import styles from './ProgramCard.module.css';
import { TimerIcon, FlameIcon, TrendingUpIcon } from '../ProgramIcons';

export default function ProgramCard({ program, onClick }) {
  const { t } = useTranslation();

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'débutant':
        return styles.easy;
      case 'intermédiaire':
        return styles.medium;
      case 'avancé':
        return styles.hard;
      default:
        return '';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      hiit: 'HIIT',
      circuit: 'Circuit',
      tabata: 'Tabata',
      superset: 'Superset',
      amrap: 'AMRAP',
      emom: 'EMOM',
      custom: 'Personnalisé',
    };
    return labels[type] || type;
  };

  return (
    <div className={styles.card} onClick={onClick}>
      {program.coverImage && (
        <div className={styles.coverImage}>
          <img src={program.coverImage} alt={program.name} />
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

          <div className={`${styles.stat} ${getDifficultyColor(program.difficulty)}`}>
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
