import React from "react";
import style from "../Dashboard.module.css";

const ACTIONS = [
  {
    key: 'workout',
    label: 'Nouvelle seance',
    route: '/exo',
    color: '#72baa1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    key: 'tools',
    label: 'Calculs sante',
    route: '/outils',
    color: '#c9a88c',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  {
    key: 'nutrition',
    label: 'Nutrition',
    route: '/nutrition',
    color: '#f0a47a',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    key: 'matching',
    label: 'GymBro',
    route: '/matching',
    color: '#72baa1',
    premium: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export const QuickActions = ({ navigate, subscriptionTier }) => {
  return (
    <section className={style.actionsGrid}>
      {ACTIONS.filter((a) => !a.premium || subscriptionTier === 'premium').map((a) => (
        <button
          key={a.key}
          className={style.actionCard}
          onClick={() => navigate(a.route)}
        >
          <span className={style.actionIcon} style={{ color: a.color }}>{a.icon}</span>
          <span className={style.actionLabel}>{a.label}</span>
        </button>
      ))}
    </section>
  );
};
