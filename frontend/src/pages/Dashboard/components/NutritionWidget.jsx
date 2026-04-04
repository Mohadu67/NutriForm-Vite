import React from 'react';
import { useNavigate } from 'react-router-dom';
import style from '../Dashboard.module.css';

function MacroBar({ label, current, goal, color }) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  return (
    <div className={style.nwMacro}>
      <span className={style.nwMacroLabel}>{label}</span>
      <div className={style.nwMacroTrack}>
        <div className={style.nwMacroFill} style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <span className={style.nwMacroValue}>{current} / {goal}g</span>
    </div>
  );
}

/**
 * NutritionWidget — receives data from parent (backend-computed).
 * Zero internal fetch, zero business logic.
 */
export const NutritionWidget = ({ nutrition }) => {
  const navigate = useNavigate();

  if (!nutrition) return null;

  const { consumed, goal, burned, remaining, pct } = nutrition;
  const macros = nutrition.macros || {};

  const ringSize = 76;
  const sw = 6;
  const r = (ringSize - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <section className={style.nutritionWidget}>
      <h2 className={style.sectionTitle}>Nutrition du jour</h2>
      <div className={style.nwClickable} onClick={() => navigate('/nutrition')} style={{ cursor: 'pointer' }}>
        <div className={style.nwRow}>
          <div className={style.nwStat}>
            <span className={style.nwStatValue}>{consumed}</span>
            <span className={style.nwStatLabel}>Mangees</span>
          </div>

          <div className={style.nwRingWrap}>
            <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
              <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" className={style.statRingTrack} strokeWidth={sw} />
              <circle
                cx={ringSize / 2} cy={ringSize / 2} r={r}
                fill="none" stroke="#72baa1" strokeWidth={sw}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className={style.nwRingText}>
              <span className={style.nwRingValue}>{remaining}</span>
              <span className={style.nwRingLabel}>Rest.</span>
            </div>
          </div>

          <div className={style.nwStat}>
            <span className={style.nwStatValue}>{burned}</span>
            <span className={style.nwStatLabel}>Brulees</span>
          </div>
        </div>

        {macros.proteins && (
          <div className={style.nwMacrosRow}>
            <MacroBar label="Proteines" current={macros.proteins.consumed} goal={macros.proteins.goal} color="#72baa1" />
            <MacroBar label="Glucides" current={macros.carbs.consumed} goal={macros.carbs.goal} color="#f0a47a" />
            <MacroBar label="Lipides" current={macros.fats.consumed} goal={macros.fats.goal} color="#c9a88c" />
          </div>
        )}
      </div>

      <button
        className={style.nwAddMealBtn}
        onClick={(e) => { e.stopPropagation(); navigate('/nutrition', { state: { openAddMeal: true } }); }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Ajouter un repas
      </button>
    </section>
  );
};
