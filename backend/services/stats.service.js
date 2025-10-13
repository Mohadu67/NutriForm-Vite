function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickWeight(meta = {}) {
  return safeNumber(meta.poids ?? meta.weightKg ?? meta.weight);
}

function pickHeightCm(meta = {}) {
  return safeNumber(meta.height ?? meta.taille ?? meta.tailleCm ?? meta.heightCm);
}

function pickDailyCalories(meta = {}) {
  const direct = meta.calorie ?? meta.dailyCalories ?? meta.caloriesDaily;
  if (direct != null) {
    if (typeof direct === 'string') {
      const cleaned = direct.replace(/[^0-9.]/g, '');
      return safeNumber(cleaned);
    }
    return safeNumber(direct);
  }
  const looksBurn = meta.caloriesBurned != null || meta.kcalBurned != null || meta.kcal != null;
  if (!looksBurn && meta.calories != null) {
    if (typeof meta.calories === 'string') {
      const cleaned = meta.calories.replace(/[^0-9.]/g, '');
      return safeNumber(cleaned);
    }
    return safeNumber(meta.calories);
  }
  return null;
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
    const m3 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m3) {
      const mm = Number(m3[1]);
      const ss = Number(m3[2]);
      return Math.round(mm + ss / 60);
    }
  }
  return null;
}

function deriveFromHistory(history = [], sinceDate = null) {
  const res = {
    initialWeight: null,
    latestWeight: null,
    previousWeight: null,
    weightChange: null,
    imc: null,
    lastDate: null,

    avgWorkoutDurationMin: null,
    avgCaloriesPerWorkout: null,
    workoutsCount7d: 0,
    calories7d: 0,
    lastWorkoutAt: null,
    lastCaloriesBurnedDerived: null,
    dailyCalories: null,
    lastCaloriesBurned: null,
    caloriesBurnedWeek: 0,
    avgDailyCalories7d: null,
    avgCaloriesPerWorkout7d: null,
  };

  let sumDur = 0, cDur = 0;
  let sumKcal = 0, cKcal = 0;

  const weekStart = sinceDate ? new Date(sinceDate) : new Date(Date.now() - 7 * 864e5);
  const intakeByDay = new Map(); 

  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i]?.meta || {};
    const w = pickWeight(m);
    if (w != null) { res.initialWeight = w; break; }
  }
  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const m = h?.meta || {};
    const w = pickWeight(m);
    if (w != null) {
      if (res.latestWeight == null) {
        res.latestWeight = w;
        res.lastDate = (h?.createdAt || h?.date) ? new Date(h.createdAt || h.date).toISOString() : null;
        const hCm = pickHeightCm(m);
        if (hCm && w) {
          const hM = hCm / 100;
          res.imc = +(w / (hM * hM)).toFixed(1);
        } else {
          const imcFromMeta = (m.imc != null) ? safeNumber(m.imc) : (m.bmi != null ? safeNumber(m.bmi) : null);
          if (imcFromMeta != null) res.imc = imcFromMeta;
        }
      } else if (res.previousWeight == null) {
        res.previousWeight = w;
        break;
      }
    }
  }

  for (let i = 0; i < history.length; i++) {
    const m = history[i]?.meta || {};
    const dc = pickDailyCalories(m);
    if (dc != null) { res.dailyCalories = dc; break; }
  }

  if (res.initialWeight != null && res.latestWeight != null) {
    res.weightChange = +(res.latestWeight - res.initialWeight).toFixed(1);
  }

  for (const h of history) {
    const meta = h?.meta || {};
    const created = h?.createdAt ? new Date(h.createdAt) : (h?.date ? new Date(h.date) : null);

    
    if (created && created >= weekStart) {
      const dc = pickDailyCalories(meta);
      if (dc != null) {
        const key = created.toISOString().slice(0, 10);
        if (!intakeByDay.has(key)) intakeByDay.set(key, dc); 
      }
    }

    const isWorkout = /(workout|seance|session|training|entrainement)/i.test(String(h?.action || ''))
      || meta.duration != null || meta.durationMinutes != null
      || meta.caloriesBurned != null || meta.kcal != null || meta.kcalBurned != null
      || Array.isArray(meta.entries);

    if (!isWorkout) continue;

    const durFromFields = safeNumber(meta.durationMinutes ?? meta.duration) ?? parseMinutes(meta.durationText);
    const dur = durFromFields ?? minutesBetween(meta.startedAt, meta.endedAt);
    if (dur != null) { sumDur += dur; cDur++; }

    const kcalRaw = meta.caloriesBurned ?? meta.kcalBurned ?? meta.kcal ?? meta.calories;
    const kcal = typeof kcalRaw === 'string' ? safeNumber(kcalRaw.replace(/[^0-9.]/g, '')) : safeNumber(kcalRaw);
    if (kcal != null) {
      sumKcal += kcal; cKcal++;
      if (res.lastCaloriesBurnedDerived == null) res.lastCaloriesBurnedDerived = kcal;
      if (res.lastCaloriesBurned == null) res.lastCaloriesBurned = kcal; 
    }

    if (created && created >= weekStart) {
      res.workoutsCount7d += 1;
      if (kcal != null) res.calories7d += kcal;
    }

    const refDate = meta.endedAt || meta.startedAt || h?.createdAt;
    if (!res.lastWorkoutAt || (refDate && new Date(refDate) > new Date(res.lastWorkoutAt))) {
      res.lastWorkoutAt = refDate ? new Date(refDate).toISOString() : res.lastWorkoutAt;
    }
  }

  if (intakeByDay.size) {
    let sum = 0;
    for (const v of intakeByDay.values()) sum += (Number(v) || 0);
    res.avgDailyCalories7d = Math.round(sum / intakeByDay.size);
  }

  if (cDur) res.avgWorkoutDurationMin = Math.round(sumDur / cDur);
  if (cKcal) res.avgCaloriesPerWorkout = Math.round(sumKcal / cKcal);

  res.caloriesBurnedWeek = res.calories7d;
  res.avgCaloriesPerWorkout7d = res.workoutsCount7d ? Math.round(res.calories7d / res.workoutsCount7d) : null;

  return { ...res, variation: res.weightChange };
}

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