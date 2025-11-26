import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./SuivieCard.module.css";
import { storage } from "../../../../shared/utils/storage";

import useExerciceForm from "./hooks/useExerciceForm";

import ModeBar from "./ModeBar/ModeBar";
import modeStyles from "./ModeBar/ModeBar.module.css";

import GlobalRestTimer from "./GlobalRestTimer/GlobalRestTimer";

import SwimForm from "./Forms/SwimForm";
import YogaForm from "./Forms/YogaForm";
import StretchForm from "./Forms/StretchForm";
import WalkRunForm from "./Forms/WalkRunForm";
import MuscuForm from "./Forms/MuscuForm";
import PdcForm from "./Forms/PdcForm";
import CardioForm from "./Forms/CardioForm";

import NotesSection from "./Notes/NotesSection";
import notesStyles from "./Notes/NotesSaction.module.css";

import { idOf } from "../../Shared/idOf.js";
import logger from '../../../../shared/utils/logger.js';

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
    const raw = storage.get(storageKeyFromExo(exo));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function SuivieCard({ exo, value, onChange }) {
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
    isSwim,
    isYoga,
    isStretch,
    isWalkRun,
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
    lastExerciseData,
    progression,
  } = useExerciceForm(exo, value, onChange);


  const sets = Array.isArray(data?.sets) ? data.sets : [];
  const cardioSets = Array.isArray(data?.cardioSets) ? data.cardioSets : [];

  const imgSrc = Array.isArray(exo?.images) && exo.images.length ? exo.images[0] : null;
  const initialLetter = exo?.name?.trim()?.[0]?.toUpperCase() || "?";

  // Déterminer si l'exercice est commencé
  const isStarted = value && (
    value.done ||
    (Array.isArray(value.sets) && value.sets.length > 0) ||
    (Array.isArray(value.cardioSets) && value.cardioSets.length > 0) ||
    value.swim ||
    value.yoga ||
    value.stretch ||
    value.walkRun
  );

  function isExerciseDone(nextData) {
    if (!nextData) return false;
    if (nextData.swim) {
      const pool = Number(nextData.swim.poolLength ?? 0);
      const laps = Number(nextData.swim.lapCount ?? 0);
      const distance = Number(nextData.swim.totalDistance ?? 0);
      if (pool > 0 && laps > 0) return true;
      if (distance > 0) return true;
    }
    if (nextData.yoga) {
      const duration = Number(nextData.yoga.durationMin ?? 0);
      const style = String(nextData.yoga.style ?? "").trim();
      const focus = String(nextData.yoga.focus ?? "").trim();
      if (duration > 0 || style || focus) return true;
    }
    if (nextData.stretch) {
      const duration = Number(nextData.stretch.durationSec ?? nextData.stretch.duration ?? 0);
      if (duration > 0) return true;
    }
    if (nextData.walkRun) {
      const duration = Number(nextData.walkRun.durationMin ?? 0);
      const distance = Number(nextData.walkRun.distanceKm ?? 0);
      if (duration > 0 || distance > 0) return true;
    }
    if (Array.isArray(nextData.cardioSets) && nextData.cardioSets.length > 0) {
      return nextData.cardioSets.some(cs => {
        const dur = Number(cs?.durationSec ?? cs?.duration ?? 0);
        const dist = Number(cs?.distance ?? 0);
        const cals = Number(cs?.calories ?? 0);
        return dur > 0 || dist > 0 || cals > 0;
        
      });
    }
    const sets = Array.isArray(nextData.sets) ? nextData.sets : [];
    return sets.some(s => {
      const reps = Number(s?.reps ?? 0);
      const time = Number(s?.durationSec ?? s?.timeSec ?? 0);
      const w   = Number(s?.weight ?? s?.weightKg ?? 0);
      return reps > 0 || time > 0 || w > 0;
    });
  }

  function handleClosePopup() {
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
    } catch (e) {
      logger.error("Failed to emit or call onChange when closing popup:", e);
    }
    setOpen(false);
  }

  useEffect(() => {
    if (hydratedOnMountRef.current) return;
    const saved = loadSavedDraft(exo);
    if (saved) {
      // Ne pas restaurer le mode sauvegardé si c'est un exercice avec mode forcé
      const hasForcedMode = isSwim || isYoga || isStretch || isWalkRun;
      if (saved.mode && saved.mode !== mode && !hasForcedMode) {
        setMode(saved.mode);
      }
      const done = isExerciseDone(saved);
      const enriched = { ...saved, mode: hasForcedMode ? mode : (saved.mode || mode), done };
      if (typeof emit === "function") {
        emit(enriched);
      }
    }
    hydratedOnMountRef.current = true;
  }, [exo, isSwim, isYoga, isStretch, isWalkRun, mode, setMode, emit]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = window.innerWidth - document.documentElement.clientWidth + 'px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  // Auto-save data to storage when it changes
  useEffect(() => {
    if (!hydratedOnMountRef.current) return;
    const payload = { ...data, mode };
    const done = isExerciseDone(payload);
    const enriched = { ...payload, done };
    try {
      storage.set(storageKeyFromExo(exo), JSON.stringify(enriched));
    } catch (e) {
      logger.error("Failed to auto-save exercise data to storage:", e);
    }
  }, [data, mode, exo]);

  return (
    <>
      <div className={styles.card}>
        <button type="button" className={`${styles.row} ${isStarted ? styles.isStarted : ''}`} onClick={() => setOpen(true)}>
          <div className={styles.thumb} aria-hidden>
            {imgSrc ? <img src={imgSrc} alt="" /> : <div className={styles.initial}>{initialLetter}</div>}
          </div>
          <div className={styles.title}>
            {isStarted && <span className={styles.statusDot} aria-label="En cours" />}
            {exo?.name || "Exercice"}
          </div>
        </button>
      </div>

      {open && createPortal(
        <div
          className={`${styles.overlay} ${open ? styles.isOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!open}
          onClick={handleClosePopup}
        >
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <header className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>{exo?.name}</h3>
              <button type="button" className={styles.closeBtn} onClick={handleClosePopup} aria-label="Fermer">
                ×
              </button>
            </header>

            <div className={styles.popupBody}>
              {!isSwim && !isYoga && !isStretch && !isWalkRun && availableModes.length > 1 && (
                <ModeBar
                  mode={mode}
                  availableModes={availableModes}
                  onChange={(m) => {
                    setMode(m);
                    const next = { ...data, mode: m };
                    const enriched = { ...next, done: isExerciseDone(next) };
                    if (typeof emit === 'function') {
                      emit(enriched);
                    }
                  }}
                  classes={{ modeBar: modeStyles.modeBar, selectControl: modeStyles.selectControl }}
                />
              )}

              {!isCardio && !isSwim && !isYoga && !isStretch && !isWalkRun && <GlobalRestTimer />}

              {isSwim ? (
                <SwimForm swim={data?.swim} onPatch={patchSwim} />
              ) : isYoga ? (
                <YogaForm yoga={data?.yoga} onPatch={patchYoga} />
              ) : isStretch ? (
                <StretchForm stretch={data?.stretch} onPatch={patchStretch} />
              ) : isWalkRun ? (
                <WalkRunForm data={data} patchWalkRun={patchWalkRun} />
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
                  exerciseName={exo?.name || ''}
                />
              )}

              <NotesSection
                notes={data?.notes || ""}
                onChange={(val) => emit({ ...data, notes: val })}
                classes={{ container: notesStyles.container }}
              />
            </div>

            <footer className={styles.footer}>
              <button type="button" onClick={handleClosePopup} className={styles.saveBtn}>
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
