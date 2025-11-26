import React from "react";
import style from "../Dashboard.module.css";

/**
 * StatsOverview - Composant affichant les statistiques principales
 * Extrait du Dashboard pour réduire la complexité
 */
export const StatsOverview = ({
  stats,
  sessionsTrend,
  bestStreak,
  avgSessionDuration,
  badgeCount,
  nextBadge,
  onSessionsClick,
  onBadgesClick
}) => {
  return (
    <section className={style.statsGrid}>
      {/* Total Sessions */}
      <button
        className={`${style.statCard} ${style.statCardClickable} ${style.statCardSessions}`}
        onClick={() => stats.totalSessions > 0 && onSessionsClick()}
        disabled={stats.totalSessions === 0}
      >
        <span className={style.statIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.4 14.4 9.6 9.6"/>
            <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
            <path d="m21.5 21.5-1.4-1.4"/>
            <path d="M3.9 3.9 2.5 2.5"/>
            <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
          </svg>
        </span>
        <div className={style.statContent}>
          <span className={style.statValue}>{stats.totalSessions}</span>
          <span className={style.statLabel}>Séances</span>
          {sessionsTrend && sessionsTrend.direction !== 'same' && (
            <span className={style.statTrend}>
              {sessionsTrend.direction === 'up' ? '↗' : '↘'} {sessionsTrend.value} vs sem. dernière
            </span>
          )}
        </div>
      </button>

      {/* Streak */}
      <div className={`${style.statCard} ${style.statCardStreak}`}>
        <span className={style.statIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        </span>
        <div className={style.statContent}>
          <span className={style.statValue}>{stats.streak}</span>
          <span className={style.statLabel}>Série</span>
          {bestStreak > stats.streak && (
            <span className={style.statTrend}>Record: {bestStreak}j</span>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className={`${style.statCard} ${style.statCardDuration}`}>
        <span className={style.statIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </span>
        <div className={style.statContent}>
          <span className={style.statValue}>{stats.totalHours}h{stats.totalMinutes % 60 > 0 ? String(stats.totalMinutes % 60).padStart(2, '0') : ''}</span>
          <span className={style.statLabel}>Durée</span>
          {avgSessionDuration > 0 && (
            <span className={style.statTrend}>~{avgSessionDuration}min/séance</span>
          )}
        </div>
      </div>

      {/* Badges */}
      <button
        className={`${style.statCard} ${style.statCardClickable} ${style.statCardBadges}`}
        onClick={onBadgesClick}
      >
        <span className={style.statIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
          </svg>
        </span>
        <div className={style.statContent}>
          <span className={style.statValue}>{badgeCount}</span>
          <span className={style.statLabel}>Badges</span>
          {nextBadge && (
            <span className={style.statTrend}>Prochain: {nextBadge.emoji} {nextBadge.name}</span>
          )}
        </div>
      </button>
    </section>
  );
};
