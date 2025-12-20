import React from "react";
import style from "../Dashboard.module.css";

/**
 * QuickActions - Composant pour les actions rapides
 * Nouvelle séance, calculs santé, matching
 */
export const QuickActions = ({ navigate, subscriptionTier }) => {
  return (
    <section className={style.actions}>
      <button onClick={() => navigate('/exo')} className={style.primaryAction}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nouvelle séance
      </button>
      <button onClick={() => navigate('/outils')} className={style.secondaryAction}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
          <path d="m18 15-2-2" />
          <path d="m15 18-2-2" />
        </svg>
        Calculs santé
      </button>
      {subscriptionTier === 'premium' && (
        <button onClick={() => navigate('/matching')} className={style.matchingAction}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          GymBro
        </button>
      )}
    </section>
  );
};
