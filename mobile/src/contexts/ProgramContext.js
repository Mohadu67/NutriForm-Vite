import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as programsApi from '../api/programs';
import { useAuth } from './AuthContext';

const ProgramContext = createContext();

const FAVORITES_KEY = '@program_favorites';

export function ProgramProvider({ children }) {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [myPrograms, setMyPrograms] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyStats, setHistoryStats] = useState({});
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
      if (user.subscription?.tier) {
        setSubscriptionTier(user.subscription.tier);
        return;
      }

      // Otherwise, fetch from API
      try {
        const apiClient = require('../api/client').default;
        const response = await apiClient.get('/subscriptions/status');
        if (response.data?.tier) {
          setSubscriptionTier(response.data.tier);
          console.log('[ProgramContext] Fetched subscription tier:', response.data.tier);
        }
      } catch (err) {
        console.error('[ProgramContext] Error fetching subscription:', err);
      }
    }

    fetchSubscriptionStatus();
  }, [user]);

  // Debug log
  useEffect(() => {
    console.log('[ProgramContext] Premium check:', {
      hasUser: !!user,
      email: user?.email,
      subscription: user?.subscription,
      tier: user?.subscription?.tier || subscriptionTier,
      isPremium,
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
      console.error('[ProgramContext] Load favorites error:', err);
    }
  }, []);

  /**
   * Charger les programmes publics avec filtres
   */
  const fetchPrograms = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProgramContext] Fetching programs with params:', params);
      const result = await programsApi.getPublicPrograms(params);
      console.log('[ProgramContext] API result:', { success: result.success, count: result.data?.length });

      if (result.success) {
        setPrograms(result.data);
        return result.data;
      } else {
        console.error('[ProgramContext] Fetch failed:', result.error);
        setError(result.error);
        return [];
      }
    } catch (err) {
      console.error('[ProgramContext] Fetch error:', err.message);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer un programme par ID
   */
  const fetchProgramById = useCallback(async (id) => {
    try {
      const result = await programsApi.getProgram(id);
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('[ProgramContext] Fetch program by ID error:', err);
      return null;
    }
  }, []);

  /**
   * Charger mes programmes (premium)
   */
  const fetchMyPrograms = useCallback(async () => {
    if (!isPremium) return [];

    try {
      const result = await programsApi.getMyPrograms();
      if (result.success) {
        setMyPrograms(result.data);
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('[ProgramContext] Fetch my programs error:', err);
      return [];
    }
  }, [isPremium]);

  /**
   * Charger les favoris depuis l'API (premium)
   */
  const fetchFavorites = useCallback(async () => {
    if (!isPremium) return [];

    try {
      const result = await programsApi.getFavorites();
      if (result.success) {
        const favoriteIds = result.data.map(p => p._id);
        setFavorites(favoriteIds);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('[ProgramContext] Fetch favorites error:', err);
      return [];
    }
  }, [isPremium]);

  /**
   * Charger l'historique des sessions (premium)
   */
  const fetchSessionHistory = useCallback(async (params = {}) => {
    if (!isPremium) return [];

    try {
      const result = await programsApi.getSessionHistory(params);
      if (result.success) {
        setSessionHistory(result.data);
        setHistoryStats(result.stats || {});
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('[ProgramContext] Fetch history error:', err);
      return [];
    }
  }, [isPremium]);

  /**
   * Toggle favori (optimistic update + persist)
   */
  const toggleFavorite = useCallback(async (programId) => {
    const newFavorites = favorites.includes(programId)
      ? favorites.filter(id => id !== programId)
      : [...favorites, programId];

    setFavorites(newFavorites);

    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      if (isPremium) {
        await programsApi.toggleFavorite(programId);
      }
    } catch (err) {
      console.error('[ProgramContext] Toggle favorite error:', err);
      // Revert on error
      setFavorites(favorites);
    }
  }, [favorites, isPremium]);

  /**
   * Créer un programme (premium only)
   */
  const createProgram = useCallback(async (programData) => {
    if (!isPremium) {
      setError('Premium subscription required to create programs');
      return null;
    }

    try {
      setLoading(true);
      const result = await programsApi.createProgram(programData);

      if (result.success) {
        setMyPrograms(prev => [result.data, ...prev]);
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
   * Mettre à jour un programme (premium only)
   */
  const updateProgram = useCallback(async (id, programData) => {
    if (!isPremium) {
      setError('Premium subscription required');
      return null;
    }

    try {
      setLoading(true);
      const result = await programsApi.updateProgram(id, programData);

      if (result.success) {
        setMyPrograms(prev => prev.map(p => p._id === id ? result.data : p));
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
   * Supprimer un programme (premium only)
   */
  const deleteProgram = useCallback(async (id) => {
    if (!isPremium) return false;

    try {
      const result = await programsApi.deleteProgram(id);

      if (result.success) {
        setMyPrograms(prev => prev.filter(p => p._id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('[ProgramContext] Delete error:', err);
      return false;
    }
  }, [isPremium]);

  /**
   * Démarrer une session d'entraînement
   */
  const startSession = useCallback(async (programId) => {
    try {
      if (isPremium) {
        const result = await programsApi.startProgram(programId);
        if (result.success) {
          return result.data;
        }
      }
      // Pour les non-premium, on retourne juste le programme
      const program = await fetchProgramById(programId);
      return { program, session: null };
    } catch (err) {
      console.error('[ProgramContext] Start session error:', err);
      return null;
    }
  }, [isPremium, fetchProgramById]);

  /**
   * Enregistrer une session terminée
   */
  const recordCompletion = useCallback(async (programId, sessionData) => {
    if (!isPremium) {
      // Sauvegarder localement pour les non-premium
      try {
        const localKey = '@local_workout_history';
        const existing = await AsyncStorage.getItem(localKey);
        const history = existing ? JSON.parse(existing) : [];
        history.unshift({
          ...sessionData,
          programId,
          completedAt: new Date().toISOString(),
        });
        await AsyncStorage.setItem(localKey, JSON.stringify(history.slice(0, 50)));
        return true;
      } catch (err) {
        console.error('[ProgramContext] Local save error:', err);
        return false;
      }
    }

    try {
      const result = await programsApi.recordCompletion(programId, sessionData);
      if (result.success) {
        // Rafraîchir l'historique
        await fetchSessionHistory();
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('[ProgramContext] Record completion error:', err);
      return null;
    }
  }, [isPremium, fetchSessionHistory]);

  /**
   * Noter un programme (premium only)
   */
  const rateProgram = useCallback(async (id, rating) => {
    if (!isPremium) {
      setError('Premium subscription required to rate programs');
      return false;
    }

    try {
      const result = await programsApi.rateProgram(id, rating);
      return result.success;
    } catch (err) {
      console.error('[ProgramContext] Rate error:', err);
      return false;
    }
  }, [isPremium]);

  /**
   * Proposer au public (premium only)
   */
  const proposeProgram = useCallback(async (id) => {
    if (!isPremium) return false;

    try {
      const result = await programsApi.proposeToPublic(id);
      if (result.success) {
        // Mettre à jour le statut local
        setMyPrograms(prev => prev.map(p =>
          p._id === id ? { ...p, status: 'pending' } : p
        ));
      }
      return result.success;
    } catch (err) {
      console.error('[ProgramContext] Propose error:', err);
      return false;
    }
  }, [isPremium]);

  /**
   * Dépublier un programme (premium only)
   */
  const unpublishProgram = useCallback(async (id) => {
    if (!isPremium) return false;

    try {
      const result = await programsApi.unpublishProgram(id);
      if (result.success) {
        // Mettre à jour le statut local
        setMyPrograms(prev => prev.map(p =>
          p._id === id ? { ...p, status: 'private', isPublic: false } : p
        ));
      }
      return result.success;
    } catch (err) {
      console.error('[ProgramContext] Unpublish error:', err);
      return false;
    }
  }, [isPremium]);

  /**
   * Effacer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    programs,
    myPrograms,
    favorites,
    sessionHistory,
    historyStats,
    loading,
    error,
    isPremium,

    // Actions
    fetchPrograms,
    fetchProgramById,
    fetchMyPrograms,
    fetchFavorites,
    fetchSessionHistory,
    toggleFavorite,
    createProgram,
    updateProgram,
    deleteProgram,
    startSession,
    recordCompletion,
    rateProgram,
    proposeProgram,
    unpublishProgram,
    loadFavorites,
    clearError,
  };

  return (
    <ProgramContext.Provider value={value}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('useProgram must be used within ProgramProvider');
  }
  return context;
}

export default ProgramContext;
