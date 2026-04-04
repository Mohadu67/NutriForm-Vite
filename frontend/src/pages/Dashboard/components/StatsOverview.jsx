import React from "react";
import style from "../Dashboard.module.css";

function StatRing({ value, label, sub, pct, color, onClick }) {
  const size = 64;
  const sw = 5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct || 0, 100) / 100) * circ;

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag className={`${style.statCard} ${onClick ? style.statCardClickable : ''}`} onClick={onClick || undefined}>
      <div className={style.statRingWrap}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={style.statRingTrack} strokeWidth={sw} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <span className={style.statRingValue}>{value}</span>
      </div>
      <span className={style.statLabel}>{label}</span>
      {sub && <span className={style.statSub}>{sub}</span>}
    </Tag>
  );
}

export const StatsOverview = ({ stats, badges, onSessionsClick, onBadgesClick }) => {
  if (!stats) return null;

  const sessionsPct = Math.min((stats.totalSessions / 50) * 100, 100);
  const streakPct = stats.bestStreak > 0 ? Math.min((stats.currentStreak / stats.bestStreak) * 100, 100) : 0;
  const hoursPct = Math.min((stats.totalHours / 25) * 100, 100);
  const badgesPct = badges ? Math.min((badges.count / badges.total) * 100, 100) : 0;

  const trendLabel = stats.sessionsTrend?.direction === 'up'
    ? `+${stats.sessionsTrend.value} vs sem. dern.`
    : stats.sessionsTrend?.direction === 'down'
      ? `-${stats.sessionsTrend.value} vs sem. dern.`
      : null;

  return (
    <section className={style.statsGrid}>
      <StatRing
        value={stats.totalSessions}
        label="Seances"
        sub={trendLabel}
        pct={sessionsPct}
        color="#72baa1"
        onClick={stats.totalSessions > 0 ? onSessionsClick : undefined}
      />
      <StatRing
        value={stats.currentStreak}
        label="Serie"
        sub={stats.bestStreak > stats.currentStreak ? `Record: ${stats.bestStreak}j` : null}
        pct={streakPct}
        color="#f0a47a"
      />
      <StatRing
        value={`${stats.totalHours}h`}
        label="Duree"
        sub={stats.avgSessionDurationMin > 0 ? `~${stats.avgSessionDurationMin}min/s` : null}
        pct={hoursPct}
        color="#c9a88c"
      />
      <StatRing
        value={badges?.count || 0}
        label="Badges"
        sub={badges?.nextBadge ? `Prochain: ${badges.nextBadge.name}` : null}
        pct={badgesPct}
        color="#72baa1"
        onClick={onBadgesClick}
      />
    </section>
  );
};
