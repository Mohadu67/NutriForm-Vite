import React from 'react';
import style from '../NutritionPage.module.css';

export default function DateSelector({ selectedDate, onChange }) {
  const today = new Date().toISOString().split('T')[0];

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onChange(d.toISOString().split('T')[0]);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    if (next <= today) onChange(next);
  };

  const label = selectedDate === today
    ? "Aujourd'hui"
    : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(selectedDate));

  return (
    <div className={style.dateSelector}>
      <button onClick={goBack} className={style.dateArrow}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <span className={style.dateLabel}>{label}</span>
      <button onClick={goForward} className={style.dateArrow} disabled={selectedDate === today}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  );
}
