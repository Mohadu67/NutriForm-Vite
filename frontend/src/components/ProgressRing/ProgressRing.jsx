import styles from './ProgressRing.module.css';

/**
 * Circular progress ring component
 * @param {Object} props
 * @param {number} props.current - Current value
 * @param {number} props.total - Total value
 * @param {string} [props.label] - Label text below the number (default: "restants")
 * @param {string} [props.size] - Size variant: "sm" | "md" | "lg" (default: "md")
 * @param {string} [props.color] - Color variant: "primary" | "success" | "accent" (default: "primary")
 */
const ProgressRing = ({
  current,
  total,
  label = 'restants',
  size = 'md',
  color = 'primary'
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (current / total) * 100 : 0;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`${styles.progressRing} ${styles[size]} ${styles[color]}`}>
      <svg viewBox="0 0 100 100">
        <circle
          className={styles.progressRingBg}
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="6"
        />
        <circle
          className={styles.progressRingCircle}
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.progressRingText}>
        <span className={styles.progressRingNumber}>{current}</span>
        <span className={styles.progressRingLabel}>{label}</span>
      </div>
    </div>
  );
};

export default ProgressRing;
