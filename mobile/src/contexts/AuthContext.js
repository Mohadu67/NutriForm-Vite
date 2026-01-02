import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { secureStorage, storage } from '../services/storageService';
import authService from '../api/auth';
import websocketService from '../services/websocket';
import notificationService from '../services/notificationService';

/**
 * Contexte d'authentification
 */
const AuthContext = createContext({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Actions
  login: async () => {},
  loginWithApple: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateUser: async () => {},
  clearError: () => {},
});

/**
 * Provider du contexte d'authentification
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = !!user;

  /**
   * Stocker les tokens de manière sécurisée
   */
  const storeTokens = async (token, refreshToken) => {
    try {
      await secureStorage.setToken(token);
      if (refreshToken) {
        await secureStorage.setRefreshToken(refreshToken);
      }
    } catch (error) {
      console.error('Erreur lors du stockage des tokens:', error);
      throw new Error('Impossible de sauvegarder la session');
    }
  };

  /**
   * Supprimer les tokens
   */
  const clearTokens = async () => {
    try {
      await secureStorage.clearAll();
      await storage.remove('user_data');
    } catch (error) {
      console.error('Erreur lors de la suppression des tokens:', error);
    }
  };

  /**
   * Stocker les données utilisateur en cache
   */
  const storeUserData = async (userData) => {
    try {
      await storage.set('user_data', userData);
    } catch (error) {
      console.error('Erreur lors du stockage des données utilisateur:', error);
    }
  };

  /**
   * Récupérer les données utilisateur depuis le cache
   */
  const getCachedUserData = async () => {
    try {
      return await storage.get('user_data');
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  };

  /**
   * Récupérer et mettre à jour les informations utilisateur
   */
  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      await storeUserData(userData);
      return userData;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement utilisateur:', error);

      // Si erreur 401, l'utilisateur n'est plus authentifié
      if (error.response?.status === 401) {
        await clearTokens();
        setUser(null);
      }

      throw error;
    }
  }, []);

  /**
   * Connexion avec email et mot de passe
   */
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);

      if (__DEV__) console.log('[AUTH] Login attempt:', email);
      const response = await authService.login(email, password);
      if (__DEV__) console.log('[AUTH] Login response received');

      if (!response.token) {
        throw new Error('Token non reçu du serveur');
      }

      // Stocker les tokens
      if (__DEV__) console.log('[AUTH] Storing token...');
      await storeTokens(response.token, response.refreshToken);

      // Récupérer les infos utilisateur
      const userData = response.user || (await authService.getCurrentUser());
      if (__DEV__) console.log('[AUTH] User data loaded for:', userData?.pseudo);

      setUser(userData);
      await storeUserData(userData);

      // Enregistrer pour les push notifications après connexion
      console.log('[AUTH] Registering for push notifications...');
      notificationService.registerForPushNotifications();

      console.log('[AUTH] Login successful');
      return userData;
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      console.error('[AUTH] Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Identifiants incorrects';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Connexion avec Apple
   */
  const loginWithApple = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Vérifier si Apple Authentication est disponible
      const AppleAuthentication = require('expo-apple-authentication');
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Apple Sign-In n\'est pas disponible sur cet appareil');
      }

      // Demander les credentials Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Envoyer au backend
      const response = await authService.loginWithApple({
        identityToken: credential.identityToken,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      });

      // Stocker les tokens
      await storeTokens(response.token, response.refreshToken);

      // Récupérer les infos utilisateur
      const userData = response.user || (await authService.getCurrentUser());
      setUser(userData);
      await storeUserData(userData);

      return userData;
    } catch (error) {
      console.error('Erreur de connexion Apple:', error);

      // Ignorer si l'utilisateur annule
      if (error.code === 'ERR_CANCELED') {
        return null;
      }

      const errorMessage = error.response?.data?.message || 'Erreur lors de la connexion avec Apple';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Connexion avec Google
   */
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Import dynamique de Google Sign-In
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const Constants = require('expo-constants').default;

      // Configurer Google Sign-In avec la config Expo
      const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
      if (!webClientId) {
        throw new Error('Google Web Client ID non configuré. Ajoutez-le dans app.config.js extra.googleWebClientId');
      }
      await GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
      });

      // Vérifier si déjà connecté
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }

      // Demander la connexion
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // Récupérer l'ID token
      const tokens = await GoogleSignin.getTokens();

      // Envoyer au backend
      const response = await authService.loginWithGoogle({
        idToken: tokens.idToken,
        accessToken: tokens.accessToken,
      });

      // Stocker les tokens
      await storeTokens(response.token, response.refreshToken);

      // Récupérer les infos utilisateur
      const userData = response.user || (await authService.getCurrentUser());
      setUser(userData);
      await storeUserData(userData);

      return userData;
    } catch (error) {
      console.error('Erreur de connexion Google:', error);

      // Ignorer si l'utilisateur annule
      if (error.code === 'SIGN_IN_CANCELLED') {
        return null;
      }

      const errorMessage = error.response?.data?.message || 'Erreur lors de la connexion avec Google';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inscription
   * Note: Le backend envoie un email de vérification, pas de token immédiat
   */
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Adapter les champs pour le backend
      const payload = {
        email: userData.email,
        password: userData.password,
        pseudo: userData.pseudo,
        prenom: userData.prenom,
      };

      const response = await authService.register(payload);

      // Le backend renvoie juste un message, pas de token
      // L'utilisateur doit vérifier son email avant de se connecter
      return {
        success: true,
        message: response.message || 'Compte créé. Vérifie ta boîte mail.',
        requiresVerification: true
      };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Déconnecter le WebSocket avant de nettoyer la session
      websocketService.disconnect();

      // Appeler le backend pour invalider le token
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Toujours supprimer les tokens locaux et l'utilisateur
      await clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  };

  /**
   * Effacer l'erreur
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Mettre à jour les données utilisateur localement
   * Utilisé pour les mises à jour partielles (ex: photo de profil)
   */
  const updateUser = useCallback(async (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    await storeUserData(updatedUser);
  }, [user]);

  /**
   * Initialisation au montage du composant
   * Vérifie si un token existe et récupère l'utilisateur
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        console.log('[AUTH] Init: checking for existing token...');

        // Vérifier si un token existe
        const token = await secureStorage.getToken();
        console.log('[AUTH] Init: token exists?', !!token);

        if (!token) {
          // Pas de token, utilisateur non authentifié
          console.log('[AUTH] Init: no token, user not authenticated');
          setUser(null);
          return;
        }

        // Charger d'abord les données en cache pour une UX rapide
        const cachedUser = await getCachedUserData();
        console.log('[AUTH] Init: cached user?', !!cachedUser);
        if (cachedUser) {
          setUser(cachedUser);
        }

        // Puis rafraîchir depuis le serveur
        try {
          console.log('[AUTH] Init: refreshing user from server...');
          await refreshUser();
          console.log('[AUTH] Init: user refreshed successfully');

          // Enregistrer pour les push notifications (utilisateur déjà authentifié)
          console.log('[AUTH] Init: registering for push notifications...');
          notificationService.registerForPushNotifications();
        } catch (error) {
          console.error('[AUTH] Init: refresh failed:', error.message);
          // Si le refresh échoue, utiliser les données en cache si disponibles
          if (!cachedUser) {
            // Pas de cache et erreur serveur, déconnecter
            console.log('[AUTH] Init: no cache, clearing tokens');
            await clearTokens();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[AUTH] Init error:', error);
        await clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('[AUTH] Init: complete');
      }
    };

    initAuth();
  }, []);

  /**
   * Valeur du contexte
   */
  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    loginWithApple,
    loginWithGoogle,
    register,
    logout,
    refreshUser,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook pour accéder au contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }

  return context;
}

export default AuthContext;
