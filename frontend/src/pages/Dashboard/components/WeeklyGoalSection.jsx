import React from "react";
import style from "../Dashboard.module.css";

export const WeeklyGoalSection = ({ sessionsThisWeek, weeklyGoal, weeklyCalories, onEditGoal }) => {
  const pct = weeklyGoal > 0 ? Math.min(Math.round((sessionsThisWeek / weeklyGoal) * 100), 100) : 0;
  const remaining = Math.max(weeklyGoal - sessionsThisWeek, 0);
  const size = 110;
  const sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <section className={style.goalSection}>
      <div className={style.goalHeader}>
        <h2 className={style.sectionTitle}>Objectif semaine</h2>
        <button onClick={onEditGoal} className={style.editButton} aria-label="Modifier objectif">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
      <div className={style.goalBody}>
        <div className={style.goalRingWrap}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={style.statRingTrack} strokeWidth={sw} />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={pct >= 100 ? '#72baa1' : '#f0a47a'} strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className={style.goalRingText}>
            <span className={style.goalRingValue}>{sessionsThisWeek}</span>
            <span className={style.goalRingGoal}>/{weeklyGoal}</span>
          </div>
        </div>
        <div className={style.goalInfo}>
          <p className={style.goalStatus}>
            {pct >= 100
              ? 'Objectif atteint !'
              : `${remaining} seance${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}
          </p>
          {weeklyCalories > 0 && (
            <p className={style.goalCalories}>{weeklyCalories} kcal brulees cette semaine</p>
          )}
        </div>
      </div>
    </section>
  );
};
