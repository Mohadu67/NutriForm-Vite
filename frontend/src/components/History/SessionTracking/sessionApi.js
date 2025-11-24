import { secureApiCall } from '../../../utils/authService.js';

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
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
  try { data = await res.json(); } catch (e) {
    console.error("Failed to parse JSON response:", e);
  }
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
      const swim = (d && typeof d.swim === 'object') ? d.swim : null;
      const yoga = (d && typeof d.yoga === 'object') ? d.yoga : null;
      const stretch = (d && typeof d.stretch === 'object') ? d.stretch : null;
      const walkRun = (d && typeof d.walkRun === 'object') ? d.walkRun : null;

      const actualMode = d?.mode ?? it?.mode ?? it?.type ?? '';

      const rawType = actualMode.toString().toLowerCase();
      const isSwim = rawType.includes('swim') || (!!swim && !rawType.includes('muscu'));
      const isYoga = rawType.includes('yoga') || (!!yoga && !rawType.includes('muscu'));
      const isStretch = rawType.includes('etir') || rawType.includes('stretch') || (!!stretch && !rawType.includes('muscu'));
      const isWalkRun = rawType.includes('walk_run') || !!walkRun;
      let type = rawType.includes('cardio') ? 'cardio' : rawType.includes('muscu') ? 'muscu' : '';
      const cardioSetsRaw = Array.isArray(d.cardioSets) ? d.cardioSets : [];
      const muscuSetsRaw = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);
      if (!type) type = cardioSetsRaw.length ? 'cardio' : (muscuSetsRaw.length ? 'muscu' : '');
      if (!type && (isSwim || isYoga || isStretch || isWalkRun)) type = 'cardio';

      if (type === 'cardio') {
        let sets = cardioSetsRaw.map((cs) => {
          const durationSec = num(cs?.durationSec, 0) || (num(cs?.durationMin ?? cs?.minutes, 0) * 60);
          const distanceKm = cs?.distanceKm != null ? num(cs.distanceKm) : (cs?.km != null ? num(cs.km) : (cs?.meters != null ? num(cs.meters) / 1000 : 0));
          const calories = num(cs?.calories, 0);
          return { durationSec: durationSec || undefined, distanceKm: distanceKm || undefined, calories: calories || undefined };
        }).filter(s => (s.durationSec || s.distanceKm || s.calories));

        if (sets.length === 0 && swim) {
          const poolLength = num(swim.poolLength, 0);
          const lapCount = num(swim.lapCount, 0);
          let totalDistance = num(swim.totalDistance, 0);
          if (!totalDistance && poolLength > 0 && lapCount > 0) {
            totalDistance = poolLength * lapCount * 2;
          }
          const distanceKm = totalDistance ? totalDistance / 1000 : 0;
          const swimSet = {
            distanceKm: distanceKm || undefined,
            laps: lapCount || undefined,
            poolLength: poolLength || undefined,
          };
          if (swimSet.distanceKm || swimSet.laps) {
            sets = [swimSet];
          }
        }

        if (sets.length === 0 && yoga) {
          const durationMin = num(yoga.durationMin ?? yoga.duration, 0);
          const durationSec = durationMin > 0 ? durationMin * 60 : 0;
          const style = typeof yoga.style === 'string' ? yoga.style.trim() : '';
          const focus = typeof yoga.focus === 'string' ? yoga.focus.trim() : '';
          const set = {
            durationSec: durationSec || 600,
            style: style || undefined,
            focus: focus || undefined,
          };
          sets = [set];
        }

        if (sets.length === 0 && stretch) {
          const durationSec = num(stretch.durationSec ?? stretch.duration, 0);
          if (durationSec > 0) {
            sets = [{ durationSec }];
          }
        }

        if (sets.length === 0 && walkRun) {
          const distanceKm = num(walkRun.distanceKm, 0);
          const durationMin = num(walkRun.durationMin, 0);
          const durationSec = durationMin > 0 ? durationMin * 60 : 0;
          if (distanceKm > 0 || durationSec > 0) {
            sets = [{
              distanceKm: distanceKm || undefined,
              durationSec: durationSec || undefined
            }];
          }
        }

        if (sets.length === 0) return null;
        const subType = isSwim ? 'swim' : (isYoga ? 'yoga' : (isStretch ? 'stretch' : (isWalkRun ? 'walk_run' : undefined)));
        const entry = {
          exerciseId: it.id || it._id || it.slug || String(it.name || it.label || 'exo').toLowerCase(),
          name: String(it.name || it.label || it.exoName || 'Exercice'),
          type: 'cardio',
          subType,
          notes: typeof d?.notes === 'string' && d.notes.trim() ? d.notes.trim() : undefined,
          sets,
        };
        return entry;
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

function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^\w\s]/g, ' ') // Garde lettres, chiffres et espaces
    .replace(/\s+/g, ' ') // Normalise les espaces multiples
    .trim();
}

// Calcule la similarité entre deux strings pour fuzzy matching
function calculateSimilarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  // Match exact
  if (s1 === s2) return 1.0;

  // Si l'un contient l'autre (ex: "développé couché" contient "developpe couche")
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Découpe en mots et compare
  const words1 = s1.split(' ').filter(w => w.length > 0);
  const words2 = s2.split(' ').filter(w => w.length > 0);

  // Compte les mots en commun
  const commonWords = words1.filter(w1 => words2.some(w2 => w2.includes(w1) || w1.includes(w2)));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);

  return similarity;
}

function getLastExerciseData(exerciseId) {
  return getSessions({ limit: 50 }).then((res) => {
    const sessions = Array.isArray(res) ? res : (res?.items || []);
    const foundSessions = [];

    for (const session of sessions) {
      if (!session?.entries) continue;

      const entry = session.entries.find(e => {
        if (!e) return false;

        // Compare avec similarité pour être plus tolérant
        const eId = e?.exerciseId || e?.id || '';
        const eName = e?.exerciseName || e?.name || '';

        // Match exact ou similarité élevée (>= 0.85)
        const idSimilarity = calculateSimilarity(exerciseId, eId);
        const nameSimilarity = calculateSimilarity(exerciseId, eName);

        return idSimilarity >= 0.85 || nameSimilarity >= 0.85;
      });

      if (entry && entry.sets && entry.sets.length > 0) {
        foundSessions.push({
          lastSet: entry.sets[entry.sets.length - 1],
          allSets: entry.sets,
          type: entry.type,
          sessionDate: session.startedAt || session.createdAt
        });

        if (foundSessions.length >= 2) break;
      }
    }

    if (foundSessions.length === 0) {
      return null;
    }

    return {
      last: foundSessions[0],
      previous: foundSessions[1] || null
    };
  }).catch(() => null);
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
  getLastExerciseData,
};
