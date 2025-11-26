import React from "react";
import style from "../Dashboard.module.css";

/**
 * WeeklyGoalSection - Composant pour l'objectif hebdomadaire
 * Affiche la progression vers l'objectif de la semaine
 */
export const WeeklyGoalSection = ({
  stats,
  weeklyGoal,
  weeklyProgress,
  weeklyCalories,
  onEditGoal
}) => {
  return (
    <section className={style.progressSection}>
      <div className={style.progressHeader}>
        <h2 className={style.sectionTitle}>Objectif semaine</h2>
        <button onClick={onEditGoal} className={style.editButton} aria-label="Modifier objectif">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
      <div className={style.progressContent}>
        <div className={style.progressRing}>
          <svg viewBox="0 0 100 100" className={style.progressSvg}>
            <circle cx="50" cy="50" r="42" className={style.progressBg} />
            <circle
              cx="50"
              cy="50"
              r="42"
              className={style.progressFill}
              style={{
                strokeDasharray: `${(weeklyProgress / 100) * 264} 264`,
              }}
            />
          </svg>
          <div className={style.progressText}>
            <span className={style.progressValue}>{stats.last7Days}</span>
            <span className={style.progressGoal}>/{weeklyGoal}</span>
          </div>
        </div>
        <div className={style.progressInfo}>
          <p className={style.progressStatus}>
            {weeklyProgress >= 100
              ? "Objectif atteint !"
              : `${weeklyGoal - stats.last7Days} séance${weeklyGoal - stats.last7Days > 1 ? 's' : ''} restante${weeklyGoal - stats.last7Days > 1 ? 's' : ''}`}
          </p>
          {weeklyCalories > 0 && (
            <p className={style.progressCalories}>{weeklyCalories} kcal brûlées cette semaine</p>
          )}
        </div>
      </div>
    </section>
  );
};
