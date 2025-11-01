import { useState } from "react";
import styles from "./BadgesPanel.module.css";

function formatBadgeLabel(badge) {
  if (!badge) return "";
  const name = badge.name ?? "";
  const description = badge.desc ?? "";
  if (name && description) return `${name}: ${description}`;
  return name || description || "";
}

export default function BadgesPanel({ badges = [], className }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!Array.isArray(badges) || badges.length === 0) {
    return null;
  }

  const latestBadges = badges.slice(-6).reverse();

  return (
    <article className={`${styles.card} ${className || ""}`.trim()}>
      <button
        className={styles.badgesToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.badgesToggleContent}>
          <span className={styles.badgesToggleIcon}>🏆</span>
          <span className={styles.badgesToggleText}>
            {badges.length} badge{badges.length > 1 ? 's' : ''} débloqué{badges.length > 1 ? 's' : ''}
          </span>
        </span>
        <span className={`${styles.badgesToggleArrow} ${isExpanded ? styles.badgesToggleArrowExpanded : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
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
      )}
    </article>
  );
}
