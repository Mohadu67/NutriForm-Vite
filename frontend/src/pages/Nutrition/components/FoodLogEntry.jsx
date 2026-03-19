import React from 'react';
import style from '../NutritionPage.module.css';

const MEAL_LABELS = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

export default function FoodLogEntry({ entry, onEdit, onDelete }) {
  return (
    <div className={style.logEntry} onClick={() => onEdit(entry)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onEdit(entry)}>
      <div className={style.logEntryMain}>
        <div className={style.logEntryInfo}>
          <span className={style.logEntryName}>{entry.name}</span>
          {entry.source === 'recipe' && (
            <span className={style.logEntryBadge}>Recette</span>
          )}
        </div>
        <span className={style.logEntryCal}>{entry.nutrition.calories} kcal</span>
      </div>
      <div className={style.logEntryMeta}>
        <span className={style.logEntryMacros}>
          P: {entry.nutrition.proteins}g · G: {entry.nutrition.carbs}g · L: {entry.nutrition.fats}g
        </span>
        <div className={style.logEntryActions}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className={style.logEntryBtn} title="Modifier">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(entry._id); }} className={`${style.logEntryBtn} ${style.logEntryBtnDanger}`} title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export { MEAL_LABELS };
