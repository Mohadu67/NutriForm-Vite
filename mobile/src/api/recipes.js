/**
 * Service API pour les recettes
 */
import apiClient from './client';
import { endpoints } from './endpoints';

/**
 * Récupérer toutes les recettes avec filtres optionnels
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.q - Recherche textuelle
 * @param {string} params.difficulty - Niveau (facile, moyen, difficile)
 * @param {number} params.cookingTime - Temps de cuisson max
 * @param {string[]} params.cuisine - Types de cuisine
 * @param {string[]} params.dietaryRestrictions - Restrictions alimentaires
 * @param {string[]} params.mealType - Types de repas
 * @param {number} params.limit - Nombre max de résultats
 * @param {number} params.page - Page pour pagination
 */
export async function getRecipes(params = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.append('q', params.q);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.cookingTime) queryParams.append('cookingTime', params.cookingTime);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    // Arrays
    if (params.cuisine?.length) {
      queryParams.append('cuisine', params.cuisine.join(','));
    }
    if (params.dietaryRestrictions?.length) {
      queryParams.append('dietaryRestrictions', params.dietaryRestrictions.join(','));
    }
    if (params.mealType?.length) {
      queryParams.append('mealType', params.mealType.join(','));
    }

    const url = `${endpoints.recipes.list}?${queryParams.toString()}`;
    console.log('[RECIPES API] Calling GET:', url);
    const response = await apiClient.get(url);
    console.log('[RECIPES API] Response:', { status: response.status, dataCount: response.data?.recipes?.length });

    return {
      success: true,
      data: response.data?.recipes || [],
      pagination: response.data?.pagination || {},
    };
  } catch (error) {
    console.log('[RECIPES API] Get error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer une recette par ID
 */
export async function getRecipe(id) {
  try {
    const response = await apiClient.get(endpoints.recipes.byId(id));
    return {
      success: true,
      data: response.data?.recipe || null,
    };
  } catch (error) {
    console.log('[RECIPES API] Get one error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Récupérer les recettes vedettes
 */
export async function getFeaturedRecipes(limit = 10) {
  try {
    const response = await apiClient.get(`${endpoints.recipes.featured}?limit=${limit}`);
    return {
      success: true,
      data: response.data?.recipes || [],
    };
  } catch (error) {
    console.log('[RECIPES API] Get featured error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer les recettes tendances
 */
export async function getTrendingRecipes(limit = 10) {
  try {
    const response = await apiClient.get(`${endpoints.recipes.trending}?limit=${limit}`);
    return {
      success: true,
      data: response.data?.recipes || [],
    };
  } catch (error) {
    console.log('[RECIPES API] Get trending error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer les suggestions personnalisées (auth)
 */
export async function getSuggestedRecipes(limit = 10) {
  try {
    const response = await apiClient.get(`${endpoints.recipes.suggestions}?limit=${limit}`);
    return {
      success: true,
      data: response.data?.recipes || [],
    };
  } catch (error) {
    console.log('[RECIPES API] Get suggestions error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer les recettes likées (auth)
 */
export async function getLikedRecipes() {
  try {
    const response = await apiClient.get(endpoints.recipes.liked);
    return {
      success: true,
      data: response.data?.recipes || [],
    };
  } catch (error) {
    console.log('[RECIPES API] Get liked error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer les recettes sauvegardées (premium)
 */
export async function getSavedRecipes() {
  try {
    const response = await apiClient.get(endpoints.recipes.saved);
    return {
      success: true,
      data: response.data?.recipes || [],
    };
  } catch (error) {
    console.log('[RECIPES API] Get saved error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Récupérer mes recettes (premium)
 */
export async function getMyRecipes() {
  try {
    const response = await apiClient.get(endpoints.recipes.myRecipes);
    return {
      success: true,
      data: response.data?.recipes || [],
    };
  } catch (error) {
    console.log('[RECIPES API] Get my recipes error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Créer une recette (premium)
 */
export async function createRecipe(recipeData) {
  try {
    const response = await apiClient.post(endpoints.recipes.create, recipeData);
    return {
      success: true,
      data: response.data?.recipe || null,
    };
  } catch (error) {
    console.log('[RECIPES API] Create error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Mettre à jour une recette (premium)
 */
export async function updateRecipe(id, recipeData) {
  try {
    const response = await apiClient.put(endpoints.recipes.update(id), recipeData);
    return {
      success: true,
      data: response.data?.recipe || null,
    };
  } catch (error) {
    console.log('[RECIPES API] Update error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Supprimer une recette (premium)
 */
export async function deleteRecipe(id) {
  try {
    await apiClient.delete(endpoints.recipes.delete(id));
    return { success: true };
  } catch (error) {
    console.log('[RECIPES API] Delete error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle like sur une recette (auth)
 */
export async function toggleLikeRecipe(id) {
  try {
    const response = await apiClient.post(endpoints.recipes.like(id));
    return {
      success: true,
      data: response.data?.data || null,
    };
  } catch (error) {
    console.log('[RECIPES API] Toggle like error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sauvegarder une recette (premium)
 */
export async function saveRecipe(id) {
  try {
    const response = await apiClient.post(endpoints.recipes.save(id));
    return {
      success: true,
      data: response.data?.data || null,
    };
  } catch (error) {
    console.log('[RECIPES API] Save error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Proposer une recette au public (premium)
 */
export async function proposeRecipe(id) {
  try {
    const response = await apiClient.post(endpoints.recipes.propose(id));
    return {
      success: true,
      data: response.data?.data || null,
    };
  } catch (error) {
    console.log('[RECIPES API] Propose error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Retirer une recette du public (premium)
 */
export async function unpublishRecipe(id) {
  try {
    const response = await apiClient.post(endpoints.recipes.unpublish(id));
    return {
      success: true,
      data: response.data?.data || null,
    };
  } catch (error) {
    console.log('[RECIPES API] Unpublish error:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  getRecipes,
  getRecipe,
  getFeaturedRecipes,
  getTrendingRecipes,
  getSuggestedRecipes,
  getLikedRecipes,
  getSavedRecipes,
  getMyRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleLikeRecipe,
  saveRecipe,
  proposeRecipe,
  unpublishRecipe,
};
