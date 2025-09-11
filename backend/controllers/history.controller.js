const History = require('../models/History');
const WorkoutSession = require('../models/WorkoutSession');
const { deriveFromHistory, deriveFromSessions } = require('../services/stats.service');
const { computeSessionFromEntries } = require('../services/calorie.service');

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickWeight(meta = {}) {
  return numOrNull(meta.poids ?? meta.weightKg ?? meta.weight);
}

async function addHistory(req, res) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[addHistory] authHeader =', req.headers?.authorization);
      console.log('[addHistory] userId =', req.userId);
      console.log('[addHistory] body =', req.body);
    }

    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Non autorisé (token manquant ou invalide).' });

    let { action, meta } = req.body || {};
    action = (action && String(action).trim()) || 'IMC_CALC';

    const doc = new History({ userId, action, meta });
    await doc.save();

    return res.status(201).json(doc);
  } catch (error) {
    console.error('Erreur addHistory:', error);
    return res.status(500).json({ message: "Erreur lors de l'ajout de l'historique" });
  }
}

async function getHistory(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Non autorisé (token manquant ou invalide).' });

    const history = await History.find({ userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'prenom pseudo email');

    return res.status(200).json(history);
  } catch (error) {
    console.error('Erreur getHistory:', error);
    return res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
  }
}

