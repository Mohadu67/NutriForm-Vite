const History = require('../models/History');
const WorkoutSession = require('../models/WorkoutSession');
const { deriveFromHistory, deriveFromSessions } = require('../services/stats.service');
const { computeSessionFromEntries } = require('../services/calorie.service');

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

    let lastWeight = null;
    let imc = null;
    let calories = null;
    let lastSession = null;
    let lastWorkoutDuration = null;
    let lastCaloriesBurned = null;
    let caloriesBurnedWeek = 0;
    let totalSessions = 0;
    let streakDays = 0;
    let favoriteMuscleGroup = null;
    let nextGoal = null;

    let workoutsCount7dSess = 0;
    let calories7dSess = 0;

    let fromSessions = null;

    const workoutDaysSet = new Set();
    const muscleCount = new Map();

    for (const h of history) {
      const meta = h.meta || {};

      // Variantes de champs pour mieux couvrir ta base
      // Poids
      if (lastWeight == null) {
        if (typeof meta.poids === 'number') lastWeight = meta.poids;
        else if (typeof meta.weightKg === 'number') lastWeight = meta.weightKg;
      }
      // IMC alternatif
      if (imc == null && typeof meta.bmi === 'number') imc = meta.bmi;
      // Calories journalières
      if (calories == null) {
        if (typeof meta.calorie === 'number') calories = meta.calorie;
        else if (typeof meta.dailyCalories === 'number') calories = meta.dailyCalories;
      }

      if (lastWeight == null && typeof meta.weight === 'number') lastWeight = meta.weight;
      if (imc == null && (typeof meta.imc === 'number' || typeof meta.imc === 'string')) imc = meta.imc;
      if (calories == null && (typeof meta.caloriesDaily === 'number' || typeof meta.calories === 'number')) {
        calories = meta.caloriesDaily ?? meta.calories;
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

        const d = new Date(h.createdAt);
        const key = d.toISOString().slice(0, 10);
        workoutDaysSet.add(key);

        if (d >= weekAgo) {
          if (typeof meta.caloriesBurned === 'number') caloriesBurnedWeek += meta.caloriesBurned;
          else if (typeof meta.kcalBurned === 'number') caloriesBurnedWeek += meta.kcalBurned;
          else if (typeof meta.kcal === 'number') caloriesBurnedWeek += meta.kcal;
        }

        if (Array.isArray(meta.muscles)) {
          for (const m of meta.muscles) {
            const k = String(m).trim();
            if (!k) continue;
            muscleCount.set(k, (muscleCount.get(k) || 0) + 1);
          }
        }
      }

      if (!nextGoal && (meta.nextGoal || meta.goal)) {
        nextGoal = meta.nextGoal || meta.goal;
      }
    }

    // Fallback: agréger depuis une éventuelle collection de séances
    try {
      if (typeof WorkoutSession?.find === 'function') {
        const sessions = await WorkoutSession.find({ userId }).sort({ startedAt: -1 }).limit(30).lean();
        if (Array.isArray(sessions) && sessions.length) {
          totalSessions = Math.max(totalSessions, sessions.length);

          // Complète calories/durée depuis les entrées si manquant
          const weightForCalc = lastWeight ?? (history.find(h => (h.meta?.poids ?? h.meta?.weightKg ?? h.meta?.weight))?.meta?.poids || null);
          const enriched = sessions.map((s) => {
            const hasKcal = typeof s.caloriesBurned === 'number' || typeof s.kcal === 'number';
            const hasDur = typeof s.durationMinutes === 'number' || typeof s.duration === 'number' || (s.endedAt && s.startedAt);
            if (hasKcal && hasDur) return s;
            const est = computeSessionFromEntries(s.entries || [], weightForCalc);
            return {
              ...s,
              caloriesBurned: hasKcal ? (s.caloriesBurned ?? s.kcal) : est.caloriesBurned,
              durationMinutes: hasDur ? (s.durationMinutes ?? s.duration ?? (s.endedAt && s.startedAt ? Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 60000) : null)) : est.durationMinutes,
            };
          });

          // Dernière séance enrichie
          const s0 = enriched[0];
          let dur0 = s0?.durationMinutes ?? s0?.duration ?? (s0?.endedAt && s0?.startedAt ? Math.round((new Date(s0.endedAt) - new Date(s0.startedAt)) / 60000) : null);
          if (typeof dur0 === 'number' && dur0 < 0) dur0 = null; // clamp valeurs négatives
          // On ne renvoie plus la durée dans le résumé (UI: carte supprimée)
          if (!lastSession) lastSession = s0?.name || s0?.label || 'Séance';
          if (lastCaloriesBurned == null && typeof s0?.caloriesBurned === 'number') lastCaloriesBurned = s0.caloriesBurned;

          // Semaine courante
          const within7d = (d) => new Date(d) >= weekAgo;
          const weekSessions = enriched.filter((s) => s.startedAt ? within7d(s.startedAt) : (s.createdAt ? within7d(s.createdAt) : false));
          const sumKcal = weekSessions.reduce((acc, s) => acc + (Number(s.caloriesBurned || s.kcal || 0) || 0), 0);
          caloriesBurnedWeek = Math.max(caloriesBurnedWeek, sumKcal);
          workoutsCount7dSess = weekSessions.length;
          calories7dSess = sumKcal;

          fromSessions = deriveFromSessions(enriched);
        }
      }
    } catch (_) {}

    // Calcul du streak sur la base des jours consécutifs avec séance
    if (workoutDaysSet.size > 0) {
      let cursor = new Date();
      // normaliser à J
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

    if (muscleCount.size > 0) {
      favoriteMuscleGroup = Array.from(muscleCount.entries()).sort((a, b) => b[1] - a[1])[0][0];
    }

    const derived = deriveFromHistory(history, weekAgo);

    if (lastCaloriesBurned == null && derived.lastCaloriesBurnedDerived != null) {
      lastCaloriesBurned = derived.lastCaloriesBurnedDerived;
    }

    return res.json({
      // Priorité: stats dérivées de l'historique, sinon celles des sessions
      avgWorkoutDurationMin: null,
      avgCaloriesPerWorkout: derived.avgCaloriesPerWorkout ?? null,
      workoutsCount7d: workoutsCount7dSess || (derived.workoutsCount7d ?? 0),
      calories7d: calories7dSess || (derived.calories7d ?? 0),

      // Tes champs existants (avec fallback sessions si utile)
      lastWeight,
      imc,
      calories,
      lastSession: lastSession || (fromSessions ? fromSessions.lastSessionName : null),
      lastWorkoutDuration: null,
      lastCaloriesBurned,
      caloriesBurnedWeek,
      totalSessions: totalSessions || (fromSessions ? fromSessions.totalSessions : 0),
      streakDays,
      favoriteMuscleGroup,
      nextGoal,

      // On expose aussi quelques champs dérivés utiles pour ton UI
      initialWeight: derived.initialWeight,
      latestWeight: derived.latestWeight,
      weightChange: derived.weightChange,
      lastWorkoutAt: derived.lastWorkoutAt,
    });
  } catch (error) {
    console.error('Erreur getUserSummary:', error);
    return res.status(500).json({ message: "Erreur lors de la récupération du résumé utilisateur" });
  }
}

module.exports = { addHistory, getHistory, deleteHistory, getUserSummary };