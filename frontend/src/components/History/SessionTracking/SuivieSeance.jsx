import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./SuivieSeance.module.css";
import statStyles from "./stats/Stat.module.css";
import Stat from "./stats/Stat.jsx";
import { computeSessionStats } from "./stats/computeSessionStats";
import { loadExercises } from "../../../utils/exercisesLoader";
import { secureApiCall } from "../../../utils/authService.js";

const DEFAULT_EMPTY = "Aucune donnée";

const STAT_FORMATTERS = {
  imc: (value) => {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return num.toFixed(1);
    }
    return String(value);
  },
  lastWeight: (value) => `${value} kg`,
  initialWeight: (value) => `${value} kg`,
  latestWeight: (value) => `${value} kg`,
  weightChange: (value) => {
    const num = Number(value);
    if (Number.isFinite(num)) {
      const sign = num > 0 ? "+" : "";
      return `${sign}${num} kg`;
    }
    return String(value);
  },
  calories: (value) => `${value} kcal`,
  dailyCalories: (value) => `${value} kcal`,
  avgCaloriesPerWorkout: (value) => `${value} kcal`,
  avgCaloriesPerWorkout7d: (value) => `${value} kcal`,
  lastCaloriesBurned: (value) => `${value} kcal`,
  caloriesBurnedWeek: (value) => `${value} kcal`,
  calories7d: (value) => `${value} kcal`,
  avgDailyCalories7d: (value) => `${value} kcal`,
  avgWorkoutDurationMin: (value) => `${value} min`,
  workoutsCount7d: (value) => `${value}`,
  totalSessions: (value) => `${value}`,
  streakDays: (value) => `${value} j`,
};

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

function pickRichestItemsFromSession(session) {
  if (!session) return [];
  const candidates = [];
  if (Array.isArray(session.entries)) candidates.push(session.entries);
  if (Array.isArray(session.exercises)) candidates.push(session.exercises);
  if (Array.isArray(session.items)) candidates.push(session.items);
  if (Array.isArray(session.clientSummary?.exercises)) {
    candidates.push(session.clientSummary.exercises);
  }
  if (!candidates.length) return [];
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] || [];
}

function isSessionCompleted(session) {
  const status = String(session?.status || "").toLowerCase();
  return (
    Boolean(session?.endedAt) ||
    Boolean(session?.finishedAt) ||
    session?.isFinished === true ||
    session?.percent === 100 ||
    session?.progress === 100 ||
    ["done", "completed", "finished", "terminee", "terminée"].includes(status)
  );
}

