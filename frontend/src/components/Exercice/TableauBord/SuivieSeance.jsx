import { useEffect, useMemo, useState } from "react";
import styles from "./SuivieSeance.module.css";
import Stat from "./stats/Stat.jsx";
import { computeSessionStats } from "./stats/computeSessionStats";

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
        const res = await fetch("/api/history/summary", { credentials: "include", headers });
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

  const data = useMemo(() => ({ ...(user || {}), ...(serverData || {}) }), [user, serverData]);

  const favoriteMuscleGroup = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions
      : (Array.isArray(serverData?.sessions) ? serverData.sessions : []);
    if (!list.length) return null;

    const scoreByGroup = new Map();
    for (const sess of list) {
      const entries = Array.isArray(sess?.entries) ? sess.entries : [];
      for (const e of entries) {
        const group = (e?.muscleGroup || e?.group || e?.muscle || e?.target || e?.primaryMuscle || e?.data?.muscleGroup || e?.data?.group || "").toString().trim();
        if (!group) continue;
        const sets = Array.isArray(e?.sets) ? e.sets : [];
        let score = 0;
        for (const s of sets) {
          const reps = Number(s?.reps ?? s?.rep);
          const w = Number(s?.weightKg ?? s?.weight ?? s?.kg ?? s?.poids);
          if (Number.isFinite(w) && Number.isFinite(reps)) score += Math.max(0, w) * Math.max(0, reps);
          else if (Number.isFinite(reps)) score += Math.max(0, reps);
          else score += 1; // fallback: compte le set
        }
        scoreByGroup.set(group, (scoreByGroup.get(group) || 0) + score);
      }
    }
    if (!scoreByGroup.size) return null;
    let best = null, bestScore = -1;
    for (const [g, sc] of scoreByGroup.entries()) {
      if (sc > bestScore) { best = g; bestScore = sc; }
    }
    return best;
  }, [sessions, serverData]);

  const combinedData = useMemo(() => ({
    ...data,
    ...(favoriteMuscleGroup ? { favoriteMuscleGroup } : {}),
  }), [data, favoriteMuscleGroup]);

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

    // fallback: nothing explicitly marked finished -> sort by date only
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
      const st = computeSessionStats(s, itemsSrc, {});
      const kcal = Number(st?.calories);
      return Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : null;
    } catch {
      return null;
    }
  }, [primarySession]);

  const avgCaloriesPerSession = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions
      : (Array.isArray(serverData?.sessions) ? serverData.sessions : []);
    if (!list.length) return null;
    const vals = list.map((s) => {
      const itemsSrc = Array.isArray(s?.entries) ? s.entries : (Array.isArray(s?.items) ? s.items : []);
      try {
        const st = computeSessionStats(s, itemsSrc, {});
        const kcal = Number(st?.calories);
        return Number.isFinite(kcal) ? kcal : 0;
      } catch { return 0; }
    }).filter(v => v > 0);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a,b) => a + b, 0) / vals.length);
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

      // Nouvelles stats dérivées (stats.service)
      { key: "initialWeight", label: "Poids initial", fmt: (v) => `${v} kg` },
      { key: "latestWeight", label: "Poids actuel (calculé)", fmt: (v) => `${v} kg` },
      { key: "weightChange", label: "Variation de poids", fmt: (v) => `${v > 0 ? '+' : ''}${v} kg` },
      { key: "avgWorkoutDurationMin", label: "Durée moyenne des séances", fmt: (v) => `${v} min` },
      { key: "avgCaloriesPerWorkout", label: "Calories moy./séance", fmt: (v) => `${v} kcal` },
      { key: "workoutsCount7d", label: "Séances sur 7 jours" },
      { key: "calories7d", label: "Calories totales sur 7 jours", fmt: (v) => `${v} kcal` },
    ];

    return defs.map(({ key, label, fmt }) => {
      const raw = combinedData && Object.prototype.hasOwnProperty.call(combinedData, key) ? combinedData[key] : undefined;
      const has = raw !== null && raw !== undefined && String(raw).trim() !== "";
      const value = has ? (fmt ? fmt(raw) : String(raw)) : "Aucune donnée";
      return [label, value];
    });
  }, [combinedData]);

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
              <span className={styles.rowValue}>{get('weightChange')}</span>
            </div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.compactCard}`}>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.statLabel}>Calories journalières</span>
              <span className={styles.rowValue}>{get('calories')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Calories moy./séance</span>
              <span className={styles.rowValue}>{avgCaloriesPerSession != null ? `${avgCaloriesPerSession} kcal` : 'Aucune donnée'}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Calories brûlées (dernière séance)</span>
              <span className={styles.rowValue}>{lastSessionCalories != null ? `${lastSessionCalories} kcal` : 'Aucune donnée'}</span>
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
              <Stat lastSession={s} items={items} titleOverride={it.title} />
            </div>
          );
        })}
      </div>
    </div>
  );
}