import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./SuivieCard.module.css";

import useExerciceForm from "./hooks/useExerciceForm";

import ModeBar from "./ModeBar/ModeBar";
import modeStyles from "./ModeBar/ModeBar.module.css";

import GlobalRestTimer from "./GlobalRestTimer/GlobalRestTimer";

import SwimForm from "./Forms/SwimForm";
import YogaForm from "./Forms/YogaForm";
import StretchForm from "./Forms/StretchForm";
import WalkRunForm from "./Forms/WalkRunForm";
import HIITForm from "./Forms/HIITForm";
import MuscuForm from "./Forms/MuscuForm";
import PdcForm from "./Forms/PdcForm";
import CardioForm from "./Forms/CardioForm";

import NotesSection from "./Notes/NotesSection";
import notesStyles from "./Notes/NotesSaction.module.css";

import { idOf } from "../../Shared/idOf.js";

// ========================================
// LOCAL STORAGE HELPERS
// ========================================

const STORAGE_NS = "suivie_exo_inputs:";

function storageKeyFromExo(exo) {
  try {
    return STORAGE_NS + String(idOf(exo));
  } catch {
    return STORAGE_NS + "unknown";
  }
}

function loadSavedDraft(exo) {
  try {
    const raw = localStorage.getItem(storageKeyFromExo(exo));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(exo, data) {
  try {
    localStorage.setItem(storageKeyFromExo(exo), JSON.stringify(data));
  } catch {
    // Silently fail
  }
}

// ========================================
// EXERCISE COMPLETION CHECKER
// ========================================

function isExerciseDone(nextData) {
  if (!nextData) return false;

  // Check swim
  if (nextData.swim) {
    const { poolLength = 0, lapCount = 0, totalDistance = 0 } = nextData.swim;
    if (Number(poolLength) > 0 && Number(lapCount) > 0) return true;
    if (Number(totalDistance) > 0) return true;
  }

  // Check yoga
  if (nextData.yoga) {
    const duration = Number(nextData.yoga.durationMin ?? 0);
    const style = String(nextData.yoga.style ?? "").trim();
    const focus = String(nextData.yoga.focus ?? "").trim();
    if (duration > 0 || style || focus) return true;
  }

  // Check stretch
  if (nextData.stretch) {
    const duration = Number(nextData.stretch.durationSec ?? nextData.stretch.duration ?? 0);
    if (duration > 0) return true;
  }

  // Check walk/run
  if (nextData.walkRun) {
    const duration = Number(nextData.walkRun.durationMin ?? 0);
    const distance = Number(nextData.walkRun.distanceKm ?? 0);
    if (duration > 0 || distance > 0) return true;
  }

  // Check HIIT
  if (nextData.hiit) {
    const rounds = Array.isArray(nextData.hiit.rounds) ? nextData.hiit.rounds : [];
    if (rounds.length > 0) return true;
  }

  // Check cardio sets
  if (Array.isArray(nextData.cardioSets) && nextData.cardioSets.length > 0) {
    return nextData.cardioSets.some(cs => {
      const dur = Number(cs?.durationSec ?? cs?.duration ?? 0);
      const dist = Number(cs?.distance ?? 0);
      const cals = Number(cs?.calories ?? 0);
      return dur > 0 || dist > 0 || cals > 0;
    });
  }

  // Check muscu/pdc sets
  const sets = Array.isArray(nextData.sets) ? nextData.sets : [];
  return sets.some(s => {
    const reps = Number(s?.reps ?? 0);
    const time = Number(s?.durationSec ?? s?.timeSec ?? 0);
    const weight = Number(s?.weight ?? s?.weightKg ?? 0);
    return reps > 0 || time > 0 || weight > 0;
  });
}

// ========================================
// MAIN COMPONENT
// ========================================

function SuivieCard({ exo, value, onChange }) {
  const [open, setOpen] = useState(false);
  const hydratedOnMountRef = useRef(false);

  const {
    mode,
    setMode,
    availableModes,
    data,
    emit,
    isCardio,
    isPdc,
    isMuscu,
    isSwim,
    isYoga,
    isStretch,
    isWalkRun,
    isHIIT,
    addSet,
    removeSet,
    patchSet,
    addCardioSet,
    removeCardioSet,
    patchCardioSet,
    patchSwim,
    patchYoga,
    patchStretch,
    patchWalkRun,
    patchHIIT,
    lastExerciseData,
    progression,
  } = useExerciceForm(exo, value, onChange);

  // Extracted data for convenience
  const sets = useMemo(() => Array.isArray(data?.sets) ? data.sets : [], [data?.sets]);
  const cardioSets = useMemo(() => Array.isArray(data?.cardioSets) ? data.cardioSets : [], [data?.cardioSets]);

  // Exercise display info
  const imgSrc = useMemo(() =>
    Array.isArray(exo?.images) && exo.images.length ? exo.images[0] : null,
    [exo?.images]
  );
  const initialLetter = useMemo(() =>
    exo?.name?.trim()?.[0]?.toUpperCase() || "?",
    [exo?.name]
  );

  // Check if this is a forced mode exercise
  const hasForcedMode = isSwim || isYoga || isStretch || isWalkRun || isHIIT;
  const showModeBar = !hasForcedMode && availableModes.length > 1;
  const showRestTimer = !isCardio && !hasForcedMode;

  // Handle modal close
  const handleClosePopup = useCallback(() => {
    const payload = { ...data, mode };
    const done = isExerciseDone(payload);
    const next = { ...payload, done };

    try {
      if (typeof emit === 'function') {
        emit(next);
      }
      if (typeof onChange === 'function') {
        onChange(idOf(exo), next);
      }
    } catch (err) {
      console.error('Error saving exercise data:', err);
    }

    setOpen(false);
  }, [data, mode, emit, onChange, exo]);

  // Handle mode change from ModeBar
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    const next = { ...data, mode: newMode };
    const enriched = { ...next, done: isExerciseDone(next) };
    if (typeof emit === 'function') {
      emit(enriched);
    }
  }, [data, setMode, emit]);

  // Handle notes change
  const handleNotesChange = useCallback((val) => {
    emit({ ...data, notes: val });
  }, [data, emit]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydratedOnMountRef.current) return;

    const saved = loadSavedDraft(exo);
    if (saved) {
      // Don't restore mode if exercise has forced mode
      if (saved.mode && saved.mode !== mode && !hasForcedMode) {
        setMode(saved.mode);
      }
      const done = isExerciseDone(saved);
      const enriched = {
        ...saved,
        mode: hasForcedMode ? mode : (saved.mode || mode),
        done
      };
      if (typeof emit === "function") {
        emit(enriched);
      }
    }

    hydratedOnMountRef.current = true;
  }, [exo, mode, hasForcedMode, setMode, emit]);

  // Manage body scroll when modal is open
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  // Auto-save to localStorage when data changes
  useEffect(() => {
    if (!hydratedOnMountRef.current) return;

    const payload = { ...data, mode };
    const done = isExerciseDone(payload);
    const enriched = { ...payload, done };
    saveDraft(exo, enriched);
  }, [data, mode, exo]);

  return (
    <>
      {/* Exercise Card Button */}
      <div className={styles.card}>
        <button
          type="button"
          className={styles.row}
          onClick={() => setOpen(true)}
          aria-label={`Ouvrir ${exo?.name || 'exercice'}`}
        >
          <div className={styles.thumb} aria-hidden="true">
            {imgSrc ? (
              <img src={imgSrc} alt="" />
            ) : (
              <div className={styles.initial}>{initialLetter}</div>
            )}
          </div>
          <div className={styles.title}>{exo?.name || "Exercice"}</div>
        </button>
      </div>

      {/* Modal */}
      {open && createPortal(
        <div
          className={`${styles.overlay} ${open ? styles.isOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!open}
          onClick={handleClosePopup}
        >
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <header className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>{exo?.name}</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClosePopup}
                aria-label="Fermer"
              >
                ×
              </button>
            </header>

            {/* Body */}
            <div className={styles.popupBody}>
              {/* Mode Selection Bar */}
              {showModeBar && (
                <ModeBar
                  mode={mode}
                  availableModes={availableModes}
                  onChange={handleModeChange}
                  classes={{ modeBar: modeStyles.modeBar, selectControl: modeStyles.selectControl }}
                />
              )}

              {/* Global Rest Timer */}
              {showRestTimer && <GlobalRestTimer />}

              {/* Form based on mode */}
              {isSwim ? (
                <SwimForm swim={data?.swim} onPatch={patchSwim} />
              ) : isYoga ? (
                <YogaForm yoga={data?.yoga} onPatch={patchYoga} />
              ) : isStretch ? (
                <StretchForm stretch={data?.stretch} onPatch={patchStretch} />
              ) : isWalkRun ? (
                <WalkRunForm data={data} patchWalkRun={patchWalkRun} />
              ) : isHIIT ? (
                <HIITForm value={data?.hiit} onChange={patchHIIT} exoName={exo?.name} />
              ) : isCardio ? (
                <CardioForm
                  cardioSets={cardioSets}
                  onAdd={addCardioSet}
                  onRemove={removeCardioSet}
                  onPatch={patchCardioSet}
                />
              ) : isPdc ? (
                <PdcForm
                  sets={sets}
                  onAdd={addSet}
                  onRemove={removeSet}
                  onPatch={patchSet}
                  progression={progression}
                  lastExerciseData={lastExerciseData}
                />
              ) : (
                <MuscuForm
                  sets={sets}
                  onAdd={addSet}
                  onRemove={removeSet}
                  onPatch={patchSet}
                  progression={progression}
                  lastExerciseData={lastExerciseData}
                />
              )}

              {/* Notes Section */}
              <NotesSection
                notes={data?.notes || ""}
                onChange={handleNotesChange}
                classes={{ container: notesStyles.container }}
              />
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
              <button
                type="button"
                onClick={handleClosePopup}
                className={styles.saveBtn}
              >
                Terminer
              </button>
            </footer>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default memo(SuivieCard);
