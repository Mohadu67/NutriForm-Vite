import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import style from '../NutritionPage.module.css';

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Perte de poids' },
  { value: 'maintenance', label: 'Maintien' },
  { value: 'muscle_gain', label: 'Prise de muscle' },
];

export default function NutritionGoalSetup({ isOpen, onClose, onSave, currentGoals }) {
  const [dailyCalories, setDailyCalories] = useState(2000);
  const [proteins, setProteins] = useState(150);
  const [carbs, setCarbs] = useState(250);
  const [fats, setFats] = useState(65);
  const [goal, setGoal] = useState('maintenance');

  useEffect(() => {
    if (currentGoals) {
      setDailyCalories(currentGoals.dailyCalories || 2000);
      setProteins(currentGoals.macros?.proteins || 150);
      setCarbs(currentGoals.macros?.carbs || 250);
      setFats(currentGoals.macros?.fats || 65);
      setGoal(currentGoals.goal || 'maintenance');
    }
  }, [currentGoals, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      dailyCalories,
      macros: { proteins, carbs, fats },
      goal,
    });
    onClose();
  };

  return createPortal(
    <div className={style.modalOverlay} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        <div className={style.modalHeader}>
          <h3>Objectifs nutritionnels</h3>
          <button onClick={onClose} className={style.modalClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className={style.modalForm}>
          <div className={style.formGroup}>
            <label>Objectif</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className={style.formGroup}>
            <label>Calories journalières (kcal)</label>
            <input type="number" value={dailyCalories} onChange={(e) => setDailyCalories(Number(e.target.value))} min={500} max={10000} required />
          </div>
          <div className={style.formRow}>
            <div className={style.formGroup}>
              <label>Protéines (g)</label>
              <input type="number" value={proteins} onChange={(e) => setProteins(Number(e.target.value))} min={0} />
            </div>
            <div className={style.formGroup}>
              <label>Glucides (g)</label>
              <input type="number" value={carbs} onChange={(e) => setCarbs(Number(e.target.value))} min={0} />
            </div>
            <div className={style.formGroup}>
              <label>Lipides (g)</label>
              <input type="number" value={fats} onChange={(e) => setFats(Number(e.target.value))} min={0} />
            </div>
          </div>
          <div className={style.modalActions}>
            <button type="button" onClick={onClose} className={style.btnSecondary}>Annuler</button>
            <button type="submit" className={style.btnPrimary}>Enregistrer</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
