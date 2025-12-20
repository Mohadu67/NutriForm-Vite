import React from "react";
import style from "../Dashboard.module.css";

/**
 * WeeklySummary - Resume motivant de la semaine
 * Affiche un message adapte au niveau d'activite
 */
export const WeeklySummary = ({ weeklySessions, weeklyCalories, userName }) => {
  // Determiner le message motivant selon l'activite
  const getMotivation = () => {
    if (weeklySessions === 0) {
      return {
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
        title: "C'est pas grave!",
        message: "Reste focus, faut juste se lancer. Une seance et tu es reparti!",
        type: "encourage"
      };
    } else if (weeklySessions <= 2) {
      return {
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        ),
        title: "Bon debut!",
        message: `${weeklySessions} seance${weeklySessions > 1 ? 's' : ''} cette semaine, c'est un bon debut! Continue sur ta lancee.`,
        type: "progress"
      };
    } else if (weeklySessions <= 4) {
      return {
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        ),
        title: "Belle semaine!",
        message: `${weeklySessions} seances${weeklyCalories > 0 ? ` et ${weeklyCalories} kcal brulees` : ''}. Tu progresses bien!`,
        type: "good"
      };
    } else {
      return {
        icon: (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
          </svg>
        ),
        title: "Semaine incroyable!",
        message: `${weeklySessions} seances${weeklyCalories > 0 ? `, ${weeklyCalories} kcal` : ''}! Tu es une machine, felicitations!`,
        type: "champion"
      };
    }
  };

  const motivation = getMotivation();

  return (
    <section className={`${style.weeklySummary} ${style[`weeklySummary_${motivation.type}`]}`}>
      <div className={style.weeklySummaryIcon}>
        {motivation.icon}
      </div>
      <div className={style.weeklySummaryContent}>
        <h3 className={style.weeklySummaryTitle}>{motivation.title}</h3>
        <p className={style.weeklySummaryMessage}>{motivation.message}</p>
      </div>
      <div className={style.weeklySummaryStats}>
        <div className={style.weeklySummaryStat}>
          <span className={style.weeklySummaryStatValue}>{weeklySessions}</span>
          <span className={style.weeklySummaryStatLabel}>seance{weeklySessions !== 1 ? 's' : ''}</span>
        </div>
        {weeklyCalories > 0 && (
          <div className={style.weeklySummaryStat}>
            <span className={style.weeklySummaryStatValue}>{weeklyCalories}</span>
            <span className={style.weeklySummaryStatLabel}>kcal</span>
          </div>
        )}
      </div>
    </section>
  );
};
