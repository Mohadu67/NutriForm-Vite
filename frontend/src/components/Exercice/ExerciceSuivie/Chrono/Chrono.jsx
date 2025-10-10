import { useState, useEffect, useMemo } from "react";
import { mapItemsToEntries } from "../../TableauBord/sessionApi";
import styles from "./Chrono.module.css";
import useSaveSession from "../ExerciceCard/hooks/useSaveSession";
import useChronoCore from "./useChronoCore";
import EchauffementModal from "./EchauffementModal";

function Chrono({ label, items = [], startedAt, resumeFromStartedAt = true, onStart = null, onFinish = () => {} }) {
  const { save, saving } = useSaveSession();

  const { time, setTime, running, setRunning, showConfirm, setShowConfirm, startTs, setStartTs, stopAndReset, freezeClock } = useChronoCore(startedAt, { resume: resumeFromStartedAt });

  const hasSession = Boolean(startTs || startedAt);
  const [showWarmup, setShowWarmup] = useState(false);

  const muscleGroups = useMemo(() => {
    const safe = Array.isArray(items) ? items : [];
    const groups = new Set();

    safe.forEach(it => {
      // Détecter le type d'activité
      const typeRaw = String(it?.mode ?? it?.type ?? '').toLowerCase();
      const nameRaw = String(it?.name ?? '').toLowerCase();

      // Activités douces (sans échauffement physique)
      if (typeRaw.includes('meditation') || nameRaw.includes('meditation') || nameRaw.includes('méditation')) {
        groups.add('meditation');
        return;
      }
      if (typeRaw.includes('yoga') || nameRaw.includes('yoga')) {
        groups.add('yoga');
        return;
      }
      if (typeRaw.includes('etirement') || typeRaw.includes('étirement') || nameRaw.includes('etirement') || nameRaw.includes('étirement')) {
        groups.add('etirement');
        return;
      }

      // Cardio
      if (typeRaw.includes('cardio')) {
        groups.add('cardio');
        return;
      }

      // Analyser les muscles ciblés
      const muscles = it?.muscles || [];
      const muscleArray = Array.isArray(muscles) ? muscles : [muscles];

      muscleArray.forEach(muscle => {
        const muscleStr = String(muscle).toLowerCase();

        // Mapper les muscles vers les groupes principaux
        if (muscleStr.includes('pec') || muscleStr.includes('chest') || muscleStr.includes('poitrine')) {
          groups.add('pectoraux');
        }
        if (muscleStr.includes('epaule') || muscleStr.includes('delt') || muscleStr.includes('shoulder')) {
          groups.add('epaules');
        }
        if (muscleStr.includes('bicep') || muscleStr.includes('tricep') || muscleStr.includes('avant-bras') || muscleStr.includes('forearm')) {
          groups.add('bras');
        }
        if (muscleStr.includes('dos') || muscleStr.includes('back') || muscleStr.includes('trap') || muscleStr.includes('lat') || muscleStr.includes('lombaire')) {
          groups.add('dos');
        }
        if (muscleStr.includes('abdo') || muscleStr.includes('abs') || muscleStr.includes('oblique') || muscleStr.includes('core')) {
          groups.add('core');
        }
        if (muscleStr.includes('cuisse') || muscleStr.includes('quad') || muscleStr.includes('ischio') || muscleStr.includes('fessier') || muscleStr.includes('mollet') || muscleStr.includes('jambe') || muscleStr.includes('leg') || muscleStr.includes('glute') || muscleStr.includes('calf')) {
          groups.add('jambes');
        }
      });
    });

    return Array.from(groups);
  }, [items]);

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
    const finalSec = freezeClock(time, startTs);

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
        onFinish({ durationSec: finalSec, savedCount: 0, calories, doneExercises, totalExercises });
      }
      setShowConfirm(false);
      stopAndReset();
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
          done: Boolean(it?.done || hasCardio || hasMuscu),
          note: typeof d?.notes === 'string' && d.notes.trim() ? d.notes.trim() : undefined,
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
      const res = await save({ entries, durationSec: finalSec, label, summary });
      const savedCount = res?.ok && !res?.skipped ? 1 : 0;
      if (typeof onFinish === 'function') {
        onFinish({ durationSec: finalSec, savedCount, calories, doneExercises, totalExercises, summary });
      }
      setShowConfirm(false);
      stopAndReset();
    } catch (err) {
      console.error('[Chrono] save failed', err);
      if (typeof onFinish === 'function') {
        onFinish({ durationSec: finalSec, savedCount: 0, calories, doneExercises, totalExercises, summary });
      }
      setShowConfirm(false);
      stopAndReset();
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, "0");
    const seconds = (time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleStartSession = () => {
    setTime(0);
    if (!startTs) {
      const ts = startedAt ? new Date(startedAt).getTime() : Date.now();
      const safeTs = Number.isNaN(ts) ? Date.now() : ts;
      setStartTs(safeTs);
      if (typeof onStart === "function") {
        try { onStart(new Date(safeTs).toISOString()); } catch {}
      }
    }
    setRunning(true);
    setShowWarmup(false);
  };

  return (
    <>
      {showWarmup && (
        <EchauffementModal
          onStart={handleStartSession}
          onSkip={handleStartSession}
          muscleGroups={muscleGroups}
        />
      )}
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            C'est parti pour ta séance <span className={styles.highlight}>{label || "ta séance"}</span>
          </h2>
          <div className={styles.actions}>
            {(!hasSession) && (
              <button
                className={styles.goBtn}
                onClick={() => {
                  setShowWarmup(true);
                }}>
                Commencer
              </button>
            )}
            {(hasSession && !running) && (
              <button
                className={styles.goBtn}
                onClick={() => {
                  if (!startTs) {
                    const parsed = startedAt ? new Date(startedAt).getTime() : NaN;
                    const safeTs = Number.isNaN(parsed) ? (Date.now() - (Number(time || 0) * 1000)) : parsed;
                    setStartTs(safeTs);
                  }
                  setRunning(true);
                }}>
                Reprendre
              </button>
            )}
            {(hasSession && running) && (
              <button className={styles.goBtn} disabled>
                En cours…
              </button>
            )}
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
