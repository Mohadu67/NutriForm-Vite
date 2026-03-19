import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { storage } from '../../../shared/utils/storage';
import style from '../NutritionPage.module.css';

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Perte de poids' },
  { value: 'maintenance', label: 'Maintien' },
  { value: 'muscle_gain', label: 'Prise de muscle' },
];

/**
 * Compute calories & macros from biometric data stored in localStorage.
 * Uses Mifflin-St Jeor formula — same as CaloriePage/FormCalorie.
 */
function computeFromCalculator() {
  const poids = parseFloat(storage.get('userPoids'));
  const taille = parseFloat(storage.get('userTaille'));
  const age = parseInt(storage.get('userAge'), 10);
  const sexe = storage.get('userSexe');
  const activite = storage.get('userActivite');

  if (!poids || !taille || !age || !sexe || !activite) return null;

  let tmb;
  if (sexe === 'homme') {
    tmb = 10 * poids + 6.25 * taille - 5 * age + 5;
  } else {
    tmb = 10 * poids + 6.25 * taille - 5 * age - 161;
  }

  const facteurs = { faible: 1.2, moyen: 1.55, actif: 1.75, tresactif: 1.9 };
  const calories = Math.round(tmb * (facteurs[activite] ?? 1.2));

  return {
    weight_loss: {
      calories: calories - 500,
      macros: {
        proteins: Math.round(((calories - 500) * 0.35) / 4),
        carbs: Math.round(((calories - 500) * 0.35) / 4),
        fats: Math.round(((calories - 500) * 0.30) / 9),
      },
    },
    maintenance: {
      calories,
      macros: {
        proteins: Math.round((calories * 0.25) / 4),
        carbs: Math.round((calories * 0.45) / 4),
        fats: Math.round((calories * 0.30) / 9),
      },
    },
    muscle_gain: {
      calories: calories + 500,
      macros: {
        proteins: Math.round(((calories + 500) * 0.30) / 4),
        carbs: Math.round(((calories + 500) * 0.45) / 4),
        fats: Math.round(((calories + 500) * 0.25) / 9),
      },
    },
  };
}

export default function NutritionGoalSetup({ isOpen, onClose, onSave, currentGoals }) {
  const [dailyCalories, setDailyCalories] = useState(2000);
  const [proteins, setProteins] = useState(150);
  const [carbs, setCarbs] = useState(250);
  const [fats, setFats] = useState(65);
  const [goal, setGoal] = useState('maintenance');
  const [calcData, setCalcData] = useState(null);

  useEffect(() => {
    if (currentGoals) {
      setDailyCalories(currentGoals.dailyCalories || 2000);
      setProteins(currentGoals.macros?.proteins || 150);
      setCarbs(currentGoals.macros?.carbs || 250);
      setFats(currentGoals.macros?.fats || 65);
      setGoal(currentGoals.goal || 'maintenance');
    }
  }, [currentGoals, isOpen]);

  // Check if calculator data is available
  useEffect(() => {
    if (isOpen) {
      setCalcData(computeFromCalculator());
    }
  }, [isOpen]);

  const importFromCalc = useCallback(() => {
    if (!calcData) return;
    const data = calcData[goal];
    if (data) {
      setDailyCalories(data.calories);
      setProteins(data.macros.proteins);
      setCarbs(data.macros.carbs);
      setFats(data.macros.fats);
    }
  }, [calcData, goal]);

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

          {calcData && (
            <button type="button" onClick={importFromCalc} className={style.importBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 17 4 4 4-4" />
              </svg>
              Importer depuis le calculateur calorique
            </button>
          )}

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
