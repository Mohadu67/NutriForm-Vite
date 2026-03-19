import React from 'react';
import style from '../NutritionPage.module.css';

export default function MacroBreakdown({ proteins, carbs, fats, goalsProteins, goalsCarbs, goalsFats, isPremium }) {
  const total = proteins + carbs + fats;

  const pctProteins = total > 0 ? Math.round((proteins / total) * 100) : 0;
  const pctCarbs = total > 0 ? Math.round((carbs / total) * 100) : 0;
  const pctFats = total > 0 ? 100 - pctProteins - pctCarbs : 0;

  // SVG donut segments
  const size = 120;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { pct: pctProteins, color: '#3B82F6', label: 'Protéines', value: proteins, goal: goalsProteins, unit: 'g' },
    { pct: pctCarbs, color: '#F59E0B', label: 'Glucides', value: carbs, goal: goalsCarbs, unit: 'g' },
    { pct: pctFats, color: '#EF4444', label: 'Lipides', value: fats, goal: goalsFats, unit: 'g' },
  ];

  let cumulativeOffset = 0;

  if (!isPremium) {
    return (
      <div className={style.macroCard}>
        <h3 className={style.cardTitle}>Macronutriments</h3>
        <div className={style.macroTextOnly}>
          {segments.map((s) => (
            <div key={s.label} className={style.macroTextRow}>
              <span className={style.macroDot} style={{ backgroundColor: s.color }} />
              <span className={style.macroLabel}>{s.label}</span>
              <span className={style.macroValue}>{s.value}{s.unit}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={style.macroCard}>
      <h3 className={style.cardTitle}>Macronutriments</h3>
      <div className={style.macroContent}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total > 0 && segments.map((seg) => {
            const dashLength = (seg.pct / 100) * circumference;
            const dashOffset = -cumulativeOffset;
            cumulativeOffset += dashLength;
            return (
              <circle
                key={seg.label}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
          {total === 0 && (
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth="12" />
          )}
        </svg>
        <div className={style.macroLegend}>
          {segments.map((s) => (
            <div key={s.label} className={style.macroRow}>
              <span className={style.macroDot} style={{ backgroundColor: s.color }} />
              <span className={style.macroLabel}>{s.label}</span>
              <span className={style.macroValue}>{s.value} / {s.goal}{s.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
