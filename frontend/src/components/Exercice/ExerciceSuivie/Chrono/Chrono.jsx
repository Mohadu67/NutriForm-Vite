import { useState, useEffect, useMemo } from "react";
import styles from "./Chrono.module.css";
import useSaveSession from "../ExerciceCard/hooks/useSaveSession";

function Chrono({ label, items = [], onFinish = () => {} }) {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { save } = useSaveSession();

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

    let kcal = 0;
    for (const it of safe) {
      const d = it?.data || {};
      const cardioSets = Array.isArray(d.cardioSets) ? d.cardioSets : [];
      const muscuSets = Array.isArray(d.sets) ? d.sets : [];
      if (cardioSets.length) {
        kcal += cardioSets.length * 8; // estimation simple: 8 kcal par bloc cardio
      }
      if (muscuSets.length) {
        for (const s of muscuSets) {
          const w = Number(s.weightKg ?? s.weight ?? 0);
          const r = Number(s.reps ?? s.rep ?? 0);
          kcal += w && r ? (w * Math.max(1, r) * 0.1) : 5;
        }
      }
    }
    return { totalExercises: total, doneExercises: done, calories: Math.round(kcal) };
  }, [items, time]);

  async function handleConfirmFinish() {
    setRunning(false);
    setShowConfirm(false);
    let saved = 0;
    if (Array.isArray(items) && items.length) {
      for (const it of items) {
        const res = await save({ exo: it.exo, data: it.data, mode: it.mode });
        if (res?.ok) saved++;
      }
    }
    if (typeof onFinish === "function") {
      onFinish({
        durationSec: time,
        savedCount: saved,
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
            <button className={styles.finishBtn} onClick={() => setShowConfirm(true)}>
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
            style={{ width: `${totalExercises ? (doneExercises / totalExercises) * 100 : 0}%` }}
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
              <button className={styles.finishBtn} onClick={handleConfirmFinish}>Terminer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Chrono;
