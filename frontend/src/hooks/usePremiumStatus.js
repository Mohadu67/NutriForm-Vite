import { useState, useEffect, useCallback, useMemo } from 'react';
import { secureApiCall } from '../utils/authService';
import endpoints from '../shared/api/endpoints';

// Storage helper
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }
};

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
        programs: Infinity,
        messages: Infinity,
        matches: Infinity,
        recipes: Infinity,
        aiChat: true,
        exportData: true,
        advancedStats: true
      };
    }

    return {
      programs: 3,
      messages: 50,
      matches: 10,
      recipes: 10,
      aiChat: false,
      exportData: false,
      advancedStats: false
    };
  }, [isPremium, isAdmin, isCoach]);

  /**
   * Vérifie si une feature est accessible
   */
  const canAccess = useCallback((feature) => {
    const premiumFeatures = [
      'matching',
      'chat',
      'aiChat',
      'advancedStats',
      'exportData',
      'unlimitedPrograms',
      'unlimitedRecipes'
    ];

    // Staff a accès à tout
    if (isAdmin || isCoach) return true;

    // Premium a accès aux features premium
    if (isPremium && premiumFeatures.includes(feature)) return true;

    // Features gratuites
    const freeFeatures = ['dashboard', 'calculators', 'profile', 'programs', 'recipes'];
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
