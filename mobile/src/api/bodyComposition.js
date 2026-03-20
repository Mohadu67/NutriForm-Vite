/**
 * Service API pour le suivi de composition corporelle
 */
import apiClient from './client';
import { endpoints } from './endpoints';
import logger from '../services/logger';

/**
 * Récupérer l'analyse de composition corporelle
 */
export async function getBodyCompositionSummary(days = 7) {
  try {
    const response = await apiClient.get(endpoints.bodyComposition.summary, { params: { days } });
    return { success: true, data: response.data };
  } catch (error) {
    logger.app.debug('[BODY COMP API] getSummary error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Logger un poids
 */
export async function logWeight(data) {
  try {
    const response = await apiClient.post(endpoints.bodyComposition.logWeight, data);
    return { success: true, data: response.data };
  } catch (error) {
    logger.app.debug('[BODY COMP API] logWeight error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Historique des pesées
 */
export async function getWeightHistory(days = 30) {
  try {
    const response = await apiClient.get(endpoints.bodyComposition.weightHistory, { params: { days } });
    return { success: true, data: response.data || [] };
  } catch (error) {
    logger.app.debug('[BODY COMP API] getWeightHistory error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Supprimer une pesée
 */
export async function deleteWeightLog(id) {
  try {
    await apiClient.delete(endpoints.bodyComposition.deleteWeight(id));
    return { success: true };
  } catch (error) {
    logger.app.debug('[BODY COMP API] deleteWeightLog error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Mettre à jour les mensurations
 */
export async function updateBodyMetrics(data) {
  try {
    const response = await apiClient.put(endpoints.bodyComposition.metrics, data);
    return { success: true, data: response.data };
  } catch (error) {
    logger.app.debug('[BODY COMP API] updateMetrics error:', error.message);
    return { success: false, error: error.message };
  }
}
