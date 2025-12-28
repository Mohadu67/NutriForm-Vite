import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as recipesApi from '../api/recipes';
import { useAuth } from './AuthContext';

const RecipeContext = createContext();

const FAVORITES_KEY = '@recipe_favorites';
const SAVED_KEY = '@recipe_saved';

export function RecipeProvider({ children }) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [saved, setSaved] = useState([]);
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionTier, setSubscriptionTier] = useState(null);

  // Check premium from user directly OR fetch from API
  const isPremium = user?.isPremium || user?.subscriptionTier === 'premium' || subscriptionTier === 'premium' || user?.role === 'admin';

  // Fetch subscription status from API if not in user object
  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (!user) {
        setSubscriptionTier(null);
        return;
      }

      // If user already has subscription info, use it
      if (user.subscriptionTier) {
        setSubscriptionTier(user.subscriptionTier);
        return;
      }

      // Otherwise, fetch from API
      try {
        const apiClient = require('../api/client').default;
        const response = await apiClient.get('/subscriptions/status');
        if (response.data?.tier) {
          setSubscriptionTier(response.data.tier);
          console.log('[RecipeContext] Fetched subscription tier:', response.data.tier);
        }
      } catch (err) {
        console.error('[RecipeContext] Error fetching subscription:', err);
      }
    }

    fetchSubscriptionStatus();
  }, [user]);

  // Debug log
  useEffect(() => {
    console.log('[RecipeContext] Premium check:', {
      hasUser: !!user,
      email: user?.email,
      subscriptionTier: user?.subscriptionTier,
      isPremium: user?.isPremium,
      tier: user?.subscriptionTier || subscriptionTier,
      isPremiumFinal: isPremium,
    });
  }, [user, isPremium, subscriptionTier]);

  /**
   * Charger les favoris depuis AsyncStorage
   */
  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.error('[RecipeContext] Load favorites error:', err);
    }
  }, []);

  /**
   * Charger les recettes sauvegardées depuis AsyncStorage
   */
  const loadSaved = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_KEY);
      if (stored) {
        setSaved(JSON.parse(stored));
      }
    } catch (err) {
      console.error('[RecipeContext] Load saved error:', err);
    }
  }, []);

  /**
   * Charger les recettes avec filtres
   */
  const fetchRecipes = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[RecipeContext] Fetching recipes with params:', params);
      const result = await recipesApi.getRecipes(params);
      console.log('[RecipeContext] API result:', { success: result.success, count: result.data?.length });

      if (result.success) {
        setRecipes(result.data);
        return result.data;
      } else {
        console.error('[RecipeContext] Fetch failed:', result.error);
        setError(result.error);
        return [];
      }
    } catch (err) {
      console.error('[RecipeContext] Fetch error:', err.message);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charger mes recettes (premium)
   */
  const fetchMyRecipes = useCallback(async () => {
    if (!isPremium) return [];

    try {
      const result = await recipesApi.getMyRecipes();
      if (result.success) {
        setMyRecipes(result.data);
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('[RecipeContext] Fetch my recipes error:', err);
      return [];
    }
  }, [isPremium]);

  /**
   * Toggle favori (optimistic update + persist)
   */
  const toggleFavorite = useCallback(async (recipeId) => {
    const newFavorites = favorites.includes(recipeId)
      ? favorites.filter(id => id !== recipeId)
      : [...favorites, recipeId];

    setFavorites(newFavorites);

    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      await recipesApi.toggleLikeRecipe(recipeId);
    } catch (err) {
      console.error('[RecipeContext] Toggle favorite error:', err);
      // Revert on error
      setFavorites(favorites);
    }
  }, [favorites]);

  /**
   * Toggle sauvegardé (premium only)
   */
  const toggleSaved = useCallback(async (recipeId) => {
    if (!isPremium) {
      setError('Premium subscription required to save recipes');
      return false;
    }

    const newSaved = saved.includes(recipeId)
      ? saved.filter(id => id !== recipeId)
      : [...saved, recipeId];

    setSaved(newSaved);

    try {
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(newSaved));
      await recipesApi.saveRecipe(recipeId);
      return true;
    } catch (err) {
      console.error('[RecipeContext] Toggle saved error:', err);
      setSaved(saved);
      return false;
    }
  }, [saved, isPremium]);

  /**
   * Créer une recette (premium only)
   */
  const createRecipe = useCallback(async (recipeData) => {
    if (!isPremium) {
      setError('Premium subscription required to create recipes');
      return null;
    }

    try {
      setLoading(true);
      const result = await recipesApi.createRecipe(recipeData);

      if (result.success) {
        setMyRecipes(prev => [result.data, ...prev]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  /**
   * Mettre à jour une recette (premium only)
   */
  const updateRecipe = useCallback(async (id, recipeData) => {
    if (!isPremium) {
      setError('Premium subscription required');
      return null;
    }

    try {
      setLoading(true);
      const result = await recipesApi.updateRecipe(id, recipeData);

      if (result.success) {
        setMyRecipes(prev => prev.map(r => r._id === id ? result.data : r));
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  /**
   * Supprimer une recette (premium only)
   */
  const deleteRecipe = useCallback(async (id) => {
    if (!isPremium) return false;

    try {
      const result = await recipesApi.deleteRecipe(id);

      if (result.success) {
        setMyRecipes(prev => prev.filter(r => r._id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('[RecipeContext] Delete error:', err);
      return false;
    }
  }, [isPremium]);

  /**
   * Proposer au public (premium only)
   */
  const proposeRecipe = useCallback(async (id) => {
    if (!isPremium) return false;

    try {
      const result = await recipesApi.proposeRecipe(id);
      return result.success;
    } catch (err) {
      console.error('[RecipeContext] Propose error:', err);
      return false;
    }
  }, [isPremium]);

  /**
   * Dépublier une recette (premium only)
   */
  const unpublishRecipe = useCallback(async (id) => {
    if (!isPremium) return false;

    try {
      const result = await recipesApi.unpublishRecipe(id);
      return result.success;
    } catch (err) {
      console.error('[RecipeContext] Unpublish error:', err);
      return false;
    }
  }, [isPremium]);

  /**
   * Récupérer une recette par ID
   */
  const fetchRecipeById = useCallback(async (id) => {
    try {
      const result = await recipesApi.getRecipe(id);
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('[RecipeContext] Fetch recipe by ID error:', err);
      return null;
    }
  }, []);

  /**
   * Effacer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    recipes,
    favorites,
    saved,
    myRecipes,
    loading,
    error,
    isPremium,

    // Actions
    fetchRecipes,
    fetchRecipeById,
    fetchMyRecipes,
    toggleFavorite,
    toggleSaved,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    proposeRecipe,
    unpublishRecipe,
    loadFavorites,
    loadSaved,
    clearError,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipe() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipe must be used within RecipeProvider');
  }
  return context;
}

export default RecipeContext;
