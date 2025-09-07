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
      if (it?.done) return true;
      const d = it?.data || {};

      if (Array.isArray(d.cardioSets) && d.cardioSets.length > 0) {
        return d.cardioSets.some(cs => {
          const dur = Number(cs?.durationSec ?? cs?.duration ?? 0);
          const dist = Number(cs?.distance ?? 0);
          const cals = Number(cs?.calories ?? 0);
          return dur > 0 || dist > 0 || cals > 0;
        });
      }

      const sets = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);
      return sets.some(s => {
        const reps = Number(s?.reps ?? s?.rep ?? 0);
        const time = Number(s?.durationSec ?? s?.timeSec ?? 0);
        const w   = Number(s?.weightKg ?? s?.weight ?? 0);
        return reps > 0 || time > 0 || w > 0;
      });
    };

    const done = safe.filter(hasAnySet).length;

    const nameOf = (it) => String(it?.name || it?.label || it?.exoName || '').toLowerCase();
    const guessType = (it, d) => {
      const raw = String(it?.mode ?? it?.type ?? '').toLowerCase();
      if (raw.includes('cardio')) return 'cardio';
      if (raw.includes('muscu')) return 'muscu';
      if (Array.isArray(d.cardioSets)) return 'cardio';
      return 'muscu';
    };
    const perMinKcal = (label) => {
      if (label.includes('course') || label.includes('run')) return 11;
      if (label.includes('velo') || label.includes('cycle') || label.includes('bike')) return 8;
      if (label.includes('rameur') || label.includes('row')) return 7;
      if (label.includes('marche') || label.includes('walk')) return 5;
      if (label.includes('corde') || label.includes('saut')) return 10; 
      return 7;
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
          const durMin = (min + sec / 60) || 5 / 60; 
          kcal += durMin * rate;
        }
      } else {
        const sets = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);
        for (const s of sets) {
          const w = Number(s.weightKg ?? s.weight ?? 0) || 0;
          const r = Number(s.reps ?? s.rep ?? 0) || 0;
          const perSet = w && r ? (w * r * 0.075) : (r ? r * 0.8 : 4);
          kcal += perSet;
        }
      }
    }
    const est = Math.max(0, Math.round(kcal));
    return { totalExercises: total, doneExercises: done, calories: est };
  }, [items, time]);

  async function handleConfirmFinish() {
    const safe = Array.isArray(items) ? items : [];
    let entries = mapItemsToEntries(safe);

    if (!Array.isArray(entries) || entries.length === 0) {
      const fallback = safe
        .filter(it => it && (it.done || (it.data && (Array.isArray(it.data.sets) ? it.data.sets.length : 0) > 0)))
        .map(it => {
          const d = it?.data || {};
          const sets = Array.isArray(d.sets) && d.sets.length > 0
            ? d.sets
            : [{ reps: Number(d.reps ?? 0) || 1, weightKg: Number(d.weightKg ?? d.weight ?? 0) || 0 }];
          const id = it?.id || it?.slug || it?._id || String(it?.name || 'exo').toLowerCase();
          const name = String(it?.name || it?.label || 'Exercice');
          const typeRaw = String(it?.mode ?? (Array.isArray(it?.type) ? it.type.join(',') : it?.type) ?? '').toLowerCase();
          const type = typeRaw.includes('cardio') ? 'cardio' : 'muscu';
          return { exerciseId: id, name, type, sets };
        });

      if (fallback.length > 0) {
        entries = fallback;
      }
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      console.info('[Chrono] Session not saved: NO_VALID_ENTRIES');
      if (typeof onFinish === 'function') {
        onFinish({ durationSec: time, savedCount: 0, calories, doneExercises, totalExercises });
      }
      return;
    }

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

    try {
      const res = await save({ entries, durationSec: time, label, summary });
      const savedCount = res?.ok && !res?.skipped ? 1 : 0;
      if (typeof onFinish === 'function') {
        onFinish({ durationSec: time, savedCount, calories, doneExercises, totalExercises });
      }
    } catch (err) {
      console.error('[Chrono] save failed', err);
      if (typeof onFinish === 'function') {
        onFinish({ durationSec: time, savedCount: 0, calories, doneExercises, totalExercises });
      }
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
