/**
 * Service API pour les exercices
 */
import apiClient from './client';
import { endpoints } from './endpoints';

/**
 * Recuperer tous les exercices avec filtres optionnels
 * @param {Object} params - Parametres de filtrage
 * @param {string} params.q - Recherche textuelle
 * @param {string} params.category - Categorie (muscu, cardio, etc.)
 * @param {string[]} params.muscles - Muscles cibles
 * @param {string[]} params.equipment - Equipements
 * @param {string} params.difficulty - Niveau (debutant, intermediaire, avance)
 * @param {string[]} params.type - Types (muscu, poids-du-corps, etc.)
 * @param {number} params.limit - Nombre max de resultats
 * @param {number} params.page - Page pour pagination
 */
export async function getExercises(params = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    // Arrays
    if (params.muscles?.length) {
      queryParams.append('muscles', params.muscles.join(','));
    }
    if (params.equipment?.length) {
      queryParams.append('equipment', params.equipment.join(','));
    }
    if (params.type?.length) {
      queryParams.append('type', params.type.join(','));
    }

    const url = `${endpoints.exercises.list}?${queryParams.toString()}`;
    const response = await apiClient.get(url);

    return {
      success: true,
      data: response.data?.data || [],
      pagination: response.data?.pagination || {},
    };
  } catch (error) {
    console.log('[EXERCISES API] Get error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recuperer un exercice par ID ou slug
 */
export async function getExercise(idOrSlug) {
  try {
    const response = await apiClient.get(endpoints.exercises.byId(idOrSlug));
    return {
      success: true,
      data: response.data?.data || null,
    };
  } catch (error) {
    console.log('[EXERCISES API] Get one error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Recuperer les exercices par categorie
 */
export async function getExercisesByCategory(category, limit = 50) {
  try {
    const response = await apiClient.get(`${endpoints.exercises.byCategory(category)}?limit=${limit}`);
    return {
      success: true,
      data: response.data?.data || [],
    };
  } catch (error) {
    console.log('[EXERCISES API] Get by category error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recuperer les exercices par muscle
 */
export async function getExercisesByMuscle(muscle, limit = 50) {
  try {
    const response = await apiClient.get(`${endpoints.exercises.byMuscle(muscle)}?limit=${limit}`);
    return {
      success: true,
      data: response.data?.data || [],
    };
  } catch (error) {
    console.log('[EXERCISES API] Get by muscle error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recuperer les categories disponibles
 */
export async function getCategories() {
  try {
    const response = await apiClient.get(endpoints.exercises.categories);
    return {
      success: true,
      data: response.data?.data || [],
    };
  } catch (error) {
    console.log('[EXERCISES API] Get categories error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recuperer les muscles disponibles
 */
export async function getMuscles() {
  try {
    const response = await apiClient.get(endpoints.exercises.muscles);
    return {
      success: true,
      data: response.data?.data || [],
    };
  } catch (error) {
    console.log('[EXERCISES API] Get muscles error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recuperer les exercices populaires
 */
export async function getPopularExercises(limit = 10) {
  try {
    const response = await apiClient.get(`${endpoints.exercises.popular}?limit=${limit}`);
    return {
      success: true,
      data: response.data?.data || [],
    };
  } catch (error) {
    console.log('[EXERCISES API] Get popular error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

export default {
  getExercises,
  getExercise,
  getExercisesByCategory,
  getExercisesByMuscle,
  getCategories,
  getMuscles,
  getPopularExercises,
};
