import React, { useState } from "react";
import styles from "./SuivieCard.module.css";

import useExerciceForm from "./hooks/useExerciceForm";

import ModeBar from "./ModeBar/ModeBar";
import modeStyles from "./ModeBar/ModeBar.module.css";

import CardioTable from "./Tables/CardioTable";
import MuscuTable from "./Tables/MuscuTable";
import PdcTable from "./Tables/PdcTable";

import NotesSection from "./Notes/NotesSection";
import notesStyles from "./Notes/NotesSaction.module.css";

export default function SuivieCard({ exo, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

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
  } = useExerciceForm(exo, value, onChange);


  const sets = Array.isArray(data?.sets) ? data.sets : [];
  const cardioSets = Array.isArray(data?.cardioSets) ? data.cardioSets : [];

  const imgSrc = Array.isArray(exo?.images) && exo.images.length ? exo.images[0] : null;
  const initialLetter = exo?.name?.trim()?.[0]?.toUpperCase() || "?";

  function handleClosePopup() {
    try {
      if (typeof emit === 'function') {
        emit(data);
      } else if (typeof onChange === 'function') {
        const id = exo?.id ?? exo?._id ?? exo?.name;
        onChange(id, data);
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
          onClick={() => setOpen(false)}
        >
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <header className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>{exo?.name}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Fermer">
                ×
              </button>
            </header>

            <div className={styles.popupBody}>
              <ModeBar
                mode={mode}
                onChange={setMode}
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
