import React, { useMemo } from "react";
import styles from "./Stat.module.css";
import { computeSessionStats } from "./computeSessionStats";

export default function Stat({ lastSession, items = [], bodyMassKg, titleOverride, serverData }) {
  const computed = useMemo(() => {
    const fallback = {
      percentDone: 0,
      durationSec: 0,
      exercisesDone: 0,
      totalExercises: 0,
      calories: 0,
      volumeKg: 0,
      cardioPct: 0,
      muscuPct: 0,
      delta: null,
    };
    try {
      const res = computeSessionStats(lastSession, items || [], { bodyMassKg, serverData });
      return { ...fallback, ...(res || {}) };
    } catch (e) {
      return fallback;
    }
  }, [lastSession, items, bodyMassKg, serverData]);

  const cardioPct = clampPct(computed.cardioPct);
  const muscuPct = clampPct(computed.muscuPct);

  return (
    <section className={styles.card} aria-labelledby="stat-title">
      <header className={styles.header}>
        <h3 id="stat-title" className={styles.title}>{titleOverride || "Statistiques de la séance"}</h3>
        <div className={styles.doneChip} aria-label="pourcentage terminé">
          <span className={styles.dot} /> {computed.percentDone}% terminé
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.item}>
          <div className={`${styles.icon} ${styles.iconClock}`}>🕒</div>
          <div className={styles.value}>{formatDurationMin(computed.durationSec)}</div>
          <div className={styles.label}>Durée</div>
        </div>
        <div className={styles.item}>
          <div className={`${styles.icon} ${styles.iconTarget}`}>🎯</div>
          <div className={styles.value}>{(() => {
            const a = Number(serverData?.lastCompletedExercises);
            const b = Number(serverData?.lastPlannedExercises);
            if (Number.isFinite(a) && Number.isFinite(b) && b > 0) return `${a}/${b}`;
            const list = Array.isArray(serverData?.lastExercisesList) ? serverData.lastExercisesList : null;
            if (list && list.length) {
              const done = list.filter(x => x && x.done).length;
              return `${done}/${list.length}`;
            }
            return `${computed.exercisesDone}/${computed.totalExercises}`;
          })()}</div>
          <div className={styles.label}>Exercices</div>
        </div>
        <div className={styles.item}>
          <div className={`${styles.icon} ${styles.iconFire}`}>🔥</div>
          <div className={styles.value}>~{formatNumber(computed.calories)}<span className={styles.unit}> kcal</span></div>
          <div className={styles.label}>Calories</div>
        </div>
        <div className={styles.item}>
          <div className={`${styles.icon} ${styles.iconWeight}`}>🏋️‍♂️</div>
          <div className={styles.value}>{formatNumber(computed.volumeKg)}<span className={styles.unit}> kg</span></div>
          <div className={styles.label}>Volume total</div>
        </div>
      </div>

      <div className={styles.splitRow}>
        <div className={styles.splitItem}>
          <div className={styles.splitLabel}>Cardio</div>
          <div
            className={styles.splitBar}
            style={{ '--pct': cardioPct + '%' }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={cardioPct}
            aria-label="Part cardio"
          >
            <span
              className={styles.barFill}
              style={{ width: `${cardioPct}%`, opacity: cardioPct === 0 ? 0.15 : 1 }}
            />
          </div>
          <div className={styles.splitPct}>{cardioPct}%</div>
        </div>
        <div className={styles.splitItem}>
          <div className={styles.splitLabel}>Muscu</div>
          <div
            className={styles.splitBar}
            style={{ '--pct': muscuPct + '%' }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={muscuPct}
            aria-label="Part musculation"
          >
            <span
              className={styles.barFill}
              style={{ width: `${muscuPct}%`, opacity: muscuPct === 0 ? 0.15 : 1 }}
            />
          </div>
          <div className={styles.splitPct}>{muscuPct}%</div>
        </div>
      </div>

      {computed.delta && (
        <div className={styles.compare}>
          <div className={styles.compareTitle}>Comparaison avec la dernière séance</div>
          <div className={styles.compareRow}>
            <span>Durée:</span>
            <span className={deltaClass(computed.delta.durationSec)}>{formatDurationMin(Math.abs(computed.delta.durationSec))}</span>
            <span>Volume:</span>
            <span className={deltaClass(computed.delta.volumeKg)}>{formatNumber(Math.abs(computed.delta.volumeKg))} kg</span>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDurationMin(sec) {
  const m = Math.max(0, Math.round(sec / 60));
  return `${m}min`;
}

function formatNumber(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.max(0, Math.round(n)));
}

function deltaClass(n) { return n >= 0 ? "" : styles.down; }

function clampPct(n) {
  const v = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}
