import { useEffect, useMemo, useState } from "react";
import styles from "./SuivieSeance.module.css";

export default function SuivieSeance({ user }) {
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
      const raw = data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
      const has = raw !== null && raw !== undefined && String(raw).trim() !== "";
      const value = has ? (fmt ? fmt(raw) : String(raw)) : "Aucune donnée";
      return [label, value];
    });
  }, [data]);

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
    const raw = data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
    const has = raw !== null && raw !== undefined && String(raw).trim() !== "";
    return has ? (def[key] ? def[key](raw) : String(raw)) : "Aucune donnée";
  };

  const getEither = (k1, k2) => {
    const v1 = get(k1);
    if (v1 !== 'Aucune donnée') return v1;
    return get(k2);
  };

  if (loading) return <div><p>Chargement de ton suivi…</p></div>;

  if ((!data || items.length === 0) && !error) {
    return <div><p>Connecte-toi pour suivre tes séances et voir ton historique.</p></div>;
  }

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
              <span className={styles.rowValue}>{get('avgCaloriesPerWorkout')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Calories brûlées (dernière séance)</span>
              <span className={styles.rowValue}>{get('lastCaloriesBurned')}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.statLabel}>Calories sur 7 jours</span>
              <span className={styles.rowValue}>{getEither('calories7d', 'caloriesBurnedWeek')}</span>
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
              <span className={styles.statLabel}>Série de jours actifs</span>
              <span className={styles.rowValue}>{get('streakDays')}</span>
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
          ].includes(label))
          .map(([label, value]) => (
            <div key={label} className={styles.statCard}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statValue}>{value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}