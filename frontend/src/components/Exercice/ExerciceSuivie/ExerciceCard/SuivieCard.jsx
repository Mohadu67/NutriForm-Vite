// Helpers for localStorage persistence of exercise form state
const STORAGE_NS = "suivie_exo_inputs:";
function storageKey(exo) {
  const id = (exo && (exo.id || exo._id || exo.slug || exo.name)) ? String(exo.id || exo._id || exo.slug || exo.name) : "unknown";
  return `${STORAGE_NS}${id}`;
}
function loadSaved(exo) {
  try {
    const raw = localStorage.getItem(storageKey(exo));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveSaved(exo, data) {
  try {
    localStorage.setItem(storageKey(exo), JSON.stringify(data || null));
  } catch {}
}
function clearSaved(exo) {
  try { localStorage.removeItem(storageKey(exo)); } catch {}
}
import React, { useState, useEffect } from "react";
import styles from "./SuivieCard.module.css";

import useExerciceForm from "./hooks/useExerciceForm";

import ModeBar from "./ModeBar/ModeBar";
import modeStyles from "./ModeBar/ModeBar.module.css";

import CardioTable from "./Tables/CardioTable";
import MuscuTable from "./Tables/MuscuTable";
import PdcTable from "./Tables/PdcTable";

import NotesSection from "./Notes/NotesSection";
import notesStyles from "./Notes/NotesSaction.module.css";

import { idOf } from "../../Shared/idOf.js";

export default function SuivieCard({ exo, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Prefer prop "value" when provided; otherwise fall back to saved draft
  const savedDraft = loadSaved(exo);
  const hydratedValue = value != null ? value : savedDraft;

  const {
    mode,
    setMode,
    data,
    emit,
    isCardio,
    isPdc,
    isMuscu,
    addSet,
    removeSet,
    patchSet,
    addCardioSet,
    removeCardioSet,
    patchCardioSet,
  } = useExerciceForm(exo, hydratedValue, (key, next) => {
    // persist every change locally
    saveSaved(exo, next);
    if (typeof onChange === 'function') onChange(key, next);
  });

  // Ensure we keep the previously chosen mode (cardio/muscu/pdc) from saved draft
  useEffect(() => {
    if (hydratedValue && hydratedValue.mode && hydratedValue.mode !== mode) {
      setMode(hydratedValue.mode);
    }
    // only run when saved mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydratedValue?.mode]);


  const sets = Array.isArray(data?.sets) ? data.sets : [];
  const cardioSets = Array.isArray(data?.cardioSets) ? data.cardioSets : [];

  const imgSrc = Array.isArray(exo?.images) && exo.images.length ? exo.images[0] : null;
  const initialLetter = exo?.name?.trim()?.[0]?.toUpperCase() || "?";

  function isExerciseDone(nextData) {
    if (!nextData) return false;
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
      // persist final state locally
      saveSaved(exo, next);
      if (typeof emit === 'function') {
        emit(next); // will call onChange via wrapper
      }
    } catch {}
    setOpen(false);
  }

  return (
    <div className={styles.card}>
      <button type="button" className={styles.row} onClick={() => setOpen(true)}>
        <div className={styles.thumb} aria-hidden>
          {imgSrc ? <img src={imgSrc} alt="" /> : <div className={styles.initial}>{initialLetter}</div>}
        </div>
        <div className={styles.title}>{exo?.name || "Exercice"}</div>
      </button>

      {open && (
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
              <ModeBar
                mode={mode}
                onChange={(m) => {
                  setMode(m);
                  const next = { ...data, mode: m };
                  // persist the chosen mode immediately
                  saveSaved(exo, next);
                  // propagate to parent value as well
                  if (typeof emit === 'function') emit(next);
                }}
                classes={{ modeBar: modeStyles.modeBar, selectControl: modeStyles.selectControl }}
              />

              {isCardio ? (
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
        </div>
      )}
    </div>
  );
}
