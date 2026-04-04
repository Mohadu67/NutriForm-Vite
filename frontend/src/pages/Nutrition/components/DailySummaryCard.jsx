import React, { useState } from 'react';
import style from '../NutritionPage.module.css';

function BurnedInput({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const save = () => {
    setEditing(false);
    const num = Number(draft);
    if (!isNaN(num) && num >= 0 && num !== value) onChange(num);
    else setDraft(String(value));
  };

  if (editing) {
    return (
      <input
        type="number"
        className={style.burnedInput}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        min="0"
        autoFocus
      />
    );
  }

  return (
    <button className={style.burnedBtn} onClick={() => { setDraft(String(value)); setEditing(true); }} title="Modifier">
      {value}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}

export default function DailySummaryCard({ consumed, goal, burned, onBurnedChange }) {
  const totalBudget = goal + burned;
  const remaining = Math.max(totalBudget - consumed, 0);
  const pct = totalBudget > 0 ? Math.min((consumed / totalBudget) * 100, 100) : 0;

  const ringSize = 80;
  const sw = 6;
  const r = (ringSize - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={style.calorieCard}>
      <div className={style.calorieCardBody}>
        <div className={style.calorieCardLeft}>
          <span className={style.calorieCardValue}>{remaining}</span>
          <span className={style.calorieCardLabel}>Calories restantes</span>
        </div>
        <div className={style.calorieCardRingWrap}>
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" className={style.ringTrack} strokeWidth={sw} />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={r}
              fill="none" stroke="#72baa1" strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>
          <span className={style.calorieRingIcon}>🔥</span>
        </div>
      </div>
      <div className={style.calorieCardMeta}>
        <div className={style.metaItem}>
          <span className={style.metaLabel}>Objectif</span>
          <span className={style.metaValue}>{goal}</span>
        </div>
        <div className={style.metaSep} />
        <div className={style.metaItem}>
          <span className={style.metaLabel}>Consomme</span>
          <span className={style.metaValue}>{consumed}</span>
        </div>
        <div className={style.metaSep} />
        <div className={style.metaItem}>
          <span className={style.metaLabel}>Brule</span>
          <span className={style.metaValue}>
            {onBurnedChange ? (
              <BurnedInput value={burned} onChange={onBurnedChange} />
            ) : (
              burned
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