async function deleteHistory(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params || {};
    if (!userId) return res.status(401).json({ message: 'Non autorisé' });
    if (!id) return res.status(400).json({ message: 'Paramètre id manquant' });

    const doc = await History.findById(id);
    if (!doc) return res.status(404).json({ message: 'Historique introuvable' });
    if (String(doc.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    await doc.deleteOne();
    return res.status(204).send();
  } catch (error) {
    console.error('Erreur deleteHistory:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
}

async function getUserSummary(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Non autorisé (token manquant ou invalide).' });

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const history = await History.find({ userId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const derived = deriveFromHistory(history, weekAgo);

    let calories = null;
    let lastSession = null;
    let lastWorkoutDuration = null;
    let lastCaloriesBurned = null;
    let caloriesBurnedWeek = 0;
    let totalSessions = 0;
    let streakDays = 0;
    let nextGoal = null;
    let lastSessionSummary = null;
    let avgKcalAll = null;
    let lastExercisesListFallback = [];
    let favoriteMuscleGroupFallback = null;

    let workoutsCount7dSess = 0;
    let calories7dSess = 0;

    let fromSessions = null;

    const workoutDaysSet = new Set();

    for (const h of history) {
      const meta = h.meta || {};

      if (calories == null) {
        if (typeof meta.calorie === 'number') calories = meta.calorie;
        else if (typeof meta.dailyCalories === 'number') calories = meta.dailyCalories;
        else if (typeof meta.caloriesDaily === 'number') calories = meta.caloriesDaily;
        else if (typeof meta.calories === 'number') calories = meta.calories;
      }

      const isWorkout =
        (typeof h.action === 'string' && /(workout|seance|session|training|entrainement)/i.test(h.action)) ||
        typeof meta.caloriesBurned === 'number' ||
        typeof meta.kcalBurned === 'number' ||
        typeof meta.kcal === 'number' ||
        typeof meta.duration === 'string' ||
        typeof meta.duration === 'number' ||
        Array.isArray(meta.muscles);

      if (isWorkout) {
        if (!lastSession && (meta.sessionName || meta.label || h.action)) {
          lastSession = meta.sessionName || meta.label || h.action;
        }
        if (lastWorkoutDuration == null && (meta.duration != null)) {
          lastWorkoutDuration = typeof meta.duration === 'number' ? `${meta.duration} min` : String(meta.duration);
        }
        if (lastCaloriesBurned == null) {
          if (typeof meta.caloriesBurned === 'number') lastCaloriesBurned = meta.caloriesBurned;
          else if (typeof meta.kcalBurned === 'number') lastCaloriesBurned = meta.kcalBurned;
          else if (typeof meta.kcal === 'number') lastCaloriesBurned = meta.kcal;
        }
        totalSessions += 1;

        const d = h?.createdAt ? new Date(h.createdAt) : (h?.date ? new Date(h.date) : new Date());
        const key = d.toISOString().slice(0, 10);
        workoutDaysSet.add(key);

        if (d >= weekAgo) {
          if (typeof meta.caloriesBurned === 'number') caloriesBurnedWeek += meta.caloriesBurned;
          else if (typeof meta.kcalBurned === 'number') caloriesBurnedWeek += meta.kcalBurned;
          else if (typeof meta.kcal === 'number') caloriesBurnedWeek += meta.kcal;
        }
      }

      if (!nextGoal && (meta.nextGoal || meta.goal)) {
        nextGoal = meta.nextGoal || meta.goal;
      }
    }

    try {
      if (typeof WorkoutSession?.find === 'function') {
        const sessions = await WorkoutSession.find({ userId }).sort({ startedAt: -1 }).limit(30).lean();
        if (Array.isArray(sessions) && sessions.length) {
          totalSessions = Math.max(totalSessions, sessions.length);

          const weightForCalc = derived.latestWeight ?? (() => {
            const hw = history.find(h => pickWeight(h.meta) != null);
            return hw ? pickWeight(hw.meta) : null;
          })();

          const pickKcal = (obj) => {
            const v = obj?.calories ?? obj?.caloriesBurned ?? obj?.kcal;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
          };

          const enriched = sessions.map((s) => {
            const hasKcal = typeof s.calories === 'number' || typeof s.caloriesBurned === 'number' || typeof s.kcal === 'number';
            const hasDur = typeof s.durationMinutes === 'number' || typeof s.duration === 'number' || (s.endedAt && s.startedAt);
            if (hasKcal && hasDur) return s;
            const est = computeSessionFromEntries(s.entries || [], weightForCalc);
            const kcalValue = hasKcal ? (s.calories ?? s.caloriesBurned ?? s.kcal) : est.caloriesBurned;
            const durMin = hasDur
              ? (s.durationMinutes ?? s.duration ?? (s.endedAt && s.startedAt ? Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 60000) : null))
              : est.durationMinutes;
            return {
              ...s,
              calories: typeof s.calories === 'number' ? s.calories : kcalValue,
              caloriesBurned: typeof s.caloriesBurned === 'number' ? s.caloriesBurned : kcalValue,
              durationMinutes: durMin,
            };
          });

          const s0 = enriched[0];
          if (s0 && s0.clientSummary) {
            lastSessionSummary = s0.clientSummary;
          }
          let dur0 = s0?.durationMinutes ?? s0?.duration ?? (s0?.endedAt && s0?.startedAt ? Math.round((new Date(s0.endedAt) - new Date(s0.startedAt)) / 60000) : null);
          if (typeof dur0 === 'number' && dur0 < 0) dur0 = null; // clamp valeurs négatives
          if (lastWorkoutDuration == null && dur0 != null) {
            lastWorkoutDuration = typeof dur0 === 'number' ? `${dur0} min` : String(dur0);
          }
          if (!lastSession) lastSession = s0?.name || s0?.label || 'Séance';
          if (lastCaloriesBurned == null) {
            if (typeof s0?.calories === 'number') lastCaloriesBurned = s0.calories;
            else if (typeof s0?.caloriesBurned === 'number') lastCaloriesBurned = s0.caloriesBurned;
          }

          const within7d = (d) => new Date(d) >= weekAgo;
          const weekSessions = enriched.filter((s) => s.startedAt ? within7d(s.startedAt) : (s.createdAt ? within7d(s.createdAt) : false));
          const sumKcal = weekSessions.reduce((acc, s) => acc + (Number(s.calories ?? s.caloriesBurned ?? s.kcal ?? 0) || 0), 0);
          caloriesBurnedWeek = Math.max(caloriesBurnedWeek, sumKcal);
          workoutsCount7dSess = weekSessions.length;
          calories7dSess = sumKcal;

          fromSessions = deriveFromSessions(enriched);

          avgKcalAll = kcalArray.length ? Math.round(kcalArray.reduce((a,b)=>a+b,0) / kcalArray.length) : null;

          lastExercisesListFallback = [];
          if ((!lastSessionSummary || !Array.isArray(lastSessionSummary.exercises) || !lastSessionSummary.exercises.length) && Array.isArray(s0?.entries)) {
            lastExercisesListFallback = s0.entries.map(e => ({ exerciseName: e.exerciseName || e.name || e.label || 'Exercice', done: true }));
          }

          let favoriteMuscleFromEntries = null;
          const muscleMap = new Map();
          for (const sess of enriched) {
            const entries = Array.isArray(sess?.entries) ? sess.entries : [];
            for (const e of entries) {
              const groups = Array.isArray(e?.muscles) ? e.muscles : (e?.muscleGroup ? [e.muscleGroup] : (e?.muscle ? [e.muscle] : []));
              for (const g of groups) {
                const key = String(g).trim();
                if (!key) continue;
                muscleMap.set(key, (muscleMap.get(key) || 0) + 1);
              }
            }
          }
          for (const [k, v] of muscleMap.entries()) {
            if (!favoriteMuscleFromEntries || v > favoriteMuscleFromEntries.count) favoriteMuscleFromEntries = { name: k, count: v };
          }
          favoriteMuscleGroupFallback = favoriteMuscleFromEntries?.name || null;
        }
      }
    } catch (_) {}

    if (workoutDaysSet.size > 0) {
      let cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      while (true) {
        const key = cursor.toISOString().slice(0, 10);
        if (workoutDaysSet.has(key)) {
          streakDays += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
    }

    if (calories == null && derived.dailyCalories != null) {
      calories = derived.dailyCalories;
    }
    if (lastCaloriesBurned == null) {
      lastCaloriesBurned = derived.lastCaloriesBurned ?? derived.lastCaloriesBurnedDerived ?? null;
    }
    caloriesBurnedWeek = Math.max(caloriesBurnedWeek, derived.caloriesBurnedWeek ?? 0);

    return res.json({
      avgWorkoutDurationMin: derived.avgWorkoutDurationMin ?? null,
      avgCaloriesPerWorkout: derived.avgCaloriesPerWorkout ?? avgKcalAll ?? null,
      workoutsCount7d: workoutsCount7dSess || (derived.workoutsCount7d ?? 0),
      calories7d: calories7dSess || (derived.calories7d ?? 0),
      avgDailyCalories7d: derived.avgDailyCalories7d ?? null,
      avgCaloriesPerWorkout7d: derived.avgCaloriesPerWorkout7d ?? null,

      lastWeight: (derived.previousWeight != null ? derived.previousWeight : (derived.latestWeight ?? null)),
      imc: derived.imc ?? null,
      calories,
      lastSession: lastSession || (fromSessions ? fromSessions.lastSessionName : null),
      lastWorkoutDuration: lastWorkoutDuration ?? null,
      lastCaloriesBurned: lastCaloriesBurned ?? derived.lastCaloriesBurnedDerived ?? null,
      lastPlannedExercises: lastSessionSummary?.plannedExercises ?? null,
      lastCompletedExercises: lastSessionSummary?.completedExercises ?? null,
      lastSkippedExercises: lastSessionSummary?.skippedExercises ?? null,
      lastExercisesList: Array.isArray(lastSessionSummary?.exercises) && lastSessionSummary.exercises.length ? lastSessionSummary.exercises : lastExercisesListFallback,
      caloriesBurnedWeek,
      totalSessions: totalSessions || (fromSessions ? fromSessions.totalSessions : 0),
      streakDays,
      favoriteMuscleGroup: derived.favoriteMuscleGroup || (fromSessions ? fromSessions.favoriteMuscleGroupFromSessions : null) || favoriteMuscleGroupFallback,
      topMuscles7d: derived.topMuscles7d || (fromSessions ? fromSessions.topMuscles7dFromSessions : []),
      muscleCounts7d: derived.muscleCounts7d || (fromSessions ? fromSessions.muscleCounts7dFromSessions : {}),
      nextGoal,

      variation: derived.variation ?? derived.weightChange ?? null,
      lastDate: derived.lastDate ?? null,

      initialWeight: derived.initialWeight ?? null,
      latestWeight: derived.latestWeight ?? null,
      previousWeight: derived.previousWeight ?? null,
      weightChange: derived.weightChange ?? null,
      lastWorkoutAt: derived.lastWorkoutAt ?? null,
    });
  } catch (error) {
    console.error('Erreur getUserSummary:', error);
    return res.status(500).json({ message: "Erreur lors de la récupération du résumé utilisateur" });
  }
}

module.exports = { addHistory, getHistory, deleteHistory, getUserSummary };