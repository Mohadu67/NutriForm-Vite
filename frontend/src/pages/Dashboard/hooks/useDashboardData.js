import { useMemo, useCallback, useState, useEffect } from "react";
import { loadExercises } from "../../../utils/exercisesLoader";

/**
 * Hook personnalisé pour gérer toutes les données du Dashboard
 * Centralise la logique de calcul des statistiques
 */
export const useDashboardData = (sessions, records) => {
  const [exercisesDb, setExercisesDb] = useState([]);
  const [userSessions, setUserSessions] = useState([]);

  const parseDate = useCallback((raw) => {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw) ? null : raw;
    if (typeof raw === "number") {
      const d = new Date(raw);
      return isNaN(d) ? null : d;
    }
    if (typeof raw === "string") {
      const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
      const d = new Date(iso);
      return isNaN(d) ? null : d;
    }
    return null;
  }, []);

  // Normaliser les sessions
  useEffect(() => {
    const list = Array.isArray(sessions) ? sessions : [];
    const normalize = (s) => {
      const raw = Array.isArray(s?.entries)
        ? s.entries
        : Array.isArray(s?.items)
        ? s.items
        : Array.isArray(s?.exercises)
        ? s.exercises
        : [];
      const entries = raw.map((e) => {
        if (e && typeof e === "object") {
          const name = e.name || e.label || e.exerciseName || e.exoName || e.title || "Exercice";
          return { ...e, name };
        }
        return { name: String(e ?? "Exercice") };
      });
      return { ...s, entries, items: entries, exercises: entries };
    };
    setUserSessions(list.map(normalize));
  }, [sessions]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalSessions = userSessions.length;

    const getWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const last7Days = userSessions.filter((s) => {
      const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
      if (!date) return false;
      return date >= getWeekStart();
    }).length;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = userSessions
      .map((s) => {
        const d = parseDate(s?.date || s?.createdAt || s?.endedAt);
        if (!d) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      })
      .filter(Boolean)
      .sort((a, b) => b - a);

    const uniqueDates = [...new Set(sortedDates.map((d) => d.getTime()))].map((t) => new Date(t));

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      if (uniqueDates[i]?.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    const totalMinutes = userSessions.reduce((acc, s) => {
      const mins = s?.durationMinutes ?? s?.minutes ?? 0;
      return acc + mins;
    }, 0);

    const totalHours = Math.floor(totalMinutes / 60);

    return { totalSessions, last7Days, streak, totalHours, totalMinutes };
  }, [userSessions, parseDate]);

  // IMC & Poids
  const imcPoints = useMemo(() => records.filter((r) => r.type === "imc"), [records]);

  const weightData = useMemo(() => {
    if (!imcPoints.length) return null;
    const latest = imcPoints[imcPoints.length - 1];
    const rawValue = Number(latest.value);
    let interpretation = null;
    if (Number.isFinite(rawValue)) {
      if (rawValue < 18.5) interpretation = "Insuffisant";
      else if (rawValue < 25) interpretation = "Normal";
      else if (rawValue < 30) interpretation = "Surpoids";
      else interpretation = "Obésité";
    }
    return {
      bmi: Number.isFinite(rawValue) ? rawValue.toFixed(1) : "--",
      interpretation,
      weight: Number.isFinite(Number(latest.poids)) ? Number(latest.poids).toFixed(1) : null,
    };
  }, [imcPoints]);

  // Calories
  const calorieTargets = useMemo(() => {
    const extractValue = (record) => {
      if (!record || typeof record !== "object") return null;
      const directValue = Number(record.value);
      if (Number.isFinite(directValue)) return directValue;
      return null;
    };

    const isCalorieRecord = (record) => {
      const type = String(record?.type || record?.category || "").toLowerCase();
      return type.includes("calorie") || type.includes("nutrition");
    };

    const entries = records
      .filter((r) => isCalorieRecord(r))
      .map((r) => extractValue(r))
      .filter((v) => v !== null && v > 0);

    if (!entries.length) return null;
    const latest = entries[entries.length - 1];
    return {
      maintenance: Math.round(latest),
      deficit: Math.max(Math.round(latest) - 500, 0),
      surplus: Math.round(latest) + 500,
    };
  }, [records]);

  // Sessions récentes
  const recentSessions = useMemo(() => {
    return userSessions
      .slice()
      .sort((a, b) => {
        const dateA = parseDate(a?.endedAt || a?.date || a?.createdAt);
        const dateB = parseDate(b?.endedAt || b?.date || b?.createdAt);
        return (dateB || 0) - (dateA || 0);
      })
      .slice(0, 5);
  }, [userSessions, parseDate]);

  // Tests RM
  const rmTests = useMemo(() => {
    return records
      .filter((r) => r.type === "rm")
      .map((r) => ({
        exercice: r.exercice,
        rm: r.rm,
        date: r.date,
        poids: r.poids,
        reps: r.reps,
        formulas: r.formulas || {},
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [records]);

  // Tests RM groupés par exercice (pour affichage en lignes scrollables)
  const rmTestsByExercice = useMemo(() => {
    const grouped = {};
    rmTests.forEach((test) => {
      if (!grouped[test.exercice]) {
        grouped[test.exercice] = [];
      }
      grouped[test.exercice].push(test);
    });
    // Trier chaque groupe par date (plus récent d'abord dans chaque ligne)
    Object.keys(grouped).forEach((exercice) => {
      grouped[exercice].sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    return grouped;
  }, [rmTests]);

  // Stats cardio
  const getEntryDistanceKm = useCallback((entry) => {
    if (!entry || typeof entry !== 'object') return 0;
    if (entry.walkRun && entry.walkRun.distanceKm != null) {
      return Number(entry.walkRun.distanceKm) || 0;
    }
    if (entry.swim) {
      const poolLength = Number(entry.swim.poolLength || 0);
      const lapCount = Number(entry.swim.lapCount || 0);
      if (poolLength > 0 && lapCount > 0) {
        return (poolLength * lapCount * 2) / 1000;
      }
    }
    const sets = Array.isArray(entry.sets) ? entry.sets : [];
    let distanceKm = 0;
    for (const set of sets) {
      if (!set) continue;
      if (set.distanceKm != null) distanceKm += Number(set.distanceKm) || 0;
      else if (set.km != null) distanceKm += Number(set.km) || 0;
      else if (set.meters != null) distanceKm += (Number(set.meters) || 0) / 1000;
    }
    return distanceKm;
  }, []);

  const getSportType = useCallback((entry) => {
    const subType = String(entry?.subType || '').toLowerCase();
    if (subType === 'swim') return 'swim';
    if (subType === 'bike') return 'bike';
    if (subType === 'run') return 'run';
    if (subType === 'walk') return 'walk';

    const name = String(entry?.name || '').toLowerCase();
    if (/(natation|swim|piscine|crawl|brasse)/.test(name)) return 'swim';
    if (/(vélo|velo|bike|cyclisme|vtt)/.test(name)) return 'bike';
    if (/(course|running|run|footing|trail|jog)/.test(name)) return 'run';
    if (/(marche|walk|randonnée|rando)/.test(name)) return 'walk';
    return null;
  }, []);

  const sportStats = useMemo(() => {
    const stats = { run: 0, bike: 0, swim: 0, walk: 0 };
    (userSessions || []).forEach((session) => {
      const entries = session?.entries || session?.items || session?.exercises || [];
      entries.forEach((entry) => {
        const sport = getSportType(entry);
        if (sport) {
          stats[sport] += getEntryDistanceKm(entry);
        }
      });
    });
    return {
      run: stats.run.toFixed(1),
      bike: stats.bike.toFixed(1),
      swim: stats.swim.toFixed(1),
      walk: stats.walk.toFixed(1),
      total: (stats.run + stats.bike + stats.swim + stats.walk).toFixed(1),
    };
  }, [userSessions, getEntryDistanceKm, getSportType]);

  // Weight points pour le graphique
  const weightPoints = useMemo(() => {
    return imcPoints
      .map((r) => ({
        value: Number(r.poids),
        date: parseDate(r.date),
      }))
      .filter((p) => Number.isFinite(p.value) && p.date)
      .sort((a, b) => a.date - b.date)
      .slice(-7);
  }, [imcPoints, parseDate]);

  // Best streak
  const bestStreak = useMemo(() => {
    let maxStreak = 0;
    let currentStreak = 0;

    const sortedDates = userSessions
      .map((s) => {
        const d = parseDate(s?.date || s?.createdAt || s?.endedAt);
        if (!d) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      })
      .filter(Boolean)
      .sort((a, b) => b - a);

    const uniqueDates = [...new Set(sortedDates.map((d) => d.getTime()))].map((t) => new Date(t));

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0 || uniqueDates[i].getTime() === uniqueDates[i - 1].getTime() - 86400000) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }, [userSessions, parseDate]);

  // Durée moyenne
  const avgSessionDuration = useMemo(() => {
    if (stats.totalSessions === 0) return 0;
    return Math.round(stats.totalMinutes / stats.totalSessions);
  }, [stats.totalSessions, stats.totalMinutes]);

  // Tendance sessions
  const sessionsTrend = useMemo(() => {
    const getWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const getPreviousWeekStart = () => {
      const weekStart = getWeekStart();
      const previousWeek = new Date(weekStart);
      previousWeek.setDate(weekStart.getDate() - 7);
      return previousWeek;
    };

    const weekStart = getWeekStart();
    const previousWeekStart = getPreviousWeekStart();

    const previousWeekSessions = userSessions.filter((s) => {
      const date = parseDate(s?.date || s?.createdAt || s?.endedAt);
      if (!date) return false;
      return date >= previousWeekStart && date < weekStart;
    }).length;

    const currentWeekSessions = stats.last7Days;

    if (previousWeekSessions === 0) return null;

    const diff = currentWeekSessions - previousWeekSessions;
    return {
      value: Math.abs(diff),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
    };
  }, [userSessions, stats.last7Days, parseDate]);

  // Toutes les sessions triées
  const allSessionsSorted = useMemo(() => {
    return userSessions
      .slice()
      .sort((a, b) => {
        const dateA = parseDate(a?.endedAt || a?.date || a?.createdAt);
        const dateB = parseDate(b?.endedAt || b?.date || b?.createdAt);
        return (dateB || 0) - (dateA || 0);
      });
  }, [userSessions, parseDate]);

  const formatDate = useCallback((date) => {
    const d = parseDate(date);
    if (!d) return "--";
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d);
  }, [parseDate]);

  const extractSessionCalories = useCallback((session) => {
    if (!session) return 0;
    const candidates = [session?.caloriesBurned, session?.calories, session?.stats?.caloriesBurned];
    for (const value of candidates) {
      const num = Number(value);
      if (Number.isFinite(num) && num > 0) return num;
    }
    const entries = session?.entries || session?.items || session?.exercises || [];
    let total = 0;
    entries.forEach((entry) => {
      const cal = Number(entry?.caloriesBurned || entry?.calories || 0);
      if (cal > 0) total += cal;
    });
    return total;
  }, []);

  // Calories hebdomadaires
  const weeklyCalories = useMemo(() => {
    const getWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };
    const weekStart = getWeekStart();
    let total = 0;
    recentSessions.forEach((session) => {
      const date = parseDate(session?.endedAt || session?.date || session?.createdAt);
      if (date && date >= weekStart) {
        total += extractSessionCalories(session);
      }
    });
    return total;
  }, [recentSessions, parseDate, extractSessionCalories]);

  // Changement de poids
  const weightChange = useMemo(() => {
    if (imcPoints.length < 2) return null;
    const first = Number(imcPoints[0].poids);
    const last = Number(imcPoints[imcPoints.length - 1].poids);
    if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
    const change = last - first;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    };
  }, [imcPoints]);

  // Charger la base d'exercices pour le mapping des muscles
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const exercises = await loadExercises("all");
        if (!cancelled) setExercisesDb(exercises);
      } catch {
        // Ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Mapping des muscles secondaires selon le muscle principal
  // Pondération: primaire = 1, secondaire = 0.5
  const SECONDARY_MUSCLES = {
    // Pectoraux -> triceps, épaules avant
    pectoraux: ["triceps", "epaules"],
    // Dos -> biceps, épaules arrière
    "dos-lats": ["biceps", "avant-bras"],
    "dos-superieur": ["biceps", "epaules"],
    "dos-inferieur": ["biceps"],
    dos: ["biceps", "avant-bras"],
    // Épaules -> triceps (pour presses), biceps (pour tirages)
    epaules: ["triceps"],
    // Jambes composés
    quadriceps: ["fessiers", "ischio"],
    fessiers: ["quadriceps", "ischio"],
    ischio: ["fessiers"],
    // Bras (pas de secondaires significatifs)
    biceps: [],
    triceps: [],
  };

  // Distribution musculaire basée sur les exercices des sessions
  const muscleStats = useMemo(() => {
    if (!userSessions.length) return {};

    // Créer un map pour retrouver les exercices par ID/slug uniquement (pas par nom)
    const exerciseMap = new Map();
    exercisesDb.forEach((exercise) => {
      const identifiers = [
        exercise.id,
        exercise._id,
        exercise.slug,
      ].filter(Boolean).map((id) => String(id).toLowerCase());
      identifiers.forEach((id) => exerciseMap.set(id, exercise));
    });

    const muscleCount = {};

    const addMuscle = (muscle, weight = 1) => {
      const key = String(muscle || "").toLowerCase().trim();
      if (key && key !== "undefined" && key !== "null") {
        muscleCount[key] = (muscleCount[key] || 0) + weight;
      }
    };

    const addMuscleWithSecondaries = (primaryMuscle) => {
      const key = String(primaryMuscle || "").toLowerCase().trim();
      if (!key) return;

      // Ajouter le muscle primaire (poids 1)
      addMuscle(key, 1);

      // Ajouter les muscles secondaires (poids 0.5)
      const secondaries = SECONDARY_MUSCLES[key] || [];
      secondaries.forEach((secondary) => addMuscle(secondary, 0.5));
    };

    userSessions.forEach((session) => {
      const entries = session?.entries || session?.items || session?.exercises || [];
      entries.forEach((entry) => {
        if (!entry) return;

        // 1. Priorité aux muscles stockés directement dans l'entrée
        const entryMuscles = entry.muscles;
        if (Array.isArray(entryMuscles) && entryMuscles.length > 0) {
          // Premier muscle = primaire, les autres = déjà secondaires
          entryMuscles.forEach((m, i) => addMuscle(m, i === 0 ? 1 : 0.7));
          return;
        }

        // 2. Utiliser muscle ou muscleGroup de l'entrée avec secondaires
        if (entry.muscle) {
          addMuscleWithSecondaries(entry.muscle);
          return;
        }
        if (entry.muscleGroup) {
          addMuscleWithSecondaries(entry.muscleGroup);
          return;
        }

        // 3. Fallback: chercher dans la DB par ID/slug uniquement
        const identifiers = [
          entry.exerciseId,
          entry.id,
          entry._id,
          entry.slug,
        ].filter(Boolean).map((id) => String(id).toLowerCase());

        let matchedExercise = null;
        for (const id of identifiers) {
          if (exerciseMap.has(id)) {
            matchedExercise = exerciseMap.get(id);
            break;
          }
        }

        if (matchedExercise?.muscles && matchedExercise.muscles.length > 0) {
          matchedExercise.muscles.forEach((m, i) => addMuscle(m, i === 0 ? 1 : 0.7));
        } else if (matchedExercise?.primaryMuscle) {
          addMuscleWithSecondaries(matchedExercise.primaryMuscle);
        }
      });
    });

    // Arrondir les valeurs pour l'affichage
    Object.keys(muscleCount).forEach((key) => {
      muscleCount[key] = Math.round(muscleCount[key] * 10) / 10;
    });

    return muscleCount;
  }, [userSessions, exercisesDb]);

  return {
    stats,
    weightData,
    calorieTargets,
    recentSessions,
    sportStats,
    weightChange,
    sessionsTrend,
    bestStreak,
    avgSessionDuration,
    parseDate,
    formatDate,
    extractSessionCalories,
    weeklyCalories,
    rmTests,
    rmTestsByExercice,
    weightPoints,
    allSessionsSorted,
    userSessions,
    setUserSessions,
    muscleStats,
  };
};
