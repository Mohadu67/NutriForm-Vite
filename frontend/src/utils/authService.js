const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const DEBUG_MODE = import.meta.env.DEV;

function log(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[AuthService] ${message}`, data || '');
  }
}

async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const token = localStorage.getItem("token");

  const isFormData = options.body instanceof FormData;

  const defaultOptions = {
    credentials: 'include',
    headers: isFormData ? {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    } : {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
}

export async function login(identifier, password, remember = false) {
  log("Login attempt", { identifier, remember });

  const response = await apiCall('/api/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, remember }),
  });

  const data = await response.json();

  if (response.ok && data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("userId", data.user.id);

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

export async function secureApiCall(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    log("Not authenticated - no token in localStorage");
    throw new Error('Not authenticated');
  }

  try {
    const response = await apiCall(endpoint, options);

    if (response.status === 401) {
      log("Unauthorized - token invalid or expired");
      throw new Error('Not authenticated');
    }

    return response;
  } catch (error) {
    log("Secure API call error:", error.message);
    throw error;
  }
}

export async function logout() {
  log("Logout initiated");

  try {
    await apiCall('/api/logout', { method: 'POST' });
  } catch (error) {
    log("Logout API call failed:", error.message);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("lastActivity");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("cachedDisplayName");

  sessionStorage.removeItem("user");
  sessionStorage.removeItem("userId");

  log("Logout completed - all data cleared");
}

export function isAuthenticated() {
  const token = localStorage.getItem("token");
  return Boolean(token);
}

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
