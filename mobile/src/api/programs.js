/**
 * Service API pour les programmes d'entraînement
 */
import apiClient from './client';
import { endpoints } from './endpoints';

/**
 * Récupérer les programmes publics avec filtres optionnels
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.q - Recherche textuelle
 * @param {string} params.type - Type de programme (hiit, circuit, tabata, etc.)
 * @param {string} params.difficulty - Niveau (débutant, intermédiaire, avancé)
 * @param {string[]} params.muscleGroups - Groupes musculaires ciblés
 * @param {string[]} params.equipment - Équipement requis
 * @param {number} params.limit - Nombre max de résultats
 * @param {number} params.skip - Nombre à sauter (pagination)
 */
export async function getPublicPrograms(params = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.append('q', params.q);
    if (params.type) queryParams.append('type', params.type);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.skip) queryParams.append('skip', params.skip);

    // Arrays
    if (params.muscleGroups?.length) {
      queryParams.append('muscleGroups', params.muscleGroups.join(','));
    }
    if (params.equipment?.length) {
      queryParams.append('equipment', params.equipment.join(','));
    }
    if (params.tags?.length) {
      queryParams.append('tags', params.tags.join(','));
    }

    const url = `${endpoints.programs.public}?${queryParams.toString()}`;
    console.log('[PROGRAMS API] Calling GET:', url);
    const response = await apiClient.get(url);
    console.log('[PROGRAMS API] Response:', { status: response.status, dataCount: response.data?.programs?.length });

    return {
      success: true,
      data: response.data?.programs || [],
      pagination: response.data?.pagination || {},
    };
  } catch (error) {
    console.log('[PROGRAMS API] Get public error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer un programme par ID
 */
export async function getProgram(id) {
  try {
    const response = await apiClient.get(endpoints.programs.byId(id));
    return {
      success: true,
      data: response.data?.program || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Get one error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Récupérer mes programmes (premium)
 */
export async function getMyPrograms() {
  try {
    const response = await apiClient.get(endpoints.programs.myPrograms);
    return {
      success: true,
      data: response.data?.programs || [],
    };
  } catch (error) {
    console.log('[PROGRAMS API] Get my programs error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer les programmes favoris (premium)
 */
export async function getFavorites() {
  try {
    const response = await apiClient.get(endpoints.programs.favorites);
    return {
      success: true,
      data: response.data?.programs || [],
    };
  } catch (error) {
    console.log('[PROGRAMS API] Get favorites error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer l'historique des sessions (premium)
 * @param {Object} params - Paramètres de pagination
 * @param {number} params.limit - Nombre max de résultats
 * @param {number} params.skip - Nombre à sauter
 */
export async function getSessionHistory(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.skip) queryParams.append('skip', params.skip);

    const url = `${endpoints.programs.history}?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    return {
      success: true,
      data: response.data?.sessions || [],
      stats: response.data?.stats || {},
      pagination: response.data?.pagination || {},
    };
  } catch (error) {
    console.log('[PROGRAMS API] Get history error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Créer un programme (premium)
 */
export async function createProgram(programData) {
  try {
    const response = await apiClient.post(endpoints.programs.create, programData);
    return {
      success: true,
      data: response.data?.program || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Create error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Mettre à jour un programme (premium)
 */
export async function updateProgram(id, programData) {
  try {
    const response = await apiClient.patch(endpoints.programs.update(id), programData);
    return {
      success: true,
      data: response.data?.program || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Update error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Supprimer un programme (premium)
 */
export async function deleteProgram(id) {
  try {
    await apiClient.delete(endpoints.programs.delete(id));
    return { success: true };
  } catch (error) {
    console.log('[PROGRAMS API] Delete error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Démarrer une session d'entraînement (premium)
 */
export async function startProgram(id) {
  try {
    const response = await apiClient.post(endpoints.programs.start(id));
    return {
      success: true,
      data: response.data || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Start error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Enregistrer une session terminée (premium)
 * @param {string} id - ID du programme
 * @param {Object} sessionData - Données de la session
 * @param {number} sessionData.cyclesCompleted - Nombre de cycles complétés
 * @param {number} sessionData.durationSec - Durée totale en secondes
 * @param {number} sessionData.calories - Calories brûlées
 * @param {Array} sessionData.entries - Détails des exercices
 */
export async function recordCompletion(id, sessionData) {
  try {
    const response = await apiClient.post(endpoints.programs.recordCompletion(id), sessionData);
    return {
      success: true,
      data: response.data || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Record completion error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Noter un programme (premium)
 * @param {string} id - ID du programme
 * @param {number} rating - Note de 1 à 5
 */
export async function rateProgram(id, rating) {
  try {
    const response = await apiClient.post(endpoints.programs.rate(id), { rating });
    return {
      success: true,
      data: response.data || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Rate error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle favori sur un programme (premium)
 */
export async function toggleFavorite(id) {
  try {
    const response = await apiClient.post(endpoints.programs.favorite(id));
    return {
      success: true,
      data: response.data || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Toggle favorite error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Proposer un programme au public (premium)
 */
export async function proposeToPublic(id) {
  try {
    const response = await apiClient.post(endpoints.programs.propose(id));
    return {
      success: true,
      data: response.data || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Propose error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Retirer un programme du public (premium)
 */
export async function unpublishProgram(id) {
  try {
    const response = await apiClient.post(endpoints.programs.unpublish(id));
    return {
      success: true,
      data: response.data || null,
    };
  } catch (error) {
    console.log('[PROGRAMS API] Unpublish error:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  getPublicPrograms,
  getProgram,
  getMyPrograms,
  getFavorites,
  getSessionHistory,
  createProgram,
  updateProgram,
  deleteProgram,
  startProgram,
  recordCompletion,
  rateProgram,
  toggleFavorite,
  proposeToPublic,
  unpublishProgram,
};
