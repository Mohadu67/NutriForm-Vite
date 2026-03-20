import client from './client';
import endpoints from './endpoints';

/**
 * Récupérer l'analyse de composition corporelle
 * @param {number} days - Période en jours (7, 14, 30)
 */
export async function getBodyCompositionSummary(days = 7) {
  const response = await client.get(endpoints.bodyComposition.summary, { params: { days } });
  return response.data;
}

/**
 * Récupérer la tendance sur plusieurs semaines
 * @param {number} weeks - Nombre de semaines (1-12)
 */
export async function getBodyCompositionTrend(weeks = 4) {
  const response = await client.get(endpoints.bodyComposition.trend, { params: { weeks } });
  return response.data;
}

/**
 * Logger un poids
 */
export async function logWeight(data) {
  const response = await client.post(endpoints.bodyComposition.logWeight, data);
  return response.data;
}

/**
 * Historique des pesées
 * @param {number} days - Période en jours
 */
export async function getWeightHistory(days = 30) {
  const response = await client.get(endpoints.bodyComposition.weightHistory, { params: { days } });
  return response.data;
}

/**
 * Supprimer une pesée
 */
export async function deleteWeightLog(id) {
  const response = await client.delete(endpoints.bodyComposition.deleteWeight(id));
  return response.data;
}

/**
 * Mettre à jour les mensurations du profil
 */
export async function updateBodyMetrics(data) {
  const response = await client.put(endpoints.bodyComposition.metrics, data);
  return response.data;
}
