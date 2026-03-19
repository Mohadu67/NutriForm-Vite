import React from 'react';
import style from '../NutritionPage.module.css';

export default function DailySummaryCard({ consumed, goal, burned }) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - consumed, 0);
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
          <span className={style.summaryStatValue}>{burned} kcal</span>
        </div>
        <div className={style.summaryStat}>
          <span className={style.summaryStatLabel}>Balance</span>
          <span className={`${style.summaryStatValue} ${consumed - burned > goal ? style.negative : style.positive}`}>
            {consumed - burned > 0 ? '+' : ''}{consumed - burned} kcal
          </span>
        </div>
      </div>
    </div>
  );
}
