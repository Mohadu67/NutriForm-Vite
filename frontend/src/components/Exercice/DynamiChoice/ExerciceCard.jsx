

import React, { useState, useId } from "react";
import styles from "./ExerciceCard.module.css";

export default function ExerciceCard({ exo }) {
  const [open, setOpen] = useState(false);
  const dialogId = useId();

  if (!exo) return null;

  const imgSrc = Array.isArray(exo.images) && exo.images.length > 0 ? exo.images[0] : null;
  const initial = exo.name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <>
      <button
        type="button"
        className={styles.row}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
      >
        <div className={styles.thumb} aria-hidden>
          {imgSrc ? (
            <img src={imgSrc} alt="" />
          ) : (
            <div className={styles.initial}>{initial}</div>
          )}
        </div>
        <div className={styles.rowTitle}>{exo.name}</div>
      </button>

      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true" id={dialogId}>
          <div className={styles.popup}>
            <header className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>{exo.name}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            </header>

            <div className={styles.popupBody}>
              <div className={styles.hero}>
                {imgSrc ? (
                  <img src={imgSrc} alt={exo.name} />
                ) : (
                  <div className={styles.heroInitial}>{initial}</div>
                )}
              </div>

              <div className={styles.metaGrid}>
                <div>
                  <strong>Type</strong>
                  <div>{(exo.type || []).join(", ") || "—"}</div>
                </div>
                <div>
                  <strong>Objectifs</strong>
                  <div>{(exo.objectives || []).join(", ") || "—"}</div>
                </div>
                <div>
                  <strong>Muscles</strong>
                  <div>{(exo.muscles || []).join(", ") || "—"}</div>
                </div>
                <div>
                  <strong>Équipement</strong>
                  <div>{(exo.equipment || []).join(", ") || "—"}</div>
                </div>
              </div>

              {exo.explanation !== undefined && (
                <div className={styles.explain}>
                  <strong>Résumé</strong>
                  <p>{exo.explanation || ""}</p>
                </div>
              )}
            </div>

            <div className={styles.popupDiv}>

              <button type="button" className={styles.primary} onClick={() => setOpen(false)}>Ajouter à la séance</button>
              <button type="button" className={styles.secondary} onClick={() => setOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}