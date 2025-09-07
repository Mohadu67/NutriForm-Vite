import { useState, useEffect, useMemo } from "react";
import { mapItemsToEntries } from "../../TableauBord/sessionApi";
import styles from "./Chrono.module.css";
import useSaveSession from "../ExerciceCard/hooks/useSaveSession";

function Chrono({ label, items = [], onFinish = () => {} }) {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { save, saving } = useSaveSession();

  useEffect(() => {
    let interval;
    if (running) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running]);

  const { totalExercises, doneExercises, calories } = useMemo(() => {
    const safe = Array.isArray(items) ? items : [];
    const total = safe.length;

    const hasAnySet = (it) => {
      const d = it?.data || {};
      const cardioN = Array.isArray(d.cardioSets) ? d.cardioSets.length : 0;
      const muscuN = Array.isArray(d.sets) ? d.sets.length : 0;
      return cardioN > 0 || muscuN > 0;
    };

    const done = safe.filter(hasAnySet).length;

    // Improved estimation (front-only): simple MET-like per-minute constants by exercise family
    const nameOf = (it) => String(it?.name || it?.label || it?.exoName || '').toLowerCase();
    const guessType = (it, d) => {
      const raw = String(it?.mode ?? it?.type ?? '').toLowerCase();
      if (raw.includes('cardio')) return 'cardio';
      if (raw.includes('muscu')) return 'muscu';
      // Fallback by data shape
      if (Array.isArray(d.cardioSets)) return 'cardio';
      return 'muscu';
    };
    const perMinKcal = (label) => {
      if (label.includes('course') || label.includes('run')) return 11; // running
      if (label.includes('velo') || label.includes('cycle') || label.includes('bike')) return 8; // cycling
      if (label.includes('rameur') || label.includes('row')) return 7; // rowing
      if (label.includes('marche') || label.includes('walk')) return 5; // walking
      if (label.includes('corde') || label.includes('saut')) return 10; // jump rope
      return 7; // generic cardio
    };

    let kcal = 0;
    for (const it of safe) {
      const d = it?.data || {};
      const t = guessType(it, d);
      if (t === 'cardio') {
        const sets = Array.isArray(d.cardioSets) ? d.cardioSets : [];
        const rate = perMinKcal(nameOf(it));
        for (const s of sets) {
          const min = Number(s.durationMin ?? s.minutes ?? 0) || 0;
          const sec = Number(s.durationSec ?? 0) || 0;
          const durMin = (min + sec / 60) || 5 / 60; // if empty seconds-only 0, fallback tiny
          kcal += durMin * rate;
        }
      } else {
        const sets = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);
        for (const s of sets) {
          const w = Number(s.weightKg ?? s.weight ?? 0) || 0;
          const r = Number(s.reps ?? s.rep ?? 0) || 0;
          // simple muscular work proxy: time-under-tension approximated by reps, add base cost per set
          const perSet = w && r ? (w * r * 0.075) : (r ? r * 0.8 : 4);
          kcal += perSet;
        }
      }
    }
    // clamp and round the estimate
    const est = Math.max(0, Math.round(kcal));
    return { totalExercises: total, doneExercises: done, calories: est };
  }, [items, time]);

  async function handleConfirmFinish() {
    setRunning(false);
    setShowConfirm(false);

    const safe = Array.isArray(items) ? items : [];
    const entries = mapItemsToEntries(safe);

    // Build a client-side summary: total selected vs completed + list of exercises with done flag
    const summary = (() => {
      const list = safe.map((it) => {
        const d = (it && typeof it.data === 'object' && it.data) ? it.data : {};
        const hasCardio = Array.isArray(d.cardioSets) && d.cardioSets.length > 0;
        const muscuSets = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);
        const hasMuscu = muscuSets.length > 0;
        return {
          exerciseName: String(it?.name || it?.label || it?.exoName || 'Exercice'),
          done: Boolean(hasCardio || hasMuscu),
        };
      });
      const completed = list.filter(x => x.done).length;
      return {
        plannedExercises: list.length,
        completedExercises: completed,
        skippedExercises: Math.max(0, list.length - completed),
        exercises: list,
      };
    })();

    const res = await save({ entries, durationSec: time, label, summary });

    if (typeof onFinish === "function") {
      onFinish({
        durationSec: time,
        savedCount: res?.ok ? 1 : 0,
        calories,
        doneExercises,
        totalExercises,
      });
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, "0");
    const seconds = (time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            C'est parti pour <span className={styles.highlight}>{label || "ta séance"}</span>
          </h2>
          <div className={styles.actions}>
            <button className={styles.goBtn} onClick={() => setRunning(true)}>
              Go for it
            </button>
            <button className={styles.finishBtn} onClick={() => setShowConfirm(true)} disabled={saving} aria-busy={saving}>
              Terminer
            </button>
          </div>
        </div>
        <div className={styles.stats}>
          <span>⏱ {formatTime(time)}</span>
          <span>🎯 {totalExercises} exercices</span>
          <span>🔥 {calories} cal</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progress}
            style={{ width: `${totalExercises ? Math.min(100, Math.max(0, (doneExercises / totalExercises) * 100)) : 0}%` }}
          />
        </div>
        <p className={styles.progressText}>
          {doneExercises} sur {totalExercises} exercices terminés
        </p>
      </div>
      {showConfirm && (
        <div className={styles.confirmOverlay} style={{ position: "fixed", inset: 0, zIndex: 99999 }} data-testid="confirm-overlay">
          <div className={styles.confirmBox} style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.25)" }}>
            <h3>Terminer la séance ?</h3>
            <p>Êtes-vous sûr de vouloir terminer votre séance d'entraînement ? Vos progrès seront sauvegardés.</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setShowConfirm(false)}>Continuer</button>
              <button className={styles.finishBtn} onClick={handleConfirmFinish} disabled={saving} aria-busy={saving}>Terminer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Chrono;
