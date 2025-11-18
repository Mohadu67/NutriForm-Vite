const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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
  const response = await apiCall('/api/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, remember }),
  });

  const data = await response.json();

  if (response.ok && data.user) {
    // Token envoyé via cookie httpOnly (sécurisé contre XSS)
    // On stocke uniquement les données utilisateur non sensibles
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("userId", data.user.id);

    if (remember) {
      localStorage.setItem("rememberMe", "true");
      localStorage.removeItem("lastActivity");
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.setItem("lastActivity", Date.now().toString());
    }

    return { success: true, user: data.user };
  } else {
    return { success: false, message: data.message };
  }
}

export async function secureApiCall(endpoint, options = {}) {
  try {
    const response = await apiCall(endpoint, options);

    if (response.status === 401) {
      // Cookie expiré ou invalide, nettoyer les données locales
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      throw new Error('Not authenticated');
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  try {
    // Appel API pour supprimer le cookie httpOnly côté serveur
    await apiCall('/api/logout', { method: 'POST' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }

  // Nettoyage des données locales
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("lastActivity");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("cachedDisplayName");

  sessionStorage.removeItem("user");
  sessionStorage.removeItem("userId");
}

export function isAuthenticated() {
  // Vérifier si on a les données utilisateur (le token est dans un cookie httpOnly)
  const user = localStorage.getItem("user");
  return Boolean(user);
}

export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}
