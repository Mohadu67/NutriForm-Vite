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
  const [macroGoals, setMacroGoals] = useState(null);
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
        if (isPremium && goalsData.goals.macros) {
          setMacroGoals({
            proteins: goalsData.goals.macros.proteins || 0,
            carbs: goalsData.goals.macros.carbs || 0,
            fats: goalsData.goals.macros.fats || 0,
          });
        }
      }
      setLoaded(true);
    });
  }, [isPremium]);

  if (!loaded) return null;

  const effectiveGoal = goal + burned;
  const remaining = Math.max(effectiveGoal - consumed, 0);
  const pct = effectiveGoal > 0 ? Math.min(consumed / effectiveGoal, 1) : 0;

  // Arc gauge constants (270° arc, open at bottom)
  const R = 54;
  const CX = 65;
  const CY = 65;
  const START_ANGLE = 135;    // degrees, bottom-left
  const ARC_SPAN = 270;      // degrees total
  const circumference = 2 * Math.PI * R;
  const arcLength = (ARC_SPAN / 360) * circumference;
  const filledLength = pct * arcLength;

  // Dot position on the arc
  const dotAngle = START_ANGLE + pct * ARC_SPAN;
  const dotRad = (dotAngle * Math.PI) / 180;
  const dotX = CX + R * Math.cos(dotRad);
  const dotY = CY + R * Math.sin(dotRad);

  return (
    <section
      className={style.nutritionWidget}
      onClick={() => navigate('/nutrition')}
      style={{ cursor: 'pointer' }}
    >
      <div className={style.nwCaloriesRow}>
        {/* Mangées */}
        <div className={style.nwCalSide}>
          <span className={style.nwCalValue}>{consumed}</span>
          <span className={style.nwCalLabel}>Mangées</span>
        </div>

        {/* Center ring + remaining */}
        <div className={style.nwCalCenter}>
          <svg
            className={style.nwArc}
            viewBox="0 0 130 130"
            width="130"
            height="130"
          >
            {/* Background arc */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke="var(--nw-track, #e5e7eb)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={0}
              transform={`rotate(${START_ANGLE} ${CX} ${CY})`}
            />
            {/* Filled arc */}
            {pct > 0 && (
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="var(--nw-accent, #6db39b)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${filledLength} ${circumference}`}
                strokeDashoffset={0}
                transform={`rotate(${START_ANGLE} ${CX} ${CY})`}
              />
            )}
            {/* Dot indicator */}
            <circle
              cx={dotX} cy={dotY} r="5"
              fill="var(--nw-accent, #6db39b)"
            />
          </svg>
          <div className={style.nwCenterText}>
            <span className={style.nwRemainingValue}>{remaining}</span>
            <span className={style.nwRemainingLabel}>Restantes</span>
          </div>
        </div>

        {/* Brûlées */}
        <div className={style.nwCalSide}>
          <span className={style.nwCalValue}>{burned}</span>
          <span className={style.nwCalLabel}>Brûlées</span>
        </div>
      </div>

      {/* Macros bars */}
      {isPremium && macros && macroGoals && (
        <div className={style.nwMacrosRow}>
          <MacroBar label="Glucides" current={macros.carbs} goal={macroGoals.carbs} />
          <MacroBar label="Protéines" current={macros.proteins} goal={macroGoals.proteins} />
          <MacroBar label="Lipides" current={macros.fats} goal={macroGoals.fats} />
        </div>
      )}
    </section>
  );
};

function MacroBar({ label, current, goal }) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;

  return (
    <div className={style.nwMacro}>
      <span className={style.nwMacroLabel}>{label}</span>
      <div className={style.nwMacroTrack}>
        <div className={style.nwMacroFill} style={{ width: `${pct * 100}%` }} />
        <div
          className={style.nwMacroDot}
          style={{ left: `${pct * 100}%` }}
        />
      </div>
      <span className={style.nwMacroValue}>{current} / {goal} g</span>
    </div>
  );
}
