import React from "react";
import style from "../Dashboard.module.css";

/**
 * CardioStats - Composant affichant les statistiques de cardio
 * Course, vélo, natation, marche
 */
export const CardioStats = ({ sportStats }) => {
  if (Number(sportStats.total) === 0) {
    return null;
  }

  return (
    <section className={style.cardioSection}>
      <h2 className={style.sectionTitle}>Distances parcourues</h2>
      <div className={style.cardioGrid}>
        {Number(sportStats.run) > 0 && (
          <div className={style.cardioItem}>
            <div className={style.cardioIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21l-5-6 2-3"/>
                <path d="M15 21l5-6-2-3"/>
                <circle cx="12" cy="4" r="2"/>
                <path d="M10 7.5h4"/>
                <path d="M12 7.5v3"/>
                <path d="m8 13 4-2 4 2"/>
              </svg>
            </div>
            <span className={style.cardioValue}>{sportStats.run} km</span>
            <span className={style.cardioLabel}>Course</span>
          </div>
        )}
        {Number(sportStats.bike) > 0 && (
          <div className={style.cardioItem}>
            <div className={style.cardioIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                <path d="m12 17.5-3.5-5.5 3.5-4.5"/>
                <path d="M12 12h5.5L15 6"/>
              </svg>
            </div>
            <span className={style.cardioValue}>{sportStats.bike} km</span>
            <span className={style.cardioLabel}>Vélo</span>
          </div>
        )}
        {Number(sportStats.swim) > 0 && (
          <div className={style.cardioItem}>
            <div className={style.cardioIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="16" cy="5" r="2"/>
                <path d="M3 18c.6-.6 1.7-.6 2.4 0 .8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0 .6-.6 1.7-.6 2.4 0"/>
                <path d="M3 14c.6-.6 1.7-.6 2.4 0 .8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0s2-.8 2.8 0c.8.8 2 .8 2.8 0 .6-.6 1.7-.6 2.4 0"/>
                <path d="m14 8-2 4 3 2"/>
              </svg>
            </div>
            <span className={style.cardioValue}>{sportStats.swim} km</span>
            <span className={style.cardioLabel}>Natation</span>
          </div>
        )}
        {Number(sportStats.walk) > 0 && (
          <div className={style.cardioItem}>
            <div className={style.cardioIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1"/>
                <path d="M10 22v-5l-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4l-1 1v5"/>
                <path d="m8 10-1.5-1.5"/>
                <path d="m16 10 1.5-1.5"/>
              </svg>
            </div>
            <span className={style.cardioValue}>{sportStats.walk} km</span>
            <span className={style.cardioLabel}>Marche</span>
          </div>
        )}
      </div>
    </section>
  );
};
