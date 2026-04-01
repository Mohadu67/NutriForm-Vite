import { useState, useEffect, useCallback, useMemo } from 'react';
import { secureApiCall } from '../utils/authService';
import endpoints from '../shared/api/endpoints';
import { storage } from '../shared/utils/storage.js';

/**
 * Hook centralisé pour gérer le statut premium
 * Remplace les 27+ checks dispersés dans l'app
 */
export function usePremiumStatus() {
  const [subscription, setSubscription] = useState(() => {
    return storage.get('subscriptionStatus') || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Récupérer le user depuis le localStorage
  const userData = useMemo(() => {
    return storage.get('user') || {};
  }, []);

  /**
   * Vérifie si l'utilisateur a un statut premium
   * Vérifie toutes les sources possibles
   */
  const isPremium = useMemo(() => {
    // 1. Vérifier subscription stockée
    if (subscription?.tier === 'premium' || subscription?.hasSubscription === true) {
      return true;
    }

    // 2. Vérifier userData (différentes structures possibles)
    if (
      userData?.subscription?.tier === 'premium' ||
      userData?.subscription?.hasSubscription === true ||
      userData?.isPremium === true ||
      userData?.tier === 'premium' ||
      userData?.subscriptionTier === 'premium'
    ) {
      return true;
    }

    // 3. Vérifier role (coach/admin = premium implicite)
    if (userData?.role === 'admin' || userData?.role === 'coach') {
      return true;
    }

    return false;
  }, [subscription, userData]);

  /**
   * Vérifie les différents rôles
   */
  const role = useMemo(() => userData?.role || 'user', [userData]);
  const isAdmin = role === 'admin';
  const isCoach = role === 'coach';
  const isSupport = role === 'support';
  const isStaff = isAdmin || isSupport;

  /**
   * Rafraîchit le statut depuis l'API
   */
  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await secureApiCall(endpoints.subscription.status);
      const data = await response.json();

      if (data.success || data.subscription) {
        const newSubscription = {
          tier: data.subscription?.tier || data.tier || 'free',
          hasSubscription: data.hasSubscription || data.subscription?.tier === 'premium',
          expiresAt: data.subscription?.currentPeriodEnd || null,
          status: data.subscription?.status || 'inactive'
        };

        setSubscription(newSubscription);
        storage.set('subscriptionStatus', newSubscription);

        return newSubscription;
      }
    } catch (err) {
      setError(err.message);
      console.error('Erreur refresh subscription:', err);
    } finally {
      setLoading(false);
    }

    return null;
  }, []);

  /**
   * Limites basées sur le statut
   */
  const limits = useMemo(() => {
    if (isPremium || isAdmin || isCoach) {
      return {
        workoutSessionsPerWeek: Infinity,
        foodLogsPerDay: Infinity,
        recipes: Infinity,
        programs: Infinity,
        aiChatMessagesPerDay: Infinity,
        matching: true,
        chatP2P: true,
        weeklyNutrition: true,
        advancedStats: true,
        exportData: true
      };
    }

    return {
      workoutSessionsPerWeek: 3,
      foodLogsPerDay: 5,
      recipes: 3,
      programs: 2,
      aiChatMessagesPerDay: 10,
      matching: false,
      chatP2P: false,
      weeklyNutrition: false,
      advancedStats: false,
      exportData: false
    };
  }, [isPremium, isAdmin, isCoach]);

  /**
   * Vérifie si une feature est accessible
   */
  const canAccess = useCallback((feature) => {
    // Staff a acces a tout
    if (isAdmin || isCoach) return true;

    // Features 100% premium (bloquees pour free)
    const premiumOnlyFeatures = ['matching', 'chatP2P', 'weeklyNutrition', 'advancedStats', 'exportData'];
    if (premiumOnlyFeatures.includes(feature)) return isPremium;

    // Features avec limites (accessibles free avec limites, illimite premium)
    const limitedFeatures = ['workoutSessions', 'recipes', 'programs', 'aiChat', 'foodLogs'];
    if (limitedFeatures.includes(feature)) return true;

    // Features gratuites sans limite
    const freeFeatures = ['dashboard', 'calculators', 'profile', 'browse'];
    return freeFeatures.includes(feature);
  }, [isPremium, isAdmin, isCoach]);

  /**
   * Écouter les changements de localStorage (multi-onglets)
   */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'subscriptionStatus' && e.newValue) {
        try {
          setSubscription(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    // Status
    isPremium,
    subscription,
    loading,
    error,

    // Roles
    role,
    isAdmin,
    isCoach,
    isSupport,
    isStaff,

    // Actions
    refreshStatus,

    // Helpers
    limits,
    canAccess,

    // Computed
    tier: subscription?.tier || (isPremium ? 'premium' : 'free'),
    expiresAt: subscription?.expiresAt || null
  };
}

export default usePremiumStatus;
