import React from "react";
import style from "../Dashboard.module.css";

const SIZE = 44;
const SW = 4;
const R = (SIZE - SW) / 2;
const CIRC = 2 * Math.PI * R;

export const WeeklyGoalSection = ({ sessionsThisWeek, weeklyGoal, weeklyCalories, onEditGoal }) => {
  const done = sessionsThisWeek || 0;
  const pct = weeklyGoal > 0 ? Math.min(Math.round((done / weeklyGoal) * 100), 100) : 0;
  const isCompleted = pct >= 100;
  const remaining = Math.max(weeklyGoal - done, 0);
  const offset = CIRC - (pct / 100) * CIRC;
  const ringColor = isCompleted ? '#22c55e' : '#72baa1';

  return (
    <div className={style.wgRow}>
      {/* Mini ring */}
      <div className={style.wgRingWrap}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" className={style.statRingTrack} strokeWidth={SW} />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={ringColor} strokeWidth={SW}
            strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <span className={style.wgRingText}>
          {done}<span className={style.wgRingGoal}>/{weeklyGoal}</span>
        </span>
      </div>

      {/* Info */}
      <div className={style.wgInfo}>
        <span className={style.wgTitle}>
          {isCompleted ? 'Objectif atteint !' : `${remaining} seance${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}
        </span>
        {weeklyCalories > 0 && (
          <span className={style.wgSub}>{weeklyCalories.toLocaleString()} kcal cette semaine</span>
        )}
      </div>

      {/* Edit */}
      {onEditGoal && (
        <button className={style.wgEditBtn} onClick={onEditGoal} aria-label="Modifier objectif">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
    </div>
  );
};
