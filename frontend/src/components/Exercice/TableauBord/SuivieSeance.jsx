import { useEffect, useMemo, useState } from "react";
import styles from "./SuivieSeance.module.css";
import Stat from "./stats/Stat.jsx";
import { computeSessionStats } from "./stats/computeSessionStats";

const API_BASE = (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

export default function SuivieSeance({ user, lastSession: propLastSession, sessions }) {
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const summaryUrl = API_BASE ? `${API_BASE}/api/history/summary` : "/api/history/summary";
        const res = await fetch(summaryUrl, { credentials: "include", headers });
        if (!res.ok) throw new Error("bad status");
        const json = await res.json();
        if (!cancelled) setServerData(json);
      } catch (e) {
        if (!cancelled) setError("no-server");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => (serverData || {}), [serverData]);

  const combinedData = data;

  function extractCompletedSessions(src) {
    const arrays = [];
    if (Array.isArray(sessions)) arrays.push(sessions);
    if (src) {
      if (Array.isArray(src.sessions)) arrays.push(src.sessions);
      if (Array.isArray(src.history)) arrays.push(src.history);
      if (Array.isArray(src.recentSessions)) arrays.push(src.recentSessions);
      if (Array.isArray(src.workouts)) arrays.push(src.workouts);
      if (Array.isArray(src.recentWorkouts)) arrays.push(src.recentWorkouts);
      if (Array.isArray(src.last7Workouts)) arrays.push(src.last7Workouts);
    }
    const flat = Array.from(new Set(arrays.flat().filter(Boolean)));
    const toDate = (s) => new Date(
      s?.endedAt || s?.date || s?.createdAt || s?.performedAt || s?.startedAt || s?.day || 0
    );
    const isDone = (s) => {
      const status = String(s?.status || "").toLowerCase();
      return (
        Boolean(s?.endedAt) || Boolean(s?.finishedAt) || s?.isFinished === true ||
        s?.percent === 100 || s?.progress === 100 ||
        ["done", "completed", "finished", "terminee", "terminée"].includes(status)
      );
    };

    const doneSorted = flat
      .filter((s) => isDone(s))
      .map((s) => ({ s, d: toDate(s) }))
      .filter((x) => x.d && !isNaN(x.d))
      .sort((a, b) => b.d - a.d)
      .map((x) => x.s);

    if (doneSorted.length) return doneSorted;

    return flat
      .map((s) => ({ s, d: toDate(s) }))
      .filter((x) => x.d && !isNaN(x.d))
      .sort((a, b) => b.d - a.d)
      .map((x) => x.s);
  }

  const primarySession = useMemo(() => {
    if (propLastSession) return propLastSession;
    const prev = extractCompletedSessions(serverData);
    return Array.isArray(prev) && prev.length ? prev[0] : null;
  }, [propLastSession, serverData, sessions]);

  const carouselSessions = useMemo(() => {
    const list = [];
    if (propLastSession) {
      const key = propLastSession.id || propLastSession._id || 'current';
      list.push({ key, session: propLastSession, title: 'Statistiques de la séance' });
    }
    const prev = extractCompletedSessions(serverData);
    for (const s of prev) {
      const key = s.id || s._id || `${s.date || s.endedAt || ''}`;
      if (list.some((it) => it.key === key)) continue;
      list.push({ key, session: s, title: 'Statistiques de la séance précédente' });
    }
    return list;
  }, [propLastSession, serverData, sessions]);

  const lastSessionCalories = useMemo(() => {
    const s = primarySession;
    if (!s) return null;
    const itemsSrc = Array.isArray(s?.entries) ? s.entries : (Array.isArray(s?.items) ? s.items : []);
    try {
      const st = computeSessionStats(s, itemsSrc, { serverData });
      const kcal = Number(st?.calories);
      return Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : null;
    } catch {
      return null;
    }
  }, [primarySession, serverData]);

  const avgCaloriesPerSession = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions
      : (Array.isArray(serverData?.sessions) ? serverData.sessions : []);
    if (!list.length) return null;
    const vals = list.map((s) => {
      const itemsSrc = Array.isArray(s?.entries) ? s.entries : (Array.isArray(s?.items) ? s.items : []);
      try {
        const st = computeSessionStats(s, itemsSrc, { serverData });
        const kcal = Number(st?.calories);
        return Number.isFinite(kcal) ? kcal : 0;
      } catch { return 0; }
    }).filter(v => v > 0);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a,b) => a + b, 0) / vals.length);
  }, [sessions, serverData]);

  const favoriteMuscleGroupFallback = useMemo(() => {
    const source = Array.isArray(sessions) && sessions.length
      ? sessions
      : (Array.isArray(serverData?.sessions) ? serverData.sessions : []);
    if (!source.length) return null;
    const muscleMap = new Map();
    for (const s of source) {
      const items = Array.isArray(s?.entries) ? s.entries : (Array.isArray(s?.items) ? s.items : (Array.isArray(s?.exercises) ? s.exercises : []));
      for (const e of items) {
        const groups = Array.isArray(e?.muscles) ? e.muscles : (e?.muscleGroup ? [e.muscleGroup] : (e?.muscle ? [e.muscle] : []));
        for (const g of groups) {
          const key = String(g || '').trim();
          if (!key) continue;
          muscleMap.set(key, (muscleMap.get(key) || 0) + 1);
        }
      }
    }
    let top = null;
    for (const [name, count] of muscleMap.entries()) {
      if (!top || count > top.count) top = { name, count };
    }
    return top?.name || null;
  }, [sessions, serverData]);

  const items = useMemo(() => {
    const defs = [
      // Stats existantes
      { key: "lastWeight", label: "Dernier poids enregistré", fmt: (v) => `${v} kg` },
      { key: "imc", label: "IMC" },
      { key: "calories", label: "Calories journalières" },
      { key: "lastSession", label: "Dernière séance" },
      { key: "lastWorkoutDuration", label: "Durée dernière séance" },
      { key: "lastCaloriesBurned", label: "Calories brûlées (dernière séance)", fmt: (v) => `${v} kcal` },
      { key: "caloriesBurnedWeek", label: "Calories brûlées (7 jours)", fmt: (v) => `${v} kcal` },
      { key: "totalSessions", label: "Total séances complétées" },
      { key: "streakDays", label: "Série de jours actifs", fmt: (v) => `${v} j` },
      { key: "favoriteMuscleGroup", label: "Groupe musculaire le plus travaillé" },

      { key: "initialWeight", label: "Poids initial", fmt: (v) => `${v} kg` },
      { key: "latestWeight", label: "Poids actuel (calculé)", fmt: (v) => `${v} kg` },
      { key: "weightChange", label: "Variation de poids", fmt: (v) => `${v > 0 ? '+' : ''}${v} kg` },
      { key: "avgWorkoutDurationMin", label: "Durée moyenne des séances", fmt: (v) => `${v} min` },
      { key: "avgCaloriesPerWorkout", label: "Calories moy./séance", fmt: (v) => `${v} kcal` },
      { key: "workoutsCount7d", label: "Séances sur 7 jours" },
      { key: "calories7d", label: "Calories totales sur 7 jours", fmt: (v) => `${v} kcal` },
      { key: "avgDailyCalories7d", label: "Apport moyen (7 jours)", fmt: (v) => `${v} kcal` },
      { key: "avgCaloriesPerWorkout7d", label: "Calories moy./séance (7 jours)", fmt: (v) => `${v} kcal` },
    ];

    return defs.map(({ key, label, fmt }) => {
      if (key === 'favoriteMuscleGroup') {
        const serverVal = (combinedData && Object.prototype.hasOwnProperty.call(combinedData, key)) ? combinedData[key] : undefined;
        const raw = (serverVal !== undefined && serverVal !== null && String(serverVal).trim() !== '')
          ? serverVal
          : favoriteMuscleGroupFallback;
        const has = raw !== null && raw !== undefined && String(raw).trim() !== '';
        const value = has ? String(raw) : 'Aucune donnée';
        return [label, value];
      }

      const raw = combinedData && Object.prototype.hasOwnProperty.call(combinedData, key) ? combinedData[key] : undefined;
      const has = raw !== null && raw !== undefined && String(raw).trim() !== '';
      const value = has ? (fmt ? fmt(raw) : String(raw)) : 'Aucune donnée';
      return [label, value];
    });
  }, [combinedData, favoriteMuscleGroupFallback]);

  const get = (key) => {
    const def = {
      lastWeight: (v) => `${v} kg`,
      lastCaloriesBurned: (v) => `${v} kcal`,
      caloriesBurnedWeek: (v) => `${v} kcal`,
      calories7d: (v) => `${v} kcal`,
      avgWorkoutDurationMin: (v) => `${v} min`,
      avgCaloriesPerWorkout: (v) => `${v} kcal`,
      streakDays: (v) => `${v} j`,
      initialWeight: (v) => `${v} kg`,
      latestWeight: (v) => `${v} kg`,
      weightChange: (v) => `${v > 0 ? '+' : ''}${v} kg`,
      avgDailyCalories7d: (v) => `${v} kcal`,
      avgCaloriesPerWorkout7d: (v) => `${v} kcal`,
    };
    const raw = combinedData && Object.prototype.hasOwnProperty.call(combinedData, key) ? combinedData[key] : undefined;
    const has = raw !== null && raw !== undefined && String(raw).trim() !== "";
    return has ? (def[key] ? def[key](raw) : String(raw)) : "Aucune donnée";
  };

  const getEither = (k1, k2) => {
    const v1 = get(k1);
    if (v1 !== 'Aucune donnée') return v1;
    return get(k2);
  };

  if (error && items.length === 0) {
    return <div><p>Impossible de récupérer tes statistiques pour l’instant.</p></div>;
  }

  return (
    <div>
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.compactCard}`}>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.statLabel}>IMC</span>
              <span className={styles.rowValue}>{get('imc')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Dernier poids</span>
              <span className={styles.rowValue}>{get('lastWeight')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Poids initial</span>
              <span className={styles.rowValue}>{get('initialWeight')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Poids actuel (calculé)</span>
              <span className={styles.rowValue}>{get('latestWeight')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Variation de poids</span>
              <span className={styles.rowValue}>{getEither('weightChange','variation')}</span>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.compactCard}`}>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.statLabel}>Calories journalières</span>
              <span className={styles.rowValue}>{getEither('calories','dailyCalories')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Calories moy./séance</span>
              <span className={styles.rowValue}>
                {(() => {
                  const serverVal = getEither('avgCaloriesPerWorkout7d','avgCaloriesPerWorkout');
                  if (serverVal !== 'Aucune donnée') return serverVal;
                  return avgCaloriesPerSession != null ? `${avgCaloriesPerSession} kcal` : 'Aucune donnée';
                })()}
              </span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Calories brûlées (dernière séance)</span>
              <span className={styles.rowValue}>
                {(() => {
                  const v = get('lastCaloriesBurned');
                  if (v !== 'Aucune donnée') return v;
                  return lastSessionCalories != null ? `${lastSessionCalories} kcal` : 'Aucune donnée';
                })()}
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.compactCard}`}>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.statLabel}>Dernière séance</span>
              <span className={styles.rowValue}>{get('lastSession')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Exercices (dernière séance)</span>
              <span className={styles.rowValue}>
                {(() => {
                  const a = Number(combinedData?.lastCompletedExercises);
                  const b = Number(combinedData?.lastPlannedExercises);
                  if (Number.isFinite(a) && Number.isFinite(b) && b > 0) return `${a} / ${b}`;
                  const list = Array.isArray(combinedData?.lastExercisesList) ? combinedData.lastExercisesList : null;
                  if (list && list.length) {
                    const done = list.filter(x => x && x.done).length;
                    return `${done} / ${list.length}`;
                  }
                  const s = primarySession;
                  const items = Array.isArray(s?.entries) ? s.entries : (Array.isArray(s?.items) ? s.items : (Array.isArray(s?.exercises) ? s.exercises : []));
                  if (items.length) return `${items.length}`;
                  return 'Aucune donnée';
                })()}
              </span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Séances sur 7 jours</span>
              <span className={styles.rowValue}>{get('workoutsCount7d')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Total séances complétées</span>
              <span className={styles.rowValue}>{get('totalSessions')}</span>
            </div>
          </div>
        </div>

        {items
          .filter(([label]) => ![
            'IMC',
            'Dernier poids enregistré',
            'Poids initial',
            'Poids actuel (calculé)',
            'Variation de poids',
            'Calories journalières',
            'Calories moy./séance',
            'Calories brûlées (dernière séance)',
            'Calories totales sur 7 jours',
            'Calories brûlées (7 jours)',
            'Dernière séance',
            'Durée dernière séance',
            'Durée moyenne des séances',
            'Séances sur 7 jours',
            'Total séances complétées',
            'Série de jours actifs',
            'Apport moyen (7 jours)',
            'Calories moy./séance (7 jours)',
          ].includes(label))
          .map(([label, value]) => (
            <div key={label} className={styles.statCard}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statValue}>{value}</span>
            </div>
          ))}
      </div>
      <div className={styles.statsCarousel} aria-label="Historique des séances (défilement horizontal)">
        {carouselSessions.map((it) => {
          const s = it.session;
          const items = Array.isArray(s?.entries)
            ? s.entries
            : (Array.isArray(s?.exercises)
                ? s.exercises
                : (Array.isArray(s?.items) ? s.items : []));
          return (
            <div className={styles.statsSlide} key={it.key}>
              <Stat lastSession={s} items={items} titleOverride={it.title} serverData={serverData} />
            </div>
          );
        })}
      </div>
    </div>
  );
}