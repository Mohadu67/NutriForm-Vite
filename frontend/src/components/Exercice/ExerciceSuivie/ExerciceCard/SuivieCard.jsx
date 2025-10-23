import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./SuivieCard.module.css";

import useExerciceForm from "./hooks/useExerciceForm";

import ModeBar from "./ModeBar/ModeBar";
import modeStyles from "./ModeBar/ModeBar.module.css";

import GlobalRestTimer from "./GlobalRestTimer/GlobalRestTimer";

import CardioTable from "./Tables/CardioTable";
import MuscuTable from "./Tables/MuscuTable";
import PdcTable from "./Tables/PdcTable";
import SwimForm from "./SwimForm";
import YogaForm from "./YogaForm";
import StretchForm from "./StretchForm";

import NotesSection from "./Notes/NotesSection";
import notesStyles from "./Notes/NotesSaction.module.css";

import { idOf } from "../../Shared/idOf.js";

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

export default function SuivieCard({ exo, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const hydratedOnMountRef = useRef(false);

  const {
    mode,
    setMode,
    data,
    emit,
    isCardio,
    isPdc,
    isMuscu,
    isSwim,
    isYoga,
    isStretch,
    addSet,
    removeSet,
    patchSet,
    addCardioSet,
    removeCardioSet,
    patchCardioSet,
    patchSwim,
    patchYoga,
    patchStretch,
  } = useExerciceForm(exo, value, onChange);


  const sets = Array.isArray(data?.sets) ? data.sets : [];
  const cardioSets = Array.isArray(data?.cardioSets) ? data.cardioSets : [];

  const imgSrc = Array.isArray(exo?.images) && exo.images.length ? exo.images[0] : null;
  const initialLetter = exo?.name?.trim()?.[0]?.toUpperCase() || "?";

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
    } catch {}
    setOpen(false);
  }

  useEffect(() => {
    if (hydratedOnMountRef.current) return;
    const saved = loadSavedDraft(exo);
    if (saved) {
      if (saved.mode && saved.mode !== mode) {
        setMode(saved.mode);
      }
      const done = isExerciseDone(saved);
      const enriched = { ...saved, mode: saved.mode || mode, done };
      if (typeof emit === "function") {
        emit(enriched);
      }
    }
    hydratedOnMountRef.current = true;
  }, []);

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

  return (
    <>
      <div className={styles.card}>
        <button type="button" className={styles.row} onClick={() => setOpen(true)}>
          <div className={styles.thumb} aria-hidden>
            {imgSrc ? <img src={imgSrc} alt="" /> : <div className={styles.initial}>{initialLetter}</div>}
          </div>
          <div className={styles.title}>{exo?.name || "Exercice"}</div>
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
              {!isSwim && !isYoga && !isStretch && (
                <ModeBar
                  mode={mode}
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

              {!isCardio && !isSwim && !isYoga && !isStretch && <GlobalRestTimer />}

              {isSwim ? (
                <SwimForm swim={data?.swim} onPatch={patchSwim} />
              ) : isYoga ? (
                <YogaForm yoga={data?.yoga} onPatch={patchYoga} />
              ) : isStretch ? (
                <StretchForm stretch={data?.stretch} onPatch={patchStretch} />
              ) : isCardio ? (
                <CardioTable
                  cardioSets={cardioSets}
                  onAdd={addCardioSet}
                  onRemove={removeCardioSet}
                  onPatch={patchCardioSet}
                />
              ) : isPdc ? (
                <PdcTable
                  sets={sets}
                  onAdd={addSet}
                  onRemove={removeSet}
                  onPatch={patchSet}
                />
              ) : (
                <MuscuTable
                  sets={sets}
                  onAdd={addSet}
                  onRemove={removeSet}
                  onPatch={patchSet}
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
