import React, { useState, useRef } from 'react';
import style from '../NutritionPage.module.css';

function BurnedInput({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  const save = () => {
    setEditing(false);
    const num = Number(draft);
    if (!isNaN(num) && num >= 0 && num !== value) {
      onChange(num);
    } else {
      setDraft(String(value));
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
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
    <button
      className={style.burnedBtn}
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      title="Cliquez pour modifier"
    >
      {value} kcal
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}

export default function DailySummaryCard({ consumed, goal, burned, onBurnedChange }) {
  // Budget total = objectif + calories brûlées (exercice)
  // Restant = budget total - consommé
  const totalBudget = goal + burned;
  const pct = totalBudget > 0 ? Math.min((consumed / totalBudget) * 100, 100) : 0;
  const remaining = Math.max(totalBudget - consumed, 0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const getColor = () => {
    if (pct > 100) return '#EF4444';
    if (pct > 80) return '#F59E0B';
    return '#22C55E';
  };

  return (
    <div className={style.summaryCard}>
      <div className={style.ringContainer}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
          <circle
            cx="80" cy="80" r={radius} fill="none"
            stroke={getColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className={style.ringText}>
          <span className={style.ringValue}>{consumed}</span>
          <span className={style.ringUnit}>kcal</span>
        </div>
      </div>
      <div className={style.summaryStats}>
        <div className={style.summaryStat}>
          <span className={style.summaryStatLabel}>Objectif</span>
          <span className={style.summaryStatValue}>{goal} kcal</span>
        </div>
        <div className={style.summaryStat}>
          <span className={style.summaryStatLabel}>Restant</span>
          <span className={style.summaryStatValue}>{remaining} kcal</span>
        </div>
        <div className={style.summaryStat}>
          <span className={style.summaryStatLabel}>Brûlé</span>
          {onBurnedChange ? (
            <BurnedInput value={burned} onChange={onBurnedChange} />
          ) : (
            <span className={style.summaryStatValue}>{burned} kcal</span>
          )}
        </div>
        <div className={style.summaryStat}>
          <span className={style.summaryStatLabel}>Balance</span>
          <span className={`${style.summaryStatValue} ${consumed > totalBudget ? style.negative : style.positive}`}>
            {consumed - totalBudget > 0 ? '+' : ''}{consumed - totalBudget} kcal
          </span>
        </div>
      </div>
    </div>
  );
}
