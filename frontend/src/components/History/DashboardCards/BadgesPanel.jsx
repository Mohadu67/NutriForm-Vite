import styles from "./BadgesPanel.module.css";

function formatBadgeLabel(badge) {
  if (!badge) return "";
  const name = badge.name ?? "";
  const description = badge.desc ?? "";
  if (name && description) return `${name}: ${description}`;
  return name || description || "";
}

export default function BadgesPanel({ badges = [], className }) {
  if (!Array.isArray(badges) || badges.length === 0) {
    return null;
  }

  const latestBadges = badges.slice(-6).reverse();

  return (
    <article className={`${styles.card} ${className || ""}`.trim()}>
      <h3 className={styles.title}>🏆 Tes badges ({badges.length})</h3>
      <div className={styles.grid}>
        {latestBadges.map((badge, index) => {
          const label = formatBadgeLabel(badge);
          return (
            <div key={index} className={styles.badgeCard}>
              <span
                className={styles.badgeIcon}
                aria-label={label || undefined}
              >
                {badge.icon}
              </span>
              <h4 className={styles.badgeName}>{badge.name}</h4>
              <p className={styles.badgeDesc}>{badge.desc}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}
