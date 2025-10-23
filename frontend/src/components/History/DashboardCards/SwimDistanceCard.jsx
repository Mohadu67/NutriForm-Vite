import styles from "./DistanceCard.module.css";

function cx(base, extra) {
  return extra ? `${base} ${extra}` : base;
}

export default function SwimDistanceCard({
  stats,
  formatKmValue,
  shortDateFormatter,
  className,
}) {
  const formatter =
    shortDateFormatter ||
    new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });
  const formatKm = formatKmValue || ((value) => Number(value || 0).toFixed(2));
  const history = Array.isArray(stats?.history) ? stats.history : [];

  return (
    <article className={cx(styles.card, className)}>
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          🏊
        </span>
        <div>
          <h2 className={styles.title}>Natation</h2>
          <p className={styles.subtitle}>Distance cumulée</p>
        </div>
      </header>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total</span>
          <span className={styles.summaryValue}>
            {formatKm(stats?.totalKm || 0)} km
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Séances</span>
          <span className={styles.summaryValue}>{stats?.totalSessions || 0}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Moyenne</span>
          <span className={styles.summaryValue}>
            {formatKm(stats?.avgKm || 0)} km
          </span>
        </div>
      </div>

      <div className={styles.history}>
        <h4 className={styles.historyTitle}>Historique récent</h4>
        {history.length > 0 ? (
          <ul className={styles.historyList}>
            {history.slice(0, 6).map((item) => (
              <li key={item.dateKey} className={styles.historyItem}>
                <span className={styles.historyDate}>
                  {formatter.format(item.date)}
                </span>
                <span className={styles.historyDistance}>
                  {formatKm(item.distanceKm)} km
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.historyEmpty}>
            Pas encore de séance de natation enregistrée.
          </p>
        )}
      </div>
    </article>
  );
}
