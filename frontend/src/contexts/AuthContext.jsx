import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { secureApiCall, isAuthenticated } from '../utils/authService.js';
import { storage } from '../shared/utils/storage.js';

const AuthContext = createContext(null);

const REFRESH_COOLDOWN = 5000; // 5s minimum entre deux refresh

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.get('user') || null);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);
  const fetchInProgressRef = useRef(null);

  const fetchUser = useCallback(async (force = false) => {
    const now = Date.now();

    // Cooldown : pas de re-fetch avant 5s sauf si forcé
    if (!force && now - lastFetchRef.current < REFRESH_COOLDOWN) {
      return;
    }

    // Déduplication : si un fetch est déjà en cours, attendre son résultat
    if (fetchInProgressRef.current) {
      return fetchInProgressRef.current;
    }

    const promise = (async () => {
      try {
        const response = await secureApiCall('/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          storage.set('user', data);
          lastFetchRef.current = Date.now();
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = null;
      }
    })();

    fetchInProgressRef.current = promise;
    return promise;
  }, []);

  // Fetch initial
  useEffect(() => {
    if (isAuthenticated()) {
      fetchUser(true);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  // Refresh au retour d'onglet avec debounce
  useEffect(() => {
    let timeout;
    const handleVisibility = () => {
      if (!document.hidden && isAuthenticated()) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fetchUser(), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(timeout);
    };
  }, [fetchUser]);

  // Écouter les changements de storage (login/logout depuis un autre onglet)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'user') {
        const val = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(val);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const refresh = useCallback(() => fetchUser(true), [fetchUser]);

  const logout = useCallback(() => {
    setUser(null);
    storage.remove('user');
    storage.remove('token');
  }, []);

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === 'admin';
  const isPremium = user?.isPremium === true || user?.subscriptionTier === 'premium';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggedIn,
      isAdmin,
      isPremium,
      refresh,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback pour les composants hors du provider (ne devrait pas arriver)
    return {
      user: storage.get('user') || null,
      loading: false,
      isLoggedIn: Boolean(storage.get('user')),
      isAdmin: false,
      isPremium: false,
      refresh: () => {},
      logout: () => {},
    };
  }
  return ctx;
}

export default AuthContext;
