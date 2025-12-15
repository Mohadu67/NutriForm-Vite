import styles from './BadgeDisplay.module.css';

const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B'
};

export default function BadgeDisplay({
  badges = [],
  size = 'medium',
  max = 3,
  showEmpty = false,
  onBadgeClick
}) {
  const displayBadges = badges.slice(0, max);
  const emptySlots = showEmpty ? max - displayBadges.length : 0;

  if (displayBadges.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      {displayBadges.map((badge, index) => {
        const badgeInfo = badge.badgeId || badge;
        return (
          <div
            key={badge._id || index}
            className={styles.badge}
            style={{
              '--rarity-color': RARITY_COLORS[badgeInfo.rarity] || RARITY_COLORS.common
            }}
            onClick={() => onBadgeClick?.(badge)}
            title={`${badgeInfo.name}\n${badgeInfo.description}`}
          >
            <span className={styles.icon}>{badgeInfo.icon}</span>
            {size !== 'small' && (
              <span className={styles.rarityDot} />
            )}
          </div>
        );
      })}

      {Array.from({ length: emptySlots }).map((_, index) => (
        <div key={`empty-${index}`} className={`${styles.badge} ${styles.empty}`}>
          <span className={styles.icon}>?</span>
        </div>
      ))}
    </div>
  );
}

// Composant pour afficher tous les badges avec catégories
export function BadgeGrid({
  badges = [],
  unlockedBadges = [],
  onBadgeClick
}) {
  const unlockedCodes = new Set(unlockedBadges.map(b => b.badgeCode || b.code));

  // Grouper par catégorie
  const categories = {
    streak: { name: 'Streak', icon: '🔥', badges: [] },
    sessions: { name: 'Séances', icon: '💪', badges: [] },
    challenge: { name: 'Défis', icon: '⚔️', badges: [] },
    special: { name: 'Spécial', icon: '🌟', badges: [] },
    league: { name: 'Ligues', icon: '🏆', badges: [] }
  };

  badges.forEach(badge => {
    if (categories[badge.category]) {
      categories[badge.category].badges.push({
        ...badge,
        unlocked: unlockedCodes.has(badge.code)
      });
    }
  });

  return (
    <div className={styles.grid}>
      {Object.entries(categories).map(([key, category]) => {
        if (category.badges.length === 0) return null;

        return (
          <div key={key} className={styles.category}>
            <h4 className={styles.categoryTitle}>
              <span>{category.icon}</span>
              {category.name}
            </h4>
            <div className={styles.categoryBadges}>
              {category.badges.map(badge => (
                <div
                  key={badge.code}
                  className={`${styles.gridBadge} ${badge.unlocked ? styles.unlocked : styles.locked}`}
                  style={{
                    '--rarity-color': RARITY_COLORS[badge.rarity] || RARITY_COLORS.common
                  }}
                  onClick={() => onBadgeClick?.(badge)}
                >
                  <span className={styles.gridIcon}>{badge.icon}</span>
                  <span className={styles.gridName}>{badge.name}</span>
                  {!badge.unlocked && (
                    <span className={styles.lockIcon}>🔒</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mini badge pour affichage inline
export function BadgeInline({ badge, size = 'small' }) {
  if (!badge) return null;

  const badgeInfo = badge.badgeId || badge;

  return (
    <span
      className={`${styles.inline} ${styles[size]}`}
      title={badgeInfo.name}
    >
      {badgeInfo.icon}
    </span>
  );
}