function extractCompletedSessions(source, fallbackSessions = []) {
  const collections = [];
  if (Array.isArray(fallbackSessions)) collections.push(fallbackSessions);
  if (source) {
    if (Array.isArray(source.sessions)) collections.push(source.sessions);
    if (Array.isArray(source.history)) collections.push(source.history);
    if (Array.isArray(source.recentSessions)) collections.push(source.recentSessions);
    if (Array.isArray(source.workouts)) collections.push(source.workouts);
    if (Array.isArray(source.recentWorkouts)) collections.push(source.recentWorkouts);
    if (Array.isArray(source.last7Workouts)) collections.push(source.last7Workouts);
  }

  const flat = collections.flat().filter(Boolean);
  const unique = [];
  const seen = new Set();

  for (const session of flat) {
    const identifier =
      session?.id ||
      session?._id ||
      session?.uuid ||
      session?.externalId ||
      `${session?.date ?? ""}-${session?.endedAt ?? ""}`;
    const key = identifier || session;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(session);
  }

  const pickDate = (session) => {
    const raw =
      session?.endedAt ||
      session?.date ||
      session?.createdAt ||
      session?.performedAt ||
      session?.startedAt ||
      session?.day;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const completed = unique
    .map((session) => ({ session, date: pickDate(session) }))
    .filter((entry) => entry.date)
    .sort((a, b) => b.date - a.date);

  const finished = completed
    .filter((entry) => isSessionCompleted(entry.session))
    .map((entry) => entry.session);

  if (finished.length) {
    return finished;
  }

  return completed.map((entry) => entry.session);
}

function isSameSession(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const idsA = [a.id, a._id, a.uuid, a.externalId].filter(Boolean);
  const idsB = [b.id, b._id, b.uuid, b.externalId].filter(Boolean);
  if (idsA.length && idsB.length) {
    return idsA.some((idA) => idsB.includes(idA));
  }
  const refA = a.endedAt || a.date;
  const refB = b.endedAt || b.date;
  if (refA && refB) {
    return refA === refB;
  }
  return false;
}

export default function SuivieSeance({
  user: _user,
  lastSession: propLastSession,
  sessions,
  showSummaryCards = true,
}) {
  const [serverData, setServerData] = useState(null);
  const [exercisesDb, setExercisesDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await secureApiCall("/api/history/summary");
        if (!response.ok) throw new Error("bad status");
        const json = await response.json();
        if (!cancelled) setServerData(json);
      } catch (err) {
        if (!cancelled) setError("no-server");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const exercises = await loadExercises("all");
        if (!cancelled) setExercisesDb(exercises);
      } catch (err) {
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const combinedData = useMemo(() => serverData ?? {}, [serverData]);

  const completedSessions = useMemo(
    () => extractCompletedSessions(serverData, sessions),
    [serverData, sessions]
  );

  const primarySession = useMemo(() => {
    if (propLastSession) return propLastSession;
    return completedSessions.length ? completedSessions[0] : null;
  }, [propLastSession, completedSessions]);

  const sessionDataset = useMemo(() => {
    if (Array.isArray(sessions) && sessions.length) return sessions;
    if (completedSessions.length) return completedSessions;
    if (Array.isArray(serverData?.sessions)) return serverData.sessions;
    return [];
  }, [sessions, completedSessions, serverData]);

  const favoriteMuscleGroupFallback = useMemo(() => {
    if (!sessionDataset.length || !exercisesDb.length) return null;

    const exerciseMap = new Map();
    exercisesDb.forEach((exercise) => {
      const identifiers = [
        exercise.id,
        exercise._id,
        exercise.uuid,
        exercise.slug,
        exercise.name,
      ];
      identifiers
        .filter(Boolean)
        .forEach((identifier) =>
          exerciseMap.set(String(identifier).toLowerCase(), exercise)
        );
    });

    const muscleCounter = new Map();

    sessionDataset.forEach((session) => {
      const entries = pickRichestItemsFromSession(session);
      entries.forEach((entry) => {
        const identifiers = [
          entry?.exerciseId,
          entry?.id,
          entry?._id,
          entry?.exoId,
          entry?.slug,
          entry?.name,
          entry?.exerciseName,
          entry?.exoName,
        ]
          .filter(Boolean)
          .map((identifier) => String(identifier).toLowerCase());

        let matchedExercise = null;
        for (const identifier of identifiers) {
          if (exerciseMap.has(identifier)) {
            matchedExercise = exerciseMap.get(identifier);
            break;
          }
        }

        if (matchedExercise && Array.isArray(matchedExercise.muscles)) {
          matchedExercise.muscles.forEach((muscle) => {
            const key = String(muscle || "").trim();
            if (!key) return;
            muscleCounter.set(key, (muscleCounter.get(key) || 0) + 1);
          });
        }
      });
    });

    let top = null;
    muscleCounter.forEach((count, name) => {
      if (!top || count > top.count) {
        top = { name, count };
      }
    });

    return top?.name ?? null;
  }, [sessionDataset, exercisesDb]);

  const getRawStat = useCallback(
    (key) => {
      if (key === "favoriteMuscleGroup") {
        const serverValue = combinedData.favoriteMuscleGroup;
        if (hasValue(serverValue)) return serverValue;
        return favoriteMuscleGroupFallback;
      }
      return combinedData[key];
    },
    [combinedData, favoriteMuscleGroupFallback]
  );

  const formatStat = useCallback(
    (key) => {
      const raw = getRawStat(key);
      if (!hasValue(raw)) return null;
      const formatter = STAT_FORMATTERS[key];
      if (formatter) return formatter(raw);
      return String(raw);
    },
    [getRawStat]
  );

  const formatFromKeys = useCallback(
    (keys) => {
      for (const key of keys) {
        const formatted = formatStat(key);
        if (hasValue(formatted)) return formatted;
      }
      return null;
    },
    [formatStat]
  );

  const toDisplay = useCallback(
    (value, fallback = DEFAULT_EMPTY) => (hasValue(value) ? value : fallback),
    []
  );

  const lastSessionCalories = useMemo(() => {
    if (!primarySession) return null;
    const entries = pickRichestItemsFromSession(primarySession);
    try {
      const stats = computeSessionStats(primarySession, entries, { serverData });
      const calories = Number(stats?.calories);
      return Number.isFinite(calories) && calories > 0 ? Math.round(calories) : null;
    } catch {
      return null;
    }
  }, [primarySession, serverData]);

  const avgCaloriesPerSession = useMemo(() => {
    if (!sessionDataset.length) return null;
    const values = sessionDataset
      .map((session) => {
        const entries = pickRichestItemsFromSession(session);
        try {
          const stats = computeSessionStats(session, entries, { serverData });
          const calories = Number(stats?.calories);
          return Number.isFinite(calories) ? calories : 0;
        } catch {
          return 0;
        }
      })
      .filter((value) => value > 0);

    if (!values.length) return null;
    const sum = values.reduce((acc, value) => acc + value, 0);
    return Math.round(sum / values.length);
  }, [sessionDataset, serverData]);

  const weightMetrics = useMemo(
    () => [
      { label: "IMC", value: toDisplay(formatStat("imc")), accent: false },
      {
        label: "Dernier poids",
        value: toDisplay(formatFromKeys(["lastWeight", "latestWeight"])),
        accent: false,
      },
      {
        label: "Poids initial",
        value: toDisplay(formatStat("initialWeight")),
        accent: false,
      },
      {
        label: "Poids actuel (calculé)",
        value: toDisplay(formatStat("latestWeight")),
        accent: false,
      },
      {
        label: "Variation de poids",
        value: toDisplay(formatFromKeys(["weightChange", "variation"])),
        accent: true,
      },
    ],
    [formatStat, formatFromKeys, toDisplay]
  );

  const calorieMetrics = useMemo(() => {
    const daily = formatFromKeys(["calories", "dailyCalories"]);
    const averagePerWorkout =
      formatFromKeys(["avgCaloriesPerWorkout7d", "avgCaloriesPerWorkout"]) ??
      (avgCaloriesPerSession != null ? `${avgCaloriesPerSession} kcal` : null);
    const lastBurned =
      formatStat("lastCaloriesBurned") ??
      (lastSessionCalories != null ? `${lastSessionCalories} kcal` : null);
    const weeklyBurned = formatFromKeys(["caloriesBurnedWeek", "calories7d"]);

    return [
      {
        label: "Calories journalières",
        value: toDisplay(daily),
        accent: true,
      },
      {
        label: "Calories moy./séance",
        value: toDisplay(averagePerWorkout),
        accent: false,
      },
      {
        label: "Calories brûlées (dernière séance)",
        value: toDisplay(lastBurned),
        accent: false,
      },
      {
        label: "Calories brûlées (7 jours)",
        value: toDisplay(weeklyBurned),
        accent: false,
      },
    ];
  }, [formatFromKeys, formatStat, toDisplay, avgCaloriesPerSession, lastSessionCalories]);

  const sessionMetrics = useMemo(
    () => [
      {
        label: "Séances (7 jours)",
        value: toDisplay(formatStat("workoutsCount7d")),
        accent: true,
      },
      {
        label: "Total séances complétées",
        value: toDisplay(formatStat("totalSessions")),
        accent: false,
      },
      {
        label: "Série de jours actifs",
        value: toDisplay(formatStat("streakDays")),
        accent: false,
      },
    ],
    [formatStat, toDisplay]
  );

  const summaryCards = useMemo(() => {
    const cards = [
      { id: "weight", title: "Suivi poids", metrics: weightMetrics },
      { id: "energy", title: "Calories & énergie", metrics: calorieMetrics },
      // { id: "activity", title: "Activité", metrics: sessionMetrics },
    ];

    return cards
      .map((card) => ({
        ...card,
        metrics: card.metrics.filter((metric) => metric.value !== DEFAULT_EMPTY),
      }))
      .filter((card) => card.metrics.length > 0);
  }, [weightMetrics, calorieMetrics, sessionMetrics]);

  const carouselSlides = useMemo(() => {
    const slides = [];

    const pushSlide = (session, title, prefix) => {
      if (!session) return;
      if (slides.some((slide) => isSameSession(slide.session, session))) return;
      const reference =
        session.id ||
        session._id ||
        session.uuid ||
        session.externalId ||
        session.endedAt ||
        session.date ||
        session.createdAt ||
        session.startedAt ||
        Math.random().toString(36).slice(2);
      slides.push({
        key: `${prefix}-${reference}`,
        session,
        title,
      });
    };

    if (propLastSession) {
      pushSlide(propLastSession, "Statistiques de la séance", "current");
    }

    completedSessions.forEach((session, index) => {
      if (propLastSession && isSameSession(propLastSession, session)) return;
      const title =
        index === 0 && !propLastSession
          ? "Séance la plus récente"
          : "Séance précédente";
      pushSlide(session, title, `history-${index}`);
    });

    return slides;
  }, [propLastSession, completedSessions]);

  const hasSummaryCards = showSummaryCards && summaryCards.length > 0;
  const hasCarousel = carouselSlides.length > 0;
  const hasAnyData = hasSummaryCards || hasCarousel;
  const showEmptyState = !loading && !error && !hasAnyData;

  return (
    <div className={styles.container}>
      {loading && (
        <div className={styles.stateMessage}>Chargement des statistiques…</div>
      )}

      {error && (
        <div className={`${styles.stateMessage} ${styles.stateError}`}>
          Impossible de récupérer tes statistiques pour le moment.
        </div>
      )}

      {hasSummaryCards && (
        <div className={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <article key={card.id} className={styles.statCard}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <div className={styles.metricList}>
                {card.metrics.map((metric) => (
                  <div key={metric.label} className={styles.metricRow}>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <span
                      className={`${styles.metricValue} ${
                        metric.accent ? styles.metricValueAccent : ""
                      }`}
                    >
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {hasCarousel && (
        <section className={styles.bottomSection}>
          <div className={statStyles.carouselSection}>
            <div className={statStyles.carouselHeader}>
              <h3 className={styles.sectionTitle}>Tes dernières séances</h3>
            </div>
            <div className={statStyles.carouselList} aria-label="Historique des séances">
              {carouselSlides.map((slide) => {
                const entries = pickRichestItemsFromSession(slide.session);
                return (
                  <div key={slide.key} className={statStyles.carouselSlide}>
                    <Stat
                      lastSession={slide.session}
                      items={entries}
                      titleOverride={slide.title}
                      serverData={serverData}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {showEmptyState && (
        <div className={styles.emptyState}>
          Aucune donnée de séance n&apos;a encore été enregistrée.
        </div>
      )}
    </div>
  );
}
