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

// Map front 'items' array to backend 'entries' array
function mapItemsToEntries(items = []) {
  return items.map((it) => {
    const d = it?.data || {};
    const cardioSets = Array.isArray(d.cardioSets) ? d.cardioSets : [];
    const muscuSets = Array.isArray(d.sets) ? d.sets : Array.isArray(d.series) ? d.series : [];

    let type = (it?.mode || it?.type || "").toLowerCase();
    if (!type) type = cardioSets.length ? "cardio" : (muscuSets.length ? "muscu" : "poids_du_corps");

    let sets;
    if (type === "cardio") {
      sets = cardioSets.map((cs) => ({
        durationMin: (cs.durationSec != null && !isNaN(Number(cs.durationSec))) ? undefined : Number(cs.durationMin ?? cs.minutes ?? 0) || undefined,
        durationSec: (cs.durationSec != null && !isNaN(Number(cs.durationSec))) ? Number(cs.durationSec) : undefined,
        distanceKm: (cs.distanceKm != null) ? Number(cs.distanceKm) : (cs.km != null ? Number(cs.km) : (cs.meters != null ? Number(cs.meters) / 1000 : undefined))
      }));
    } else {
      sets = muscuSets.map((ms) => ({
        reps: (ms.reps != null) ? Number(ms.reps) : (ms.rep != null ? Number(ms.rep) : undefined),
        weightKg: (ms.weightKg != null) ? Number(ms.weightKg) : (ms.weight != null ? Number(ms.weight) : (ms.kg != null ? Number(ms.kg) : (ms.poids != null ? Number(ms.poids) : undefined)))
      })).filter(s => s.reps != null || s.weightKg != null);
      if (!sets.length && (d.reps != null || d.weightKg != null || d.weight != null)) {
        sets = [{
          reps: d.reps != null ? Number(d.reps) : undefined,
          weightKg: d.weightKg != null ? Number(d.weightKg) : (d.weight != null ? Number(d.weight) : undefined)
        }];
      }
    }

    return {
      exerciseName: it?.name || it?.label || it?.exoName || "Exercice",
      type,
      sets
    };
  });
}

export function saveSession(payload) {
  const body = { ...(payload || {}) };
  if (!body.entries && Array.isArray(body.items)) {
    body.entries = mapItemsToEntries(body.items);
    delete body.items;
  }
  return request('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(body)
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

export function getLastSession() {
  return getSessions({ limit: 1 }).then((res) => {
    if (Array.isArray(res) && res.length) return res[0];
    if (res?.items?.length) return res.items[0];
    return null;
  });
}
