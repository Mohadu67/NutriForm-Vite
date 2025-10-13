import { secureApiCall } from '../../../utils/authService.js';

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
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

async function request(path, options = {}) {
  let body = options.body;
  if (body != null && !(body instanceof FormData)) {
    body = typeof body === 'string' ? body : safeStringify(body);
  }

  const res = await secureApiCall(path, {
    ...options,
    body,
  });

  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `request_failed_${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.url = path;
    err.method = (options.method || 'GET').toUpperCase();
    throw err;
  }
  return data;
}

function fetchHistorySummary() {
  return request('/api/history/summary');
}

function mapItemsToEntries(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const num = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  return items
    .map((it) => {
      if (!it) return null;
      const d = (it && typeof it.data === 'object' && it.data) ? it.data : {};

      const rawType = (it.mode ?? it.type ?? '').toString().toLowerCase();
      let type = rawType.includes('cardio') ? 'cardio' : rawType.includes('muscu') ? 'muscu' : '';
      const cardioSetsRaw = Array.isArray(d.cardioSets) ? d.cardioSets : [];
      const muscuSetsRaw = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);
      if (!type) type = cardioSetsRaw.length ? 'cardio' : (muscuSetsRaw.length ? 'muscu' : '');

      if (type === 'cardio') {
        let sets = cardioSetsRaw.map((cs) => {
          const durationSec = num(cs?.durationSec, 0) || (num(cs?.durationMin ?? cs?.minutes, 0) * 60);
          const distanceKm = cs?.distanceKm != null ? num(cs.distanceKm) : (cs?.km != null ? num(cs.km) : (cs?.meters != null ? num(cs.meters) / 1000 : 0));
          const calories = num(cs?.calories, 0);
          return { durationSec: durationSec || undefined, distanceKm: distanceKm || undefined, calories: calories || undefined };
        }).filter(s => (s.durationSec || s.distanceKm || s.calories));

        if (sets.length === 0) return null;
        return {
          exerciseId: it.id || it._id || it.slug || String(it.name || it.label || 'exo').toLowerCase(),
          name: String(it.name || it.label || it.exoName || 'Exercice'),
          type: 'cardio',
          notes: typeof d?.notes === 'string' && d.notes.trim() ? d.notes.trim() : undefined,
          sets,
        };
      }

      let msets = muscuSetsRaw.map((ms) => {
        const reps = ms?.reps != null ? num(ms.reps) : (ms?.rep != null ? num(ms.rep) : 0);
        const weightKg = ms?.weightKg != null ? num(ms.weightKg) : (ms?.weight != null ? num(ms.weight) : (ms?.kg != null ? num(ms.kg) : (ms?.poids != null ? num(ms.poids) : 0)));
        const durationSec = ms?.durationSec != null ? num(ms.durationSec) : (ms?.timeSec != null ? num(ms.timeSec) : 0);
        return { reps: reps || undefined, weightKg: weightKg || undefined, durationSec: durationSec || undefined };
      }).filter(s => (s.reps || s.weightKg || s.durationSec));

      if (msets.length === 0) {
        const reps = d?.reps != null ? num(d.reps) : 0;
        const weightKg = d?.weightKg != null ? num(d.weightKg) : (d?.weight != null ? num(d.weight) : 0);
        const durationSec = d?.durationSec != null ? num(d.durationSec) : (d?.timeSec != null ? num(d.timeSec) : 0);
        if (reps || weightKg || durationSec) {
          msets = [{ reps: reps || undefined, weightKg: weightKg || undefined, durationSec: durationSec || undefined }];
        }
      }

      if (msets.length === 0) return null;
      return {
        exerciseId: it.id || it._id || it.slug || String(it.name || it.label || 'exo').toLowerCase(),
        name: String(it.name || it.label || it.exoName || 'Exercice'),
        type: 'muscu',
        notes: typeof d?.notes === 'string' && d.notes.trim() ? d.notes.trim() : undefined,
        sets: msets,
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
  if (Array.isArray(body.entries) && body.entries.length === 0) {
    const e = new Error('NO_VALID_ENTRIES');
    e.status = 400;
    throw e;
  }
  return request('/api/workouts/sessions', {
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
  return request(`/api/workouts/sessions${qs}`);
}

function getSessionById(id) {
  return request(`/api/workouts/sessions/${id}`);
}

function updateSession(id, patch) {
  return request(`/api/workouts/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

function deleteSession(id) {
  return request(`/api/workouts/sessions/${id}`, { method: 'DELETE' });
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
