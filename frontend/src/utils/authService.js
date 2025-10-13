// Service d'authentification sécurisé avec refresh token automatique
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const DEBUG_MODE = import.meta.env.DEV;

function log(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[AuthService] ${message}`, data || '');
  }
}

// Appel API avec credentials pour envoyer les cookies
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  // Ne pas définir Content-Type si c'est un FormData (le navigateur le fera automatiquement)
  const isFormData = options.body instanceof FormData;

  const defaultOptions = {
    credentials: 'include', // IMPORTANT : Envoie les cookies
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

// Refresh le token automatiquement
export async function refreshAccessToken() {
  try {
    log("Attempting to refresh access token...");

    const response = await apiCall('/api/refresh', {
      method: 'POST',
    });

    const data = await response.json();

    if (response.ok && data.user) {
      log("Access token refreshed successfully");

      // Mettre à jour les données utilisateur en localStorage
      const existingUser = localStorage.getItem("user");
      if (existingUser) {
        try {
          const userData = JSON.parse(existingUser);
          // Fusionner les données
          const updatedUser = { ...userData, ...data.user };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (e) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      }

      return true;
    } else {
      log("Refresh failed:", data.message);
      return false;
    }
  } catch (error) {
    log("Refresh error:", error.message);
    return false;
  }
}

// Appel API avec gestion automatique du refresh
export async function secureApiCall(endpoint, options = {}) {
  try {
    let response = await apiCall(endpoint, options);

    // Si 401 et besoin de refresh, essayer le refresh
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));

      if (data.needsRefresh) {
        log("Token expired - attempting refresh");

        const refreshSuccess = await refreshAccessToken();

        if (refreshSuccess) {
          // Réessayer la requête originale
          log("Retrying original request after refresh");
          response = await apiCall(endpoint, options);
        } else {
          // Refresh échoué -> déconnexion
          log("Refresh failed - logging out");
          await logout();
          window.location.href = '/';
          throw new Error('Session expired');
        }
      }
    }

    return response;
  } catch (error) {
    log("Secure API call error:", error.message);
    throw error;
  }
}

// Connexion
export async function login(identifier, password, remember = false) {
  log("Login attempt", { identifier, remember });

  const response = await apiCall('/api/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, remember }),
  });

  const data = await response.json();

  if (response.ok && data.user) {
    // Stocker uniquement les données utilisateur (pas de token !)
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("userId", data.user.id);

    // Gérer "remember me"
    if (remember) {
      localStorage.setItem("rememberMe", "true");
      localStorage.removeItem("lastActivity");
      log("Remember me activated");
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.setItem("lastActivity", Date.now().toString());
      log("Session started with 24h limit");
    }

    log("Login successful");
    return { success: true, user: data.user };
  } else {
    log("Login failed:", data.message);
    return { success: false, message: data.message };
  }
}

// Déconnexion
export async function logout() {
  log("Logout initiated");

  try {
    // Appeler l'API pour supprimer les cookies
    await apiCall('/api/logout', { method: 'POST' });
  } catch (error) {
    log("Logout API call failed:", error.message);
  }

  // Nettoyer localStorage
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("lastActivity");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("cachedDisplayName");

  sessionStorage.removeItem("user");
  sessionStorage.removeItem("userId");

  log("Logout completed - all data cleared");
}

// Vérifier si l'utilisateur est connecté
export function isAuthenticated() {
  // On ne peut pas vérifier le cookie côté client (httpOnly)
  // Donc on vérifie uniquement si on a des données user
  const user = localStorage.getItem("user");
  return Boolean(user);
}

// Obtenir l'utilisateur actuel
export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    log("Failed to parse user data");
    return null;
  }
}
