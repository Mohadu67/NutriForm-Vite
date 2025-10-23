import styles from "./ActivityHeatmapPanel.module.css";

function cx(base, extra) {
  return extra ? `${base} ${extra}` : base;
}

function intensityClass(intensity) {
  if (intensity >= 3) return styles.intensity3;
  if (intensity === 2) return styles.intensity2;
  if (intensity === 1) return styles.intensity1;
  return styles.intensity0;
}

export default function ActivityHeatmapPanel({ weeks, className }) {
  const data = Array.isArray(weeks) ? weeks : [];

  return (
    <article className={cx(styles.card, className)}>
      <div className={styles.header}>
        <h3 className={styles.title}>📊 Activité des 12 dernières semaines</h3>
        <div className={styles.legend}>
          <span className={styles.legendLabel}>Moins</span>
          <div className={styles.legendDots}>
            <div className={`${styles.legendDot} ${styles.legendDotZero}`} />
            <div className={`${styles.legendDot} ${styles.legendDotLow}`} />
            <div className={`${styles.legendDot} ${styles.legendDotMedium}`} />
            <div className={`${styles.legendDot} ${styles.legendDotHigh}`} />
          </div>
          <span className={styles.legendLabel}>Plus</span>
        </div>
      </div>

      <div className={styles.grid}>
        {data.map((week, index) => (
          <div key={index} className={styles.weekCard}>
            <div className={styles.weekHeader}>
              <span className={styles.weekLabel}>{week.label}</span>
              {week.isCurrentWeek && (
                <span className={styles.currentBadge}>En cours</span>
              )}
            </div>
            <div className={styles.weekStats}>
              <div className={styles.sessionCount}>
                <span className={styles.countNumber}>{week.count}</span>
                <span className={styles.countLabel}>
                  séance{week.count > 1 ? "s" : ""}
                </span>
              </div>
              <div
                className={`${styles.intensityDot} ${intensityClass(
                  week.intensity
                )}`}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
