import axios from 'axios';
import Constants from 'expo-constants';
import { secureStorage } from '../services/storageService';

// En dev, utiliser l'IP de la machine pour les appareils physiques
const getDevApiUrl = () => {
  // Expo Go sur appareil physique
  const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (expoHost) {
    return `http://${expoHost}:3000/api`;
  }
  // Simulateur iOS ou fallback
  return 'http://localhost:3000/api';
};

// Configuration de l'API
const API_URL = __DEV__
  ? getDevApiUrl()
  : 'https://api.harmonith.com/api';

console.log('[API] Base URL:', API_URL);

// Instance axios avec configuration React Native
const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Re-export secureStorage as tokenStorage for backwards compatibility
export const tokenStorage = secureStorage;

// Request interceptor - Add authorization header with token
client.interceptors.request.use(
  async (config) => {
    // Log request details in dev
    if (__DEV__) {
      console.log('[API] Request:', config.method?.toUpperCase(), config.url);
      console.log('[API] Request body:', JSON.stringify(config.data));
    }

    const token = await secureStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Routes d'auth qui ne nécessitent pas de token refresh
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

// Response interceptor - Handle 401 errors and token refresh
client.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('[API] Response OK:', response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const url = originalRequest?.url || '';

    if (__DEV__) {
      console.log('[API] Response ERROR:', url, status);
      console.log('[API] Error data:', JSON.stringify(error?.response?.data));
    }

    // Ne pas essayer de refresh sur les routes d'auth
    const isAuthRoute = AUTH_ROUTES.some(route => url.includes(route));
    if (isAuthRoute) {
      return Promise.reject(error);
    }

    // Handle 401 - Token expired or invalid
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = await secureStorage.getRefreshToken();

        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/refresh`, {
            refreshToken,
          });

          // Store new tokens
          await secureStorage.setToken(data.token);
          if (data.refreshToken) {
            await secureStorage.setRefreshToken(data.refreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens
        // The auth context will handle redirect to login
        await secureStorage.clearAll();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
export { API_URL };
