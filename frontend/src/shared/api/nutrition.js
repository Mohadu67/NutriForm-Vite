import client from './client';
import endpoints from './endpoints';

/**
 * Ajouter une entrée alimentaire manuelle
 */
export async function addFoodLog(data) {
  const response = await client.post(endpoints.nutrition.log, data);
  return response.data;
}

/**
 * Logger une recette préparée
 */
export async function logRecipe(data) {
  const response = await client.post(endpoints.nutrition.logRecipe, data);
  return response.data;
}

/**
 * Récupérer les entrées d'un jour
 */
export async function getDailyLogs(date) {
  const response = await client.get(endpoints.nutrition.daily(date));
  return response.data;
}

/**
 * Modifier une entrée
 */
export async function updateFoodLog(id, data) {
  const response = await client.put(endpoints.nutrition.updateLog(id), data);
  return response.data;
}

/**
 * Supprimer une entrée
 */
export async function deleteFoodLog(id) {
  const response = await client.delete(endpoints.nutrition.deleteLog(id));
  return response.data;
}

/**
 * Résumé journalier (consommé + brûlé + balance)
 */
export async function getDailySummary(date) {
  const response = await client.get(endpoints.nutrition.summaryDaily(date));
  return response.data;
}

/**
 * Résumé hebdomadaire (premium)
 */
export async function getWeeklySummary() {
  const response = await client.get(endpoints.nutrition.summaryWeekly);
  return response.data;
}

/**
 * Tendance mensuelle (premium)
 */
export async function getMonthlySummary() {
  const response = await client.get(endpoints.nutrition.summaryMonthly);
  return response.data;
}

/**
 * Récupérer les objectifs nutritionnels
 */
export async function getNutritionGoals() {
  const response = await client.get(endpoints.nutrition.goals);
  return response.data;
}

/**
 * Définir/modifier les objectifs nutritionnels
 */
export async function updateNutritionGoals(data) {
  const response = await client.put(endpoints.nutrition.goals, data);
  return response.data;
}

/**
 * Enregistrer les calories brûlées (saisie manuelle)
 */
export async function syncBurnedCalories(date, caloriesBurned) {
  const response = await client.post(endpoints.health.sync, {
    date,
    caloriesBurned,
    source: 'calculated',
  });
  return response.data;
}
