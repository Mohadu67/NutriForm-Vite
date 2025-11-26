import React from "react";
import style from "../Dashboard.module.css";

/**
 * BodyMetrics - Composant affichant les métriques corporelles
 * IMC, poids, calories, etc.
 */
export const BodyMetrics = ({ weightData, calorieTargets, weightChange }) => {
  if (!weightData && !calorieTargets) {
    return null;
  }

  return (
    <section className={style.metricsSection}>
      <h2 className={style.sectionTitle}>Corps & Nutrition</h2>
      <div className={style.metricsGrid}>
        {weightData && (
          <div className={style.metricCard}>
            <div className={style.metricIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 20h10"/>
                <path d="M5 17a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
                <path d="M19 17a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
                <path d="M12 11V8"/>
                <path d="m8 8 4-5 4 5"/>
              </svg>
            </div>
            <div className={style.metricContent}>
              <span className={style.metricValue}>{weightData.bmi}</span>
              <span className={style.metricLabel}>IMC • {weightData.interpretation}</span>
              {weightData.weight && (
                <span className={style.metricMeta}>
                  {weightData.weight} kg
                  {weightChange && weightChange.direction !== 'same' && (
                    <> • {weightChange.direction === 'down' ? '↓' : '↑'} {weightChange.value} kg</>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
        {calorieTargets && (
          <div className={style.metricCard}>
            <div className={style.metricIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 7.07 17.07 10 10 0 1 1-14.14 0A10 10 0 0 1 12 2z"/>
                <path d="M12 6v6l4 2"/>
                <circle cx="12" cy="12" r="1"/>
              </svg>
            </div>
            <div className={style.metricContent}>
              <span className={style.metricValue}>{calorieTargets.maintenance}</span>
              <span className={style.metricLabel}>kcal/jour maintien</span>
              <span className={style.metricMeta}>Perte: {calorieTargets.deficit} • Prise: {calorieTargets.surplus}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
