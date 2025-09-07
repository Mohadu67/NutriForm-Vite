const DEFAULT_DEV_API = (typeof window !== 'undefined' && window.location && window.location.port === '5173')
  ? 'http://localhost:3000'
  : '';
const API_BASE = (import.meta?.env?.VITE_API_URL || DEFAULT_DEV_API);

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    // Fallback: strip functions, handle BigInt, avoid cycles
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'function') return undefined;
      if (typeof value === 'bigint') return Number(value);
      if (value && typeof value === 'object') {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value;
    });
  }
}

function getToken() {
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
    Accept: 'application/json',
    ...(auth ? { Authorization: auth } : {}),
    ...(options.headers || {})
  };
  if (options.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }

  let body = options.body;
  if (body != null && !(body instanceof FormData)) {
    body = typeof body === 'string' ? body : safeStringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    body,
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

function fetchHistorySummary() {
  return request('/api/history/summary');
}

function mapItemsToEntries(items = []) {
  return items
    .map((it) => {
      const d = (it && typeof it.data === 'object' && it.data) ? it.data : {};
      const cardioSets = Array.isArray(d.cardioSets) ? d.cardioSets : [];
      const muscuSets = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);

      const rawType = (it && (it.mode ?? it.type)) ?? '';
      let type = typeof rawType === 'string' ? rawType.toLowerCase() : String(rawType || '').toLowerCase();

      if (!type) type = cardioSets.length ? "cardio" : (muscuSets.length ? "muscu" : "poids_du_corps");

      let sets;
      if (type === "cardio") {
        sets = cardioSets.map((cs) => ({
          durationMin: (cs.durationSec != null && !isNaN(Number(cs.durationSec))) ? undefined : Number(cs.durationMin ?? cs.minutes ?? 0) || undefined,
          durationSec: (cs.durationSec != null && !isNaN(Number(cs.durationSec))) ? Number(cs.durationSec) : undefined,
          distanceKm: (cs.distanceKm != null) ? Number(cs.distanceKm) : (cs.km != null ? Number(cs.km) : (cs.meters != null ? Number(cs.meters) / 1000 : undefined))
        }));
        // filter out empty cardio sets
        sets = sets.filter(s => (s.durationMin != null) || (s.durationSec != null) || (s.distanceKm != null));
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

      if (!Array.isArray(sets) || sets.length === 0) {
        return null; // skip entries with no valid sets
      }

      return {
        exerciseName: String(it?.name || it?.label || it?.exoName || "Exercice"),
        muscleGroup: d?.muscleGroup || it?.muscleGroup || it?.group || d?.group || d?.target || undefined,
        type,
        sets
      };
    })
    .filter(Boolean);
}

function saveSession(payload) {
  const body = { ...(payload || {}) };
  if (!body.entries && Array.isArray(body.items)) {
    body.entries = mapItemsToEntries(body.items);
    delete body.items;
  }
  return request('/api/sessions', {
    method: 'POST',
    body
  });
}

function getSessions({ date, limit, cursor } = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (limit) params.set('limit', String(limit));
  if (cursor) params.set('cursor', String(cursor));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/sessions${qs}`);
}

function getSessionById(id) {
  return request(`/api/sessions/${id}`);
}

function updateSession(id, patch) {
  return request(`/api/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

function deleteSession(id) {
  return request(`/api/sessions/${id}`, { method: 'DELETE' });
}

function getDailySummary(from, to) {
  const params = new URLSearchParams({ from, to });
  return request(`/api/summary/daily?${params.toString()}`);
}

function buildSessionFromEntry(entry, { name, startedAt, endedAt, notes } = {}) {
  const nowIso = new Date().toISOString();
  return {
    name: name || `Séance – ${new Date().toLocaleDateString()}`,
    startedAt: startedAt || nowIso,
    endedAt: endedAt || nowIso,
    notes: notes || '',
    entries: [entry]
  };
}

function getLastSession() {
  return getSessions({ limit: 1 }).then((res) => {
    if (Array.isArray(res) && res.length) return res[0];
    if (res?.items?.length) return res.items[0];
    return null;
  });
}

export {
  request,
  getToken,
  fetchHistorySummary,
  mapItemsToEntries,
  saveSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getDailySummary,
  buildSessionFromEntry,
  getLastSession,
};
