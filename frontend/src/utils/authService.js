import { storage, sessionStorage as sessionStore } from "../shared/utils/storage.js";
import { authLogger } from "../shared/utils/logger.js";

// Protection contre import.meta.env undefined au build time
const API_URL = (() => {
  try {
    return (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");
  } catch {
    return "";
  }
})();

// Cache global pour éviter les appels multiples à /api/me
let authCheckInProgress = null;
let authCheckResult = null;
let authCheckTimestamp = 0;
const AUTH_CACHE_DURATION = 30000; // 30 secondes

async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const defaultOptions = {
    credentials: 'include', // Envoie automatiquement les cookies httpOnly
    headers: isFormData ? {
      ...options.headers,
    } : {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
}

export async function login(identifier, password, remember = false) {
  const response = await apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, remember }),
  });

  // Gérer les réponses vides
  const text = await response.text();
  if (!text || text.trim() === "") {
    return { success: false, message: "Réponse vide du serveur" };
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { success: false, message: "Réponse invalide du serveur" };
  }

  if (response.ok && data.user) {
    // Token envoyé via cookie httpOnly (sécurisé contre XSS)
    // On stocke uniquement les données utilisateur non sensibles
    storage.set("user", data.user);
    storage.set("userId", data.user.id);

    // Stocker le token pour le WebSocket (nécessaire en cross-origin dev)
    if (data.token) {
      storage.set("wsToken", data.token);
    }

    // Invalider le cache auth pour forcer un refresh
    authCheckResult = null;
    authCheckTimestamp = 0;

    if (remember) {
      storage.set("rememberMe", true);
      storage.remove("lastActivity");
    } else {
      storage.remove("rememberMe");
      storage.set("lastActivity", Date.now());
    }

    return { success: true, user: data.user };
  } else {
    return { success: false, message: data.message };
  }
}

export async function secureApiCall(endpoint, options = {}) {
  try {
    // Cache spécial pour /me pour éviter les appels multiples
    if (endpoint === '/me' && (!options || !options.method || options.method === 'GET')) {
      const now = Date.now();

      // Si un appel est déjà en cours, attendre le résultat
      if (authCheckInProgress) {
        return authCheckInProgress;
      }

      // Si on a un résultat en cache récent, le retourner
      if (authCheckResult && (now - authCheckTimestamp) < AUTH_CACHE_DURATION) {
        return Promise.resolve(authCheckResult);
      }

      // Faire l'appel et le mettre en cache
      authCheckInProgress = apiCall(endpoint, options).then(async response => {
        authCheckInProgress = null;
        authCheckTimestamp = Date.now();

        if (response.status === 401) {
          authCheckResult = null;
          // NE PAS supprimer les données locales ici
          // La gestion de la déconnexion doit être faite par le composant appelant
          // après vérification que c'est vraiment une déconnexion et non un problème temporaire
          // Ne pas throw, retourner la réponse 401 pour gestion propre
          return response;
        }

        // Créer un objet de réponse synthétique pour le cache
        // (on ne peut pas cloner un Response après l'avoir consommé)
        const data = await response.clone().json();
        authCheckResult = new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
        return response;
      }).catch(err => {
        authCheckInProgress = null;
        authCheckResult = null;
        throw err;
      });

      return authCheckInProgress;
    }

    // Pour les autres endpoints, appel normal
    const response = await apiCall(endpoint, options);

    if (response.status === 401) {
      // Invalider le cache mais NE PAS supprimer les données locales
      // La déconnexion explicite doit passer par logout()
      authCheckResult = null;
      // Ne pas throw, retourner la réponse 401 pour gestion propre
      return response;
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  try {
    // Appel API pour supprimer le cookie httpOnly côté serveur
    await apiCall('/logout', { method: 'POST' });
  } catch (error) {
    authLogger.error('Erreur lors de la déconnexion:', error);
  }

  // Invalider le cache auth
  authCheckResult = null;
  authCheckTimestamp = 0;
  authCheckInProgress = null;

  // Nettoyage des données locales
  storage.remove("user");
  storage.remove("userId");
  storage.remove("lastActivity");
  storage.remove("rememberMe");
  storage.remove("cachedDisplayName");
  storage.remove("wsToken"); // Supprimer le token WebSocket

  sessionStore.remove("user");
  sessionStore.remove("userId");
}

export function isAuthenticated() {
  // Vérifier si on a les données utilisateur (le token est dans un cookie httpOnly)
  const user = storage.get("user");
  return Boolean(user);
}

export function getCurrentUser() {
  const user = storage.get("user");
  return user || null;
}

// Invalider le cache auth manuellement (utile après login/logout)
export function invalidateAuthCache() {
  authCheckResult = null;
  authCheckTimestamp = 0;
  authCheckInProgress = null;
}
