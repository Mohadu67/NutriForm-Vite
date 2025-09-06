import React, { useState, useId } from "react";
import styles from "./ExerciceCard.module.css";

export default function ExerciceCard({ exo, onAdd, isAdded = false, draggable = false, onDragStart, onDragOver, onDrop, onRemove }) {
  const [open, setOpen] = useState(false);
  const dialogId = useId();

  if (!exo) return null;

  const imgSrc = Array.isArray(exo.images) && exo.images.length > 0 ? exo.images[0] : null;
  const initial = exo.name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={styles.row}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
      >
        <div
          className={styles.handle}
          draggable={draggable}
          onDragStart={(e) => { e.stopPropagation(); onDragStart && onDragStart(e, exo); }}
          onDragOver={(e) => { if (!draggable) return; e.preventDefault(); e.stopPropagation(); onDragOver && onDragOver(e, exo); }}
          onDrop={(e) => { if (!draggable) return; e.preventDefault(); e.stopPropagation(); onDrop && onDrop(e, exo); }}
          title="Glisser pour réordonner"
          aria-label="Glisser pour réordonner"
        >
          <div className={styles.grip} aria-hidden>
            <div /><div />
            <div /><div />
            <div /><div />
          </div>
          <div className={styles.thumb} aria-hidden>
            {imgSrc ? (
              <img src={imgSrc} alt="" />
            ) : (
              <div className={styles.initial}>{initial}</div>
            )}
          </div>
        </div>

        <div className={styles.rowTitle}>{exo.name}</div>

        {onRemove && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={(e) => { e.stopPropagation(); onRemove(exo); }}
            aria-label="Supprimer cet exercice"
            title="Supprimer"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div
          className={`${styles.overlay} ${open ? styles.isOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!open}
          id={dialogId}
          onClick={() => setOpen(false)}
        >
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
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
                  <p>{exo.explanation || "Ici explication sur l'exo"}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}