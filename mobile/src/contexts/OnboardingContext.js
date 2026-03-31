import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { storage } from '../services/storageService';

const OnboardingContext = createContext(null);

const PENDING_DATA_KEY = 'onboarding_pending_data';

const initialState = {
  objective: null,
  gender: null,
  birthYear: null,
  height: null,
  weight: null,
  targetWeight: null,
  activityLevel: null,
  healthConcerns: [],
  dietPreference: null,
  eatingWindow: { start: '08:00', end: '18:00' },
  weightLossPace: 0.5,
  willingnessActions: [],
  // Resultat calcule localement pour l'ecran final
  plan: null,
  isSubmitting: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_DATA':
      return { ...state, ...action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload, error: null };
    case 'SET_PLAN':
      return { ...state, plan: action.payload, isSubmitting: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isSubmitting: false };
    default:
      return state;
  }
}

/**
 * Calcule le plan nutritionnel localement (meme formules que le backend)
 */
function computePlan(data) {
  const { weight, height, gender, birthYear, activityLevel, objective, targetWeight, weightLossPace, eatingWindow } = data;
  const w = weight || 70;
  const h = height || 170;
  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - birthYear : 25;

  // BMR Mifflin-St Jeor
  const bmr = gender === 'female'
    ? 10 * w + 6.25 * h - 5 * age - 161
    : 10 * w + 6.25 * h - 5 * age + 5;

  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = bmr * (multipliers[activityLevel] || 1.375);

  const pace = weightLossPace || 0.5;
  const weeklyDeficit = pace * 1100;
  let dailyCalories;
  if (objective === 'weight_loss') {
    dailyCalories = Math.max(1200, Math.round(tdee - weeklyDeficit / 7));
  } else if (objective === 'stay_fit') {
    dailyCalories = Math.round(tdee + 200);
  } else {
    dailyCalories = Math.round(tdee);
  }

  // Macros
  let pR, cR, fR;
  if (objective === 'weight_loss') { pR = 0.35; cR = 0.35; fR = 0.30; }
  else if (objective === 'stay_fit') { pR = 0.30; cR = 0.45; fR = 0.25; }
  else { pR = 0.30; cR = 0.40; fR = 0.30; }

  const macros = {
    proteins: Math.round((dailyCalories * pR) / 4),
    carbs: Math.round((dailyCalories * cR) / 4),
    fats: Math.round((dailyCalories * fR) / 9),
  };

  const bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(1));
  const hydration = Math.round(w * 30);

  // Date cible
  let targetDate = null;
  const tw = targetWeight || w;
  if (objective === 'weight_loss' && tw < w) {
    const weeks = (w - tw) / pace;
    const d = new Date();
    d.setDate(d.getDate() + Math.round(weeks * 7));
    targetDate = d.toISOString().split('T')[0];
  }

  const weightToLose = objective === 'weight_loss' ? parseFloat((w - tw).toFixed(1)) : 0;
  const weightLossPercent = objective === 'weight_loss' && tw < w
    ? parseFloat((((w - tw) / w) * 100).toFixed(1))
    : 0;

  // Jeune
  let fastingHours = null;
  let eatingHours = null;
  if (eatingWindow?.start && eatingWindow?.end) {
    const [sh, sm] = eatingWindow.start.split(':').map(Number);
    const [eh, em] = eatingWindow.end.split(':').map(Number);
    eatingHours = (eh + em / 60) - (sh + sm / 60);
    if (eatingHours < 0) eatingHours += 24;
    fastingHours = 24 - eatingHours;
    fastingHours = Math.round(fastingHours);
    eatingHours = Math.round(eatingHours);
  }

  return {
    dailyCalories, macros, bmi, hydration,
    targetDate, weightToLose, weightLossPercent,
    fastingHours, eatingHours,
  };
}

export function OnboardingProvider({ children, onDone }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const updateData = useCallback((data) => {
    dispatch({ type: 'UPDATE_DATA', payload: data });
  }, []);

  /**
   * Calcule le plan localement et sauvegarde les donnees en AsyncStorage
   * pour envoi au backend apres login
   */
  const submitOnboarding = useCallback(async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const plan = computePlan(state);
      dispatch({ type: 'SET_PLAN', payload: plan });

      // Sauvegarder les donnees en attente pour envoi au backend apres login
      const pendingData = {
        objective: state.objective,
        gender: state.gender,
        birthYear: state.birthYear,
        height: state.height,
        weight: state.weight,
        targetWeight: state.targetWeight,
        activityLevel: state.activityLevel,
        healthConcerns: state.healthConcerns,
        dietPreference: state.dietPreference,
        eatingWindow: state.eatingWindow,
        weightLossPace: state.weightLossPace,
        willingnessActions: state.willingnessActions,
      };
      await storage.set(PENDING_DATA_KEY, pendingData);

      return plan;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du calcul' });
      throw error;
    }
  }, [state]);

  /**
   * Termine l'onboarding : marque comme vu dans AsyncStorage
   */
  const finishOnboarding = useCallback(async () => {
    onDone?.();
  }, [onDone]);

  return (
    <OnboardingContext.Provider value={{
      data: state,
      updateData,
      submitOnboarding,
      finishOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding doit être utilisé dans un OnboardingProvider');
  }
  return context;
}

/**
 * Récupère les données d'onboarding en attente (appelé après login)
 */
export async function getPendingOnboardingData() {
  return await storage.get(PENDING_DATA_KEY);
}

/**
 * Supprime les données d'onboarding en attente (après envoi au backend)
 */
export async function clearPendingOnboardingData() {
  await storage.remove(PENDING_DATA_KEY);
}
