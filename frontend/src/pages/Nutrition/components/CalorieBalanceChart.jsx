import React from 'react';
import style from '../NutritionPage.module.css';

export default function CalorieBalanceChart({ consumed, burned, goal }) {
  const max = Math.max(consumed, burned, goal, 1);

  return (
    <div className={style.balanceCard}>
      <h3 className={style.cardTitle}>Balance calorique</h3>
      <div className={style.balanceBars}>
        <div className={style.balanceRow}>
          <span className={style.balanceLabel}>Consommé</span>
          <div className={style.balanceBarBg}>
            <div
              className={style.balanceBarFill}
              style={{ width: `${(consumed / max) * 100}%`, backgroundColor: '#3B82F6' }}
            />
          </div>
          <span className={style.balanceValue}>{consumed}</span>
        </div>
        <div className={style.balanceRow}>
          <span className={style.balanceLabel}>Brûlé</span>
          <div className={style.balanceBarBg}>
            <div
              className={style.balanceBarFill}
              style={{ width: `${(burned / max) * 100}%`, backgroundColor: '#EF4444' }}
            />
          </div>
          <span className={style.balanceValue}>{burned}</span>
        </div>
        <div className={style.balanceRow}>
          <span className={style.balanceLabel}>Objectif</span>
          <div className={style.balanceBarBg}>
            <div
              className={style.balanceBarFill}
              style={{ width: `${(goal / max) * 100}%`, backgroundColor: '#22C55E' }}
            />
          </div>
          <span className={style.balanceValue}>{goal}</span>
        </div>
      </div>
    </div>
  );
}
