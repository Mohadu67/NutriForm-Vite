// backend/services/stats.service.js
// Dérive des statistiques à partir de l'historique et (optionnellement) des séances.
// Mobile-first côté UI, ici on rend les champs robustes côté données.

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function minutesBetween(a, b) {
  if (!a || !b) return null;
  const da = new Date(a); const db = new Date(b);
  if (isNaN(da) || isNaN(db)) return null;
  return Math.round((db - da) / 60000);
}

function parseMinutes(val) {
  if (val == null) return null;
  if (typeof val === 'number' && Number.isFinite(val)) return Math.round(val);
  if (typeof val === 'string') {
    // Accepte "45", "45.5", "45 min", "1h10", "00:45"
    const s = val.trim().toLowerCase();
    if (/^\d+(\.\d+)?$/.test(s)) return Math.round(Number(s));
    const m1 = s.match(/(\d+(?:\.\d+)?)\s*min/);
    if (m1) return Math.round(Number(m1[1]));
    const m2 = s.match(/(\d+)\s*h(?:\s*(\d+)\s*min)?/);
    if (m2) {
      const h = Number(m2[1] || 0);
      const m = Number(m2[2] || 0);
      return h * 60 + m;
    }
    const m3 = s.match(/^(\d{1,2}):(\d{2})$/); // mm:ss
    if (m3) {
      const mm = Number(m3[1]);
      const ss = Number(m3[2]);
      return Math.round(mm + ss / 60);
    }
  }
  return null;
}

// history: tableau d'objets { action, meta, createdAt }
function deriveFromHistory(history = [], sinceDate = null) {
  const res = {
    initialWeight: null,
    latestWeight: null,
    weightChange: null,
    avgWorkoutDurationMin: null,
    avgCaloriesPerWorkout: null,
    workoutsCount7d: 0,
    calories7d: 0,
    lastWorkoutAt: null,
    // champs additionnels optionnels
    lastCaloriesBurnedDerived: null,
  };

  let sumDur = 0, cDur = 0;
  let sumKcal = 0, cKcal = 0;

  const weekStart = sinceDate ? new Date(sinceDate) : new Date(Date.now() - 7 * 864e5);

  // Poids initial (plus ancien) & récent (plus récent)
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i]?.meta || {};
    const w = safeNumber(m.poids ?? m.weight ?? m.weightKg);
    if (w != null) { res.initialWeight = w; break; }
  }
  for (let i = 0; i < history.length; i++) {
    const m = history[i]?.meta || {};
    const w = safeNumber(m.poids ?? m.weight ?? m.weightKg);
    if (w != null) { res.latestWeight = w; break; }
  }
  if (res.initialWeight != null && res.latestWeight != null) {
    res.weightChange = +(res.latestWeight - res.initialWeight).toFixed(1);
  }

  for (const h of history) {
    const meta = h?.meta || {};
    const created = h?.createdAt ? new Date(h.createdAt) : null;

    const isWorkout = /(workout|seance|session|training|entrainement)/i.test(String(h?.action || ''))
      || meta.duration != null || meta.durationMinutes != null
      || meta.caloriesBurned != null || meta.kcal != null || meta.kcalBurned != null
      || Array.isArray(meta.entries);

    if (!isWorkout) continue;

    // Durée: durationMinutes, duration, startedAt/endedAt, ou texte
    const durFromFields = safeNumber(meta.durationMinutes ?? meta.duration) ?? parseMinutes(meta.durationText);
    const dur = durFromFields ?? minutesBetween(meta.startedAt, meta.endedAt);
    if (dur != null) { sumDur += dur; cDur++; }

    // Calories: caloriesBurned, kcal*, nombre en string
    const kcal = safeNumber(meta.caloriesBurned ?? meta.kcalBurned ?? meta.kcal ?? (typeof meta.calories === 'string' ? meta.calories.replace(/[^0-9.]/g, '') : null));
    if (kcal != null) {
      sumKcal += kcal; cKcal++;
      // garde la dernière valeur rencontrée chronologiquement
      if (res.lastCaloriesBurnedDerived == null) res.lastCaloriesBurnedDerived = kcal;
    }

    // Compteurs sur 7 jours
    if (created && created >= weekStart) {
      res.workoutsCount7d += 1;
      if (kcal != null) res.calories7d += kcal;
    }

    // Timestamp de dernière séance
    const refDate = meta.endedAt || meta.startedAt || h?.createdAt;
    if (!res.lastWorkoutAt || (refDate && new Date(refDate) > new Date(res.lastWorkoutAt))) {
      res.lastWorkoutAt = refDate ? new Date(refDate).toISOString() : res.lastWorkoutAt;
    }
  }

  if (cDur) res.avgWorkoutDurationMin = Math.round(sumDur / cDur);
  if (cKcal) res.avgCaloriesPerWorkout = Math.round(sumKcal / cKcal);

  return res;
}

// sessions: tableau d'objets { startedAt, endedAt, durationMinutes, caloriesBurned, name, label }
function deriveFromSessions(sessions = []) {
  const out = {
    totalSessions: sessions.length || 0,
    lastSessionName: null,
    lastSessionDurationMin: null,
    avgWorkoutDurationMinFromSessions: null,
    avgCaloriesPerWorkoutFromSessions: null,
    workoutsCount7dFromSessions: 0,
    calories7dFromSessions: 0,
  };
  if (!sessions.length) return out;

  const s0 = sessions[0];
  const dur0 = safeNumber(s0?.durationMinutes ?? s0?.duration) ?? minutesBetween(s0?.startedAt, s0?.endedAt);
  out.lastSessionName = s0?.name || s0?.label || 'Séance';
  if (dur0 != null) out.lastSessionDurationMin = dur0;

  const weekStart = new Date(Date.now() - 7 * 864e5);
  let sumDur = 0, cDur = 0; let sumKcal = 0, cKcal = 0;

  for (const s of sessions) {
    const dur = safeNumber(s?.durationMinutes ?? s?.duration) ?? minutesBetween(s?.startedAt, s?.endedAt);
    if (dur != null) { sumDur += dur; cDur++; }

    const kcal = safeNumber(s?.caloriesBurned ?? s?.kcal);
    if (kcal != null) { sumKcal += kcal; cKcal++; }

    const ref = s?.startedAt || s?.createdAt;
    if (ref && new Date(ref) >= weekStart) {
      out.workoutsCount7dFromSessions += 1;
      if (kcal != null) out.calories7dFromSessions += kcal;
    }
  }

  if (cDur) out.avgWorkoutDurationMinFromSessions = Math.round(sumDur / cDur);
  if (cKcal) out.avgCaloriesPerWorkoutFromSessions = Math.round(sumKcal / cKcal);

  return out;
}

module.exports = { deriveFromHistory, deriveFromSessions };