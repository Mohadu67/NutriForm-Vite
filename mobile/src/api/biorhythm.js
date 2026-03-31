/**
 * Service API pour le biorythme (sommeil, readiness, HRV)
 */
import apiClient from './client';
import { endpoints } from './endpoints';

/**
 * Synchroniser les donnees de sommeil depuis le telephone
 */
export async function syncSleepData(data) {
  try {
    const response = await apiClient.post(endpoints.biorhythm.syncSleep, data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('[BIORHYTHM API] syncSleepData error:', error.message);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Recuperer le score de readiness pour une date
 */
export async function getReadinessScore(date) {
  try {
    const response = await apiClient.get(endpoints.biorhythm.readiness, { params: { date } });
    return { success: true, data: response.data };
  } catch (error) {
    console.log('[BIORHYTHM API] getReadinessScore error:', error.message);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Recuperer l'historique de readiness
 */
export async function getReadinessHistory(days = 7) {
  try {
    const response = await apiClient.get(endpoints.biorhythm.readinessHistory, { params: { days } });
    return { success: true, data: response.data };
  } catch (error) {
    console.log('[BIORHYTHM API] getReadinessHistory error:', error.message);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Recuperer les donnees de sommeil pour une date
 */
export async function getSleepData(date) {
  try {
    const response = await apiClient.get(endpoints.biorhythm.sleep(date));
    return { success: true, data: response.data };
  } catch (error) {
    console.log('[BIORHYTHM API] getSleepData error:', error.message);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Recuperer l'historique de sommeil
 */
export async function getSleepHistory(days = 7) {
  try {
    const response = await apiClient.get(endpoints.biorhythm.sleepHistory, { params: { days } });
    return { success: true, data: response.data };
  } catch (error) {
    console.log('[BIORHYTHM API] getSleepHistory error:', error.message);
    return { success: false, error: error.message, data: null };
  }
}
