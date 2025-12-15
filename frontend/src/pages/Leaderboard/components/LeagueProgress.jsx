import { LEAGUE_INFO, getProgressToNextLeague } from '../hooks/useChallenges';
import BadgeDisplay from './BadgeDisplay';
import styles from './LeagueProgress.module.css';

export default function LeagueProgress({
  league = 'starter',
  xp = 0,
  badges = [],
  challengeStats = {},
  compact = false
}) {
  const leagueInfo = LEAGUE_INFO[league] || LEAGUE_INFO.starter;
  const progress = getProgressToNextLeague(xp);

  if (compact) {
    return (
      <div className={styles.compact}>
        <span className={styles.compactIcon}>{leagueInfo.icon}</span>
        <span className={styles.compactName}>{leagueInfo.name}</span>
        <span className={styles.compactXp}>{xp} XP</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* League Info */}
      <div className={styles.leagueSection}>
        <div className={styles.leagueIcon} style={{ '--league-color': leagueInfo.color }}>
          {leagueInfo.icon}
        </div>
        <div className={styles.leagueInfo}>
          <span className={styles.leagueLabel}>Ta ligue</span>
          <span className={styles.leagueName} style={{ color: leagueInfo.color }}>
            {leagueInfo.name}
          </span>
        </div>
        <div className={styles.xpBadge}>
          {xp} XP
        </div>
      </div>

      {/* Progress Bar */}
      {progress.nextLeague && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${progress.percentage}%`,
                background: `linear-gradient(90deg, ${leagueInfo.color}, ${LEAGUE_INFO[progress.nextLeague].color})`
              }}
            />
          </div>
          <div className={styles.progressInfo}>
            <span>{xp} / {progress.target} XP</span>
            <span className={styles.nextLeague}>
              {LEAGUE_INFO[progress.nextLeague].icon} {LEAGUE_INFO[progress.nextLeague].name}
            </span>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {/* Badges */}
        <div className={styles.statItem}>
          <div className={styles.statIcon}>🎖️</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{badges.length}</span>
            <span className={styles.statLabel}>Badges</span>
          </div>
          {badges.length > 0 && (
            <BadgeDisplay badges={badges} size="small" max={3} />
          )}
        </div>

        {/* Défis */}
        {challengeStats.wins !== undefined && (
          <div className={styles.statItem}>
            <div className={styles.statIcon}>⚔️</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {challengeStats.wins || 0}
              </span>
              <span className={styles.statLabel}>Victoires</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Version mini pour affichage dans la liste
export function LeagueBadge({ league, size = 'medium' }) {
  const leagueInfo = LEAGUE_INFO[league] || LEAGUE_INFO.starter;

  return (
    <span
      className={`${styles.leagueBadge} ${styles[size]}`}
      style={{ '--league-color': leagueInfo.color }}
      title={leagueInfo.name}
    >
      {leagueInfo.icon}
    </span>
  );
}
