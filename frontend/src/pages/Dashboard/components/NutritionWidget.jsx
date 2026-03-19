import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailySummary, getNutritionGoals } from '../../../shared/api/nutrition';
import style from '../Dashboard.module.css';

export const NutritionWidget = ({ isPremium }) => {
  const navigate = useNavigate();
  const [consumed, setConsumed] = useState(0);
  const [burned, setBurned] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [macros, setMacros] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      getDailySummary(today).catch(() => null),
      getNutritionGoals().catch(() => null),
    ]).then(([summary, goalsData]) => {
      if (summary) {
        setConsumed(summary.consumed?.calories || 0);
        setBurned(summary.burned || 0);
        if (isPremium) {
          setMacros({
            proteins: summary.consumed?.proteins || 0,
            carbs: summary.consumed?.carbs || 0,
            fats: summary.consumed?.fats || 0,
          });
        }
      }
      if (goalsData?.goals) {
        setGoal(goalsData.goals.dailyCalories || 2000);
      }
      setLoaded(true);
    });
  }, [isPremium]);

  if (!loaded) return null;

  const pct = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;
  const remaining = Math.max(goal - consumed, 0);

  return (
    <section
      className={style.nutritionWidget}
      onClick={() => navigate('/nutrition')}
      style={{ cursor: 'pointer' }}
    >
      <div className={style.nutritionWidgetHeader}>
        <h3 className={style.nutritionWidgetTitle}>Nutrition du jour</h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      <div className={style.nutritionWidgetContent}>
        <div className={style.nutritionWidgetRing}>
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#E5E7EB" strokeWidth="5" />
            <circle
              cx="30" cy="30" r="24" fill="none"
              stroke={pct > 100 ? '#EF4444' : '#22C55E'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 150.8} 150.8`}
              transform="rotate(-90 30 30)"
            />
          </svg>
          <span className={style.nutritionWidgetPct}>{pct}%</span>
        </div>
        <div className={style.nutritionWidgetStats}>
          <div><span className={style.nutritionWidgetLabel}>Consommé</span><strong>{consumed} kcal</strong></div>
          <div><span className={style.nutritionWidgetLabel}>Restant</span><strong>{remaining} kcal</strong></div>
          <div><span className={style.nutritionWidgetLabel}>Brûlé</span><strong>{burned} kcal</strong></div>
        </div>
      </div>
      {isPremium && macros && (
        <div className={style.nutritionWidgetMacros}>
          <span>P: {macros.proteins}g</span>
          <span>G: {macros.carbs}g</span>
          <span>L: {macros.fats}g</span>
        </div>
      )}
    </section>
  );
};
