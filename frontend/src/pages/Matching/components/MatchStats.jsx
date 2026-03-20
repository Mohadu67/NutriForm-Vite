import styles from './MatchStats.module.css';
import { HeartIcon, UsersIcon } from '../../../components/Icons/GlobalIcons';

export default function MatchStats({
  mutualCount,
  remainingCount,
  totalCount,
  rejectedCount,
  onShowMatches,
  onShowRejected
}) {
  const progress = totalCount > 0 ? ((totalCount - remainingCount) / totalCount) * 100 : 0;

  return (
    <div className={styles.stats}>
      <button
        className={`${styles.statCard} ${mutualCount > 0 ? '' : styles.disabled}`}
        onClick={() => mutualCount > 0 && onShowMatches()}
      >
        <div className={styles.iconWrap} data-variant="heart">
          <HeartIcon size={20} filled={mutualCount > 0} />
        </div>
        <span className={styles.statValue}>{mutualCount}</span>
        <span className={styles.statLabel}>Matches</span>
      </button>

      <div className={styles.progressCard}>
        <svg className={styles.ring} viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="42"
            strokeWidth="6"
            fill="none"
            className={styles.ringBg}
          />
          <circle
            cx="50" cy="50" r="42"
            strokeWidth="6"
            fill="none"
            className={styles.ringFill}
            strokeDasharray={2 * Math.PI * 42}
            strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
            transform="rotate(-90 50 50)"
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.ringText}>
          <span className={styles.ringValue}>{remainingCount}</span>
          <span className={styles.ringLabel}>restants</span>
        </div>
      </div>

      <button
        className={`${styles.statCard} ${rejectedCount > 0 ? '' : styles.disabled}`}
        onClick={() => rejectedCount > 0 && onShowRejected()}
      >
        <div className={styles.iconWrap} data-variant="users">
          <UsersIcon size={20} />
        </div>
        <span className={styles.statValue}>{rejectedCount}</span>
        <span className={styles.statLabel}>Vus</span>
      </button>
    </div>
  );
}
