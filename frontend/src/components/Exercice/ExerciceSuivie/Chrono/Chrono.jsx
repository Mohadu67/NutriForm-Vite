import { useState, useEffect, useMemo } from "react";
import { storage } from '../../../../shared/utils/storage';
import { createPortal } from "react-dom";
import { mapItemsToEntries } from "../../../History/SessionTracking/sessionApi";
import styles from "./Chrono.module.css";
import useSaveSession from "../ExerciceCard/hooks/useSaveSession";
import useChronoCore from "./useChronoCore";
import EchauffementModal from "./EchauffementModal";
import SaveLoadingAnimation from "./SaveLoadingAnimation";
import ShareModal from "../../../Share/ShareModal";
import CancelSessionModal from "./CancelSessionModal";
import logger from '../../../../shared/utils/logger.js';
import { toast } from 'sonner';

function Chrono({ label, items = [], startedAt, resumeFromStartedAt = true, onStart = null, onFinish = () => {}, pastSession = null }) {
  const { save, saving } = useSaveSession();

  const { time, setTime, running, setRunning, showConfirm, setShowConfirm, startTs, setStartTs, stopAndReset, freezeClock } = useChronoCore(startedAt, { resume: resumeFromStartedAt });

  const hasSession = Boolean(startTs || startedAt);
  const [showWarmup, setShowWarmup] = useState(!hasSession && !pastSession); // Afficher automatiquement si pas de session en cours
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedSession, setSavedSession] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);

  // Afficher le modal d'échauffement automatiquement au premier chargement
  useEffect(() => {
    if (!hasSession && !showWarmup && !pastSession) {
      setShowWarmup(true);
    }
  }, [hasSession, showWarmup, pastSession]);

  // Auto-start for past sessions (no need for user to press Start)
  useEffect(() => {
    if (pastSession && !startTs) {
      const ts = Date.now();
      setStartTs(ts);
      if (typeof onStart === 'function') {
        try { onStart(new Date(ts).toISOString()); } catch {}
      }
    }
  }, [pastSession]);

  const muscleGroups = useMemo(() => {
    const safe = Array.isArray(items) ? items : [];
    const groups = new Set();

    safe.forEach(it => {
      
      const typeRaw = String(it?.mode ?? it?.type ?? '').toLowerCase();
      const nameRaw = String(it?.name ?? '').toLowerCase();

      
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

      if (typeRaw.includes('swim') || typeRaw.includes('natation') || nameRaw.includes('swim') || nameRaw.includes('natation')) {
        groups.add('swim');
        return;
      }

      
      if (typeRaw.includes('cardio')) {
        groups.add('cardio');
        return;
      }

      
      const muscles = it?.muscles || [];
      const muscleArray = Array.isArray(muscles) ? muscles : [muscles];

      muscleArray.forEach(muscle => {
        const muscleStr = String(muscle).toLowerCase();

        
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

  const hasSwimData = (swim) => {
    if (!swim || typeof swim !== "object") return false;
    const pool = Number(swim.poolLength ?? swim.length ?? 0);
    const laps = Number(swim.lapCount ?? swim.laps ?? 0);
    const distance = Number(swim.totalDistance ?? 0);
    return (pool > 0 && laps > 0) || distance > 0;
  };

  const hasYogaData = (yoga) => {
    if (!yoga || typeof yoga !== "object") return false;
    const duration = Number(yoga.durationMin ?? yoga.duration ?? 0);
    const style = typeof yoga.style === "string" ? yoga.style.trim() : "";
    const focus = typeof yoga.focus === "string" ? yoga.focus.trim() : "";
    return duration > 0 || style.length > 0 || focus.length > 0;
  };

  const hasStretchData = (stretch) => {
    if (!stretch || typeof stretch !== "object") return false;
    const durationSec = Number(stretch.durationSec ?? stretch.duration ?? 0);
    return durationSec > 0;
  };

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
      if (hasSwimData(d.swim)) return true;
      if (hasYogaData(d.yoga)) return true;
      if (hasStretchData(d.stretch)) return true;

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
      if (raw.includes('swim')) return 'swim';
      if (raw.includes('yoga')) return 'yoga';
      if (raw.includes('cardio')) return 'cardio';
      if (raw.includes('muscu')) return 'muscu';
      if (hasSwimData(d.swim)) return 'swim';
      if (hasYogaData(d.yoga)) return 'yoga';
      if (Array.isArray(d.cardioSets)) return 'cardio';
      return 'muscu';
    };
    const perMinKcal = (label) => {
      if (label.includes('nata') || label.includes('swim') || label.includes('piscine')) return 9;
      if (label.includes('yoga')) return 4;
      if (label.includes('etir') || label.includes('étir') || label.includes('stretch') || label.includes('mobility') || label.includes('souplesse')) return 3;
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
      if (t === 'cardio' || t === 'swim') {
        const sets = Array.isArray(d.cardioSets) ? d.cardioSets : [];
        const rate = perMinKcal(nameOf(it));
        let added = false;
        for (const s of sets) {
          const min = Number(s.durationMin ?? s.minutes ?? 0) || 0;
          const sec = Number(s.durationSec ?? 0) || 0;
          const durMin = (min + sec / 60) || 5 / 60; 
          kcal += durMin * rate;
          added = true;
        }
        if (!added && hasSwimData(d.swim)) {
          const swim = d.swim;
          const pool = Number(swim.poolLength ?? swim.length ?? 0);
          const laps = Number(swim.lapCount ?? swim.laps ?? 0);
          const distance = Number(swim.totalDistance ?? 0) || (pool > 0 && laps > 0 ? pool * laps * 2 : 0);
          const estDur = distance > 0 ? Math.max(10, distance / 50) : 10;
          kcal += estDur * rate;
        }
      } else if (t === 'yoga') {
        const yoga = d.yoga;
        if (yoga) {
          const duration = Number(yoga.durationMin ?? yoga.duration ?? 0) || 15;
          const rate = 4;
          kcal += duration * rate;
        }
      } else if (t === 'stretch') {
        const stretch = d.stretch;
        if (stretch) {
          const durationSec = Number(stretch.durationSec ?? stretch.duration ?? 0);
          const durationMin = durationSec > 0 ? durationSec / 60 : 0;
          const rate = 3;
          const effectiveDuration = durationMin > 0 ? durationMin : 0.5;
          kcal += effectiveDuration * rate;
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

  const handleCancelSession = (reasonId) => {
    setShowCancelReasonModal(false);
    stopAndReset();
    if (typeof onFinish === 'function') {
      onFinish({
        durationSec: 0,
        savedCount: 0,
        calories: 0,
        doneExercises: 0,
        totalExercises: 0,
        cancelReason: reasonId
      });
    }
  };

  const handleContinueSession = () => {
    setShowCancelReasonModal(false);
    setShowConfirm(false);
  };

  async function handleConfirmFinish() {
    setShowConfirm(false);

    const finalSec = freezeClock(time, startTs);

    const safe = Array.isArray(items) ? items : [];
    let entries = mapItemsToEntries(safe);

    if (!Array.isArray(entries) || entries.length === 0) {
      const fallback = safe
        .filter(it => {
          if (!it) return false;
          if (it.done) return true;
          const d = it?.data || {};
          if (Array.isArray(d.cardioSets) && d.cardioSets.some(cs => {
            const dur = Number(cs?.durationSec ?? cs?.duration ?? 0);
            const dist = Number(cs?.distance ?? 0);
            const cals = Number(cs?.calories ?? 0);
            return dur > 0 || dist > 0 || cals > 0;
          })) return true;
          if (hasSwimData(d.swim) || hasYogaData(d.yoga) || hasStretchData(d.stretch)) return true;
          const sets = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);
          return sets.length > 0;
        })
        .map(it => {
          if (!it) return null;
          const d = it?.data || {};
          const id = it?.id || it?.slug || it?._id || String(it?.name || 'exo').toLowerCase();
          const name = String(it?.name || it?.label || 'Exercice');
          const baseNotes = typeof d?.notes === "string" && d.notes.trim() ? d.notes.trim() : "";
          const appendNotes = (extra) => {
            if (!extra) return baseNotes;
            return baseNotes ? `${baseNotes} • ${extra}` : extra;
          };

          if (Array.isArray(d.cardioSets) && d.cardioSets.length > 0) {
            const sets = d.cardioSets.map(cs => {
              const durationSec = Number(cs.durationSec ?? 0) || (Number(cs.durationMin ?? cs.minutes ?? 0) * 60);
              const distanceKm = cs.distanceKm != null ? Number(cs.distanceKm) : undefined;
              const calories = cs.calories != null ? Number(cs.calories) : undefined;
              return {
                durationSec: durationSec > 0 ? durationSec : undefined,
                distanceKm: distanceKm > 0 ? distanceKm : undefined,
                calories: calories > 0 ? calories : undefined,
              };
            }).filter(s => s.durationSec != null || s.distanceKm != null || s.calories != null);
            if (sets.length) {
              return { exerciseId: id, name, type: 'cardio', sets, notes: baseNotes || undefined };
            }
          }

          if (hasSwimData(d.swim)) {
            const swim = d.swim;
            const pool = Number(swim.poolLength ?? swim.length ?? 0);
            const laps = Number(swim.lapCount ?? swim.laps ?? 0);
            let totalDistance = Number(swim.totalDistance ?? 0);
            if (!totalDistance && pool > 0 && laps > 0) {
              totalDistance = pool * laps * 2;
            }
            const distanceKm = totalDistance > 0 ? totalDistance / 1000 : undefined;
            const swimSet = {
              distanceKm,
              laps: laps || undefined,
              poolLength: pool || undefined,
            };
            return {
              exerciseId: id,
              name,
              type: 'cardio',
              subType: 'swim',
              notes: appendNotes('Natation'),
              sets: [swimSet],
            };
          }

          const muscuSets = Array.isArray(d.sets) ? d.sets : (Array.isArray(d.series) ? d.series : []);
          if (muscuSets.length > 0) {
            const sets = muscuSets.map(ms => ({
              reps: Number(ms.reps ?? ms.rep ?? 0) || undefined,
              weightKg: Number(ms.weightKg ?? ms.weight ?? 0) || undefined,
              durationSec: Number(ms.durationSec ?? ms.timeSec ?? 0) || undefined,
            })).filter(s => s.reps || s.weightKg || s.durationSec);
            if (sets.length) {
              return { exerciseId: id, name, type: 'muscu', sets, notes: baseNotes || undefined };
            }
          }

          if (hasYogaData(d.yoga)) {
            const yoga = d.yoga;
            const durationMin = Number(yoga.durationMin ?? yoga.duration ?? 0);
            const durationSec = durationMin > 0 ? durationMin * 60 : 900;
            const style = typeof yoga.style === "string" ? yoga.style.trim() : "";
            const focus = typeof yoga.focus === "string" ? yoga.focus.trim() : "";
            const extra = [style, focus].filter(Boolean).join(' • ');
            return {
              exerciseId: id,
              name,
              type: 'cardio',
              subType: 'yoga',
              notes: appendNotes(extra || 'Yoga'),
              sets: [{ durationSec }],
            };
          }

          if (hasStretchData(d.stretch)) {
            const stretch = d.stretch;
            const durationSec = Number(stretch.durationSec ?? stretch.duration ?? 0) || 240;
            return {
              exerciseId: id,
              name,
              type: 'cardio',
              subType: 'stretch',
              notes: appendNotes('Étirements'),
              sets: [{
                durationSec,
              }],
            };
          }

          return null;
        })
        .filter(Boolean);

      if (fallback.length > 0) {
        entries = fallback;
      }
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      if (typeof onFinish === 'function') {
        onFinish({ durationSec: finalSec, savedCount: 0, calories, doneExercises, totalExercises });
      }
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
          done: Boolean(it?.done || hasCardio || hasMuscu || hasSwimData(d.swim) || hasYogaData(d.yoga) || hasStretchData(d.stretch)),
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
      const saveOpts = { entries, durationSec: finalSec, label: displayLabel, summary };
      if (pastSession) {
        const dateStr = pastSession.date; // 'YYYY-MM-DD'
        const durationMin = pastSession.durationMin || 0;
        const durationSec = durationMin * 60;
        const start = new Date(`${dateStr}T10:00:00`);
        const end = new Date(start.getTime() + durationSec * 1000);
        saveOpts.startedAt = start.toISOString();
        saveOpts.endedAt = end.toISOString();
        saveOpts.durationSec = durationSec;
      }
      const res = await save(saveOpts);
      const savedCount = res?.ok && !res?.skipped ? 1 : 0;

      // Stocker la session et les stats pour le partage
      if (res?.ok && !res?.skipped && res?.data) {
        setSavedSession(res.data);
        setSessionStats({ calories, doneExercises, totalExercises, durationSec: saveOpts.durationSec || finalSec });
        setShowConfirm(false);
        // Ouvrir directement le modal de partage
        setShowShareModal(true);
      } else if (res?.isPremiumRequired) {
        // Free user trying to save
        toast.error("Passe Premium pour sauvegarder tes séances ✨");
        if (typeof onFinish === 'function') {
          onFinish({ durationSec: saveOpts.durationSec || finalSec, savedCount: 0, calories, doneExercises, totalExercises, summary });
        }
        stopAndReset();
      } else {
        if (typeof onFinish === 'function') {
          onFinish({ durationSec: saveOpts.durationSec || finalSec, savedCount, calories, doneExercises, totalExercises, summary });
        }
        stopAndReset();
      }
    } catch (err) {
      logger.error('[Chrono] save failed', err);
      if (err?.isPremiumRequired || err?.status === 403) {
        toast.error("Passe Premium pour sauvegarder tes séances ✨");
      }
      if (typeof onFinish === 'function') {
        onFinish({ durationSec: saveOpts.durationSec || finalSec, savedCount: 0, calories, doneExercises, totalExercises, summary });
      }
      stopAndReset();
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, "0");
    const seconds = (time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Déterminer le label à afficher avec génération automatique
  const displayLabel = useMemo(() => {
    const isDefaultLabel = !label || label.toLowerCase() === 'ta séance' || label.toLowerCase() === 'séance' || label.trim() === '';

    if (!isDefaultLabel) {
      return label;
    }

    // Générer un nom automatique basé sur les groupes musculaires
    if (!muscleGroups || muscleGroups.length === 0) {
      return "Séance d'entraînement";
    }

    const muscleNames = {
      'pectoraux': 'Pectoraux',
      'epaules': 'Épaules',
      'bras': 'Bras',
      'dos': 'Dos',
      'core': 'Core',
      'jambes': 'Jambes',
      'cardio': 'Cardio',
      'yoga': 'Yoga',
      'meditation': 'Méditation',
      'etirement': 'Étirements',
      'swim': 'Natation'
    };

    const names = muscleGroups.map(g => muscleNames[g] || g).filter(Boolean);

    // Full Body = haut ET bas du corps
    const hasUpper = muscleGroups.some(g => ['pectoraux', 'epaules', 'bras', 'dos'].includes(g));
    const hasLower = muscleGroups.some(g => g === 'jambes');
    const isFullBody = hasUpper && hasLower;

    let generatedName;
    if (names.length === 0) {
      generatedName = "Séance d'entraînement";
    } else if (isFullBody) {
      generatedName = 'Séance Full Body';
    } else if (names.length <= 3) {
      generatedName = `Séance ${names.join(' + ')}`;
    } else {
      generatedName = `Séance ${names.slice(0, 2).join(' + ')} +${names.length - 2}`;
    }

    return generatedName;
  }, [label, muscleGroups]);

  const handleStartSession = () => {
    setTime(0);
    if (!startTs) {
      const ts = startedAt ? new Date(startedAt).getTime() : Date.now();
      const safeTs = Number.isNaN(ts) ? Date.now() : ts;
      setStartTs(safeTs);
      if (typeof onStart === "function") {
        try { onStart(new Date(safeTs).toISOString()); } catch (e) {
          logger.error("Failed to call onStart callback:", e);
        }
      }
    }
    setRunning(true);
    setShowWarmup(false);
  };

  return (
    <>
      {saving && <SaveLoadingAnimation />}

      {showWarmup && !pastSession && createPortal(
        <EchauffementModal
          onStart={handleStartSession}
          onSkip={handleStartSession}
          muscleGroups={muscleGroups}
        />,
        document.body
      )}
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {pastSession ? (
              <>Séance du <span className={styles.highlight}>{new Date(pastSession.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></>
            ) : (
              <>C'est parti pour <span className={styles.highlight}>{displayLabel}</span></>
            )}
          </h2>
          <div className={styles.actions}>
            {!pastSession && (
              <>
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
                  <button
                    className={styles.goBtn}
                    onClick={() => setRunning(false)}>
                    Pause
                  </button>
                )}
              </>
            )}
            <button className={styles.finishBtn} onClick={() => setShowConfirm(true)} disabled={saving} aria-busy={saving}>
              {pastSession ? 'Sauvegarder' : 'Terminer'}
            </button>
          </div>
        </div>
        <div className={styles.stats}>
          {pastSession ? (
            <span>⏱ {pastSession.durationMin || '?'} min</span>
          ) : (
            <span>⏱ {formatTime(time)}</span>
          )}
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
      {showConfirm && createPortal(
        <div className={styles.confirmOverlay} data-testid="confirm-overlay">
          <div className={styles.confirmBox}>
            <h3>Terminer la séance ?</h3>
            <p>Êtes-vous sûr de vouloir terminer votre séance d'entraînement ? Vos progrès seront sauvegardés.</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setShowConfirm(false)}>Continuer</button>
              <button className={styles.finishBtn} onClick={handleConfirmFinish} disabled={saving} aria-busy={saving}>Terminer</button>
            </div>
            <button
              className={styles.cancelLink}
              onClick={() => {
                setShowConfirm(false);
                setShowCancelReasonModal(true);
              }}
            >
              Annuler la séance
            </button>
          </div>
        </div>,
        document.body
      )}

      {savedSession && (
        <ShareModal
          show={showShareModal}
          onHide={() => {
            setShowShareModal(false);
            setSavedSession(null);
            setSessionStats(null);
            if (typeof onFinish === 'function') {
              onFinish({
                durationSec: sessionStats?.durationSec || 0,
                savedCount: 1,
                calories: sessionStats?.calories || 0,
                doneExercises: sessionStats?.doneExercises || 0,
                totalExercises: sessionStats?.totalExercises || 0
              });
            }
            stopAndReset();
          }}
          session={savedSession}
          user={storage.get('user') || {}}
        />
      )}

      <CancelSessionModal
        show={showCancelReasonModal}
        onCancel={handleCancelSession}
        onContinue={handleContinueSession}
      />
    </>
  );
}

export default Chrono;
