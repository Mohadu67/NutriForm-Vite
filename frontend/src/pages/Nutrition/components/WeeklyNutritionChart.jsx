import React from 'react';
import { useNavigate } from 'react-router-dom';
import style from '../NutritionPage.module.css';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function WeeklyNutritionChart({ data, isPremium }) {
  const navigate = useNavigate();

  if (!isPremium) {
    return (
      <div className={style.premiumTeaser}>
        <span className={style.premiumTeaserIcon}>📊</span>
        <h3>Graphique hebdomadaire</h3>
        <p>Visualisez votre consommation sur 7 jours avec des graphiques détaillés</p>
        <button onClick={() => navigate('/pricing')} className={style.btnPrimary}>
          Débloquer avec Premium
        </button>
      </div>
    );
  }

  if (!data?.days?.length) return null;

  const max = Math.max(...data.days.map(d => Math.max(d.consumed, d.burned)), 1);
  const chartHeight = 140;

  return (
    <div className={style.weeklyCard}>
      <h3 className={style.cardTitle}>Résumé hebdomadaire</h3>
      <div className={style.weeklyChart}>
        <svg width="100%" height={chartHeight + 30} viewBox={`0 0 ${data.days.length * 50} ${chartHeight + 30}`}>
          {data.days.map((day, i) => {
            const x = i * 50 + 10;
            const consumedH = (day.consumed / max) * chartHeight;
            const burnedH = (day.burned / max) * chartHeight;
            const dayLabel = DAYS[new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1];

            return (
              <g key={i}>
                <rect x={x} y={chartHeight - consumedH} width="14" height={consumedH} rx="3" fill="#3B82F6" opacity={0.8} />
                <rect x={x + 16} y={chartHeight - burnedH} width="14" height={burnedH} rx="3" fill="#EF4444" opacity={0.8} />
                <text x={x + 15} y={chartHeight + 18} textAnchor="middle" fontSize="11" fill="#888">{dayLabel}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className={style.weeklyLegend}>
        <span><span className={style.legendDot} style={{ backgroundColor: '#3B82F6' }} /> Consommé</span>
        <span><span className={style.legendDot} style={{ backgroundColor: '#EF4444' }} /> Brûlé</span>
      </div>
      {data.averages && (
        <div className={style.weeklyAverages}>
          <span>Moy. calories: <strong>{data.averages.calories}</strong></span>
          <span>Moy. protéines: <strong>{data.averages.proteins}g</strong></span>
        </div>
      )}
    </div>
  );
}
