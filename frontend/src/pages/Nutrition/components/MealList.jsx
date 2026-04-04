import React from 'react';
import FoodLogEntry, { MEAL_LABELS } from './FoodLogEntry';
import { SunriseIcon, SunFullIcon, MoonIcon, AppleIcon } from './NutritionIcons';
import style from '../NutritionPage.module.css';

const MEAL_ICONS = {
  breakfast: { Icon: SunriseIcon, color: '#f0a47a' },
  lunch:     { Icon: SunFullIcon, color: '#72baa1' },
  dinner:    { Icon: MoonIcon,    color: '#5a9e87' },
  snack:     { Icon: AppleIcon,   color: '#c9a88c' },
};

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealList({ entries, onEdit, onDelete, onAdd }) {
  const grouped = {};
  for (const type of MEAL_ORDER) {
    grouped[type] = entries.filter(e => e.mealType === type);
  }

  return (
    <div className={style.mealList}>
      <h3 className={style.sectionTitle}>Mes repas</h3>
      {MEAL_ORDER.map((type) => {
        const items = grouped[type];
        const total = items.reduce((s, e) => s + (e.nutrition.calories || 0), 0);
        const { Icon, color } = MEAL_ICONS[type];

        return (
          <div key={type} className={style.mealGroup}>
            <div className={style.mealGroupHeader}>
              <div className={style.mealGroupTitle}>
                <span className={style.mealGroupIcon} style={{ color }}>
                  <Icon size={18} />
                </span>
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
