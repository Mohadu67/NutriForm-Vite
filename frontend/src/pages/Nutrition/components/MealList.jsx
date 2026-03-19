import React from 'react';
import FoodLogEntry, { MEAL_LABELS } from './FoodLogEntry';
import style from '../NutritionPage.module.css';

const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealList({ entries, onEdit, onDelete, onAdd }) {
  const grouped = {};
  for (const type of MEAL_ORDER) {
    grouped[type] = entries.filter(e => e.mealType === type);
  }

  return (
    <div className={style.mealList}>
      {MEAL_ORDER.map((type) => {
        const items = grouped[type];
        const total = items.reduce((s, e) => s + (e.nutrition.calories || 0), 0);

        return (
          <div key={type} className={style.mealGroup}>
            <div className={style.mealGroupHeader}>
              <div className={style.mealGroupTitle}>
                <span>{MEAL_ICONS[type]}</span>
                <span>{MEAL_LABELS[type]}</span>
                {total > 0 && <span className={style.mealGroupCal}>{total} kcal</span>}
              </div>
              <button onClick={() => onAdd(type)} className={style.mealAddBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            {items.length > 0 && (
              <div className={style.mealGroupEntries}>
                {items.map((entry) => (
                  <FoodLogEntry
                    key={entry._id}
                    entry={entry}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
