/**
 * Service API pour l'historique (calculs IMC, calories, etc.)
 */
import apiClient from './client';
import { endpoints } from './endpoints';

/**
 * Ajouter une entree dans l'historique
 * @param {string} action - Type d'action (IMC_CALC, CALORIE_CALC, RM_CALC, FC_MAX_CALC, etc.)
 * @param {Object} meta - Donnees associees
 */
export async function addHistory(action, meta) {
  try {
    const response = await apiClient.post(endpoints.history.add, {
      action,
      meta,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.log('[HISTORY API] Add error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Recuperer l'historique de l'utilisateur
 */
export async function getHistory() {
  try {
    const response = await apiClient.get(endpoints.history.list);

    return {
      success: true,
      data: response.data || [],
    };
  } catch (error) {
    console.log('[HISTORY API] Get error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recuperer le resume de l'utilisateur (stats dashboard)
 */
export async function getUserSummary() {
  try {
    const response = await apiClient.get(endpoints.history.summary);

    return {
      success: true,
      data: response.data || {},
    };
  } catch (error) {
    console.log('[HISTORY API] Get summary error:', error.message);
    return { success: false, data: {}, error: error.message };
  }
}

/**
 * Sauvegarder un calcul IMC
 */
export async function saveIMCCalc(data) {
  return addHistory('IMC_CALC', {
    imc: data.imc,
    poids: data.poids,
    taille: data.taille,
    categorie: data.categorie,
    poidsIdealMin: data.poidsIdealMin,
    poidsIdealMax: data.poidsIdealMax,
  });
}

/**
 * Sauvegarder un calcul de calories
 */
export async function saveCalorieCalc(data) {
  return addHistory('CALORIE_CALC', {
    tmb: data.tmb,
    maintenance: data.maintenance,
    objectif: data.objectif,
    calories: data.calories,
    calorie: data.calories, // alias utilise par le backend
    dailyCalories: data.calories, // autre alias
    macros: data.macros,
    sexe: data.sexe,
    age: data.age,
    poids: data.poids,
    taille: data.taille,
    activite: data.activite,
  });
}

/**
 * Sauvegarder un calcul 1RM
 */
export async function saveRMCalc(data) {
  return addHistory('RM_CALC', {
    rm: data.rm,
    exercice: data.exercice,
    poidsSouleve: data.poidsSouleve,
    reps: data.reps,
    percentages: data.percentages,
  });
}

/**
 * Sauvegarder un calcul FC Max
 */
export async function saveFCMaxCalc(data) {
  return addHistory('FC_MAX_CALC', {
    fcMax: data.fcMax,
    fcMaxTanaka: data.fcMaxTanaka,
    age: data.age,
    zones: data.zones,
  });
}

export default {
  addHistory,
  getHistory,
  getUserSummary,
  saveIMCCalc,
  saveCalorieCalc,
  saveRMCalc,
  saveFCMaxCalc,
};
