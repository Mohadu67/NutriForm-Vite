const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await apiCall(endpoint, options);

    if (response.status === 401) {
      throw new Error('Not authenticated');
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  try {
    await apiCall('/api/logout', { method: 'POST' });
  } catch (error) {
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("lastActivity");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("cachedDisplayName");

  sessionStorage.removeItem("user");
  sessionStorage.removeItem("userId");
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
    return null;
  }
}
