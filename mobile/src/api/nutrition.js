/**
 * Service API pour le suivi nutritionnel
 */
import apiClient from './client';
import { endpoints } from './endpoints';
import logger from '../services/logger';

/**
 * Ajouter une entrée alimentaire manuelle
 */
export async function addFoodLog(data) {
  try {
    logger.app.debug('[NUTRITION API] addFoodLog:', data);
    const response = await apiClient.post(endpoints.nutrition.log, data);
    return { success: true, data: response.data?.foodLog || null };
  } catch (error) {
    logger.app.debug('[NUTRITION API] addFoodLog error:', error.message);
    return { success: false, error: error.response?.data?.message || error.message, errorData: error.response?.data };
  }
}

/**
 * Logger une recette préparée
 */
export async function logRecipe(data) {
  try {
    logger.app.debug('[NUTRITION API] logRecipe:', data);
    const response = await apiClient.post(endpoints.nutrition.logRecipe, data);
    return { success: true, data: response.data?.foodLog || null };
  } catch (error) {
    logger.app.debug('[NUTRITION API] logRecipe error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer les entrées d'un jour
 */
export async function getDailyLogs(date) {
  try {
    const response = await apiClient.get(endpoints.nutrition.daily(date));
    return { success: true, data: response.data?.logs || [] };
  } catch (error) {
    logger.app.debug('[NUTRITION API] getDailyLogs error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Modifier une entrée
 */
export async function updateFoodLog(id, data) {
  try {
    const response = await apiClient.put(endpoints.nutrition.updateLog(id), data);
    return { success: true, data: response.data?.foodLog || null };
  } catch (error) {
    logger.app.debug('[NUTRITION API] updateFoodLog error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Supprimer une entrée
 */
export async function deleteFoodLog(id) {
  try {
    await apiClient.delete(endpoints.nutrition.deleteLog(id));
    return { success: true };
  } catch (error) {
    logger.app.debug('[NUTRITION API] deleteFoodLog error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Résumé journalier
 */
export async function getDailySummary(date) {
  try {
    const response = await apiClient.get(endpoints.nutrition.summaryDaily(date));
    return { success: true, data: response.data || {} };
  } catch (error) {
    logger.app.debug('[NUTRITION API] getDailySummary error:', error.message);
    return { success: false, data: {}, error: error.message };
  }
}

/**
 * Résumé hebdomadaire (premium)
 */
export async function getWeeklySummary() {
  try {
    const response = await apiClient.get(endpoints.nutrition.summaryWeekly);
    return { success: true, data: response.data || {} };
  } catch (error) {
    logger.app.debug('[NUTRITION API] getWeeklySummary error:', error.message);
    return { success: false, data: {}, error: error.message };
  }
}

/**
 * Tendance mensuelle (premium)
 */
export async function getMonthlySummary() {
  try {
    const response = await apiClient.get(endpoints.nutrition.summaryMonthly);
    return { success: true, data: response.data || {} };
  } catch (error) {
    logger.app.debug('[NUTRITION API] getMonthlySummary error:', error.message);
    return { success: false, data: {}, error: error.message };
  }
}

/**
 * Récupérer les objectifs nutritionnels
 */
export async function getNutritionGoals() {
  try {
    const response = await apiClient.get(endpoints.nutrition.goals);
    return { success: true, data: response.data?.goals || null };
  } catch (error) {
    logger.app.debug('[NUTRITION API] getNutritionGoals error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Définir/modifier les objectifs nutritionnels
 */
export async function updateNutritionGoals(data) {
  try {
    const response = await apiClient.put(endpoints.nutrition.goals, data);
    return { success: true, data: response.data?.goals || null };
  } catch (error) {
    logger.app.debug('[NUTRITION API] updateNutritionGoals error:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  addFoodLog,
  logRecipe,
  getDailyLogs,
  updateFoodLog,
  deleteFoodLog,
  getDailySummary,
  getWeeklySummary,
  getMonthlySummary,
  getNutritionGoals,
  updateNutritionGoals,
};
