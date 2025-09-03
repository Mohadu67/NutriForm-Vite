const DEFAULT_DEV_API = (typeof window !== 'undefined' && window.location && window.location.port === '5173')
  ? 'http://localhost:3000'
  : '';
const API_BASE = (import.meta?.env?.VITE_API_URL || DEFAULT_DEV_API);


export function getToken() {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('authToken') ||
      null
    );
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const auth = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : null;
  if (!auth && (typeof window !== 'undefined') && !import.meta.env.PROD) {
    console.warn('[sessionApi] No Authorization header. Using cookies only. API_BASE=', API_BASE);
  }
  const headers = {
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers
  });

  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || 'request_failed';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function saveSession(payload) {
  return request('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getSessions({ date, limit, cursor } = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (limit) params.set('limit', String(limit));
  if (cursor) params.set('cursor', String(cursor));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/sessions${qs}`);
}

export function getSessionById(id) {
  return request(`/api/sessions/${id}`);
}

export function updateSession(id, patch) {
  return request(`/api/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export function deleteSession(id) {
  return request(`/api/sessions/${id}`, { method: 'DELETE' });
}

export function getDailySummary(from, to) {
  const params = new URLSearchParams({ from, to });
  return request(`/api/summary/daily?${params.toString()}`);
}

export function buildSessionFromEntry(entry, { name, startedAt, endedAt, notes } = {}) {
  const nowIso = new Date().toISOString();
  return {
    name: name || `Séance – ${new Date().toLocaleDateString()}`,
    startedAt: startedAt || nowIso,
    endedAt: endedAt || nowIso,
    notes: notes || '',
    entries: [entry]
  };
}
