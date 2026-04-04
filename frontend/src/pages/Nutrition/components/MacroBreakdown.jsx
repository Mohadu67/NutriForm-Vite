import React from 'react';
import style from '../NutritionPage.module.css';

const MACROS = [
  { key: 'proteins', label: 'Proteines', color: '#72baa1', icon: '🍗' },
  { key: 'carbs', label: 'Glucides', color: '#f0a47a', icon: '🌾' },
  { key: 'fats', label: 'Lipides', color: '#c9a88c', icon: '🫒' },
];

function MacroRing({ value, goal, color, icon, size = 56, strokeWidth = 5 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={style.macroRingWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={style.ringTrack} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className={style.macroRingIcon}>{icon}</span>
    </div>
  );
}

export default function MacroBreakdown({ proteins, carbs, fats, goalsProteins, goalsCarbs, goalsFats }) {
  const values = { proteins, carbs, fats };
  const goals = { proteins: goalsProteins, carbs: goalsCarbs, fats: goalsFats };

  return (
    <div className={style.macroCards}>
      {MACROS.map((m) => {
        const left = Math.max(goals[m.key] - values[m.key], 0);
        return (
          <div key={m.key} className={style.macroCard}>
            <span className={style.macroCardValue} style={{ color: m.color }}>{left}g</span>
            <span className={style.macroCardLabel}>{m.label} rest.</span>
            <MacroRing value={values[m.key]} goal={goals[m.key]} color={m.color} icon={m.icon} />
          </div>
        );
      })}
    </div>
  );
}
