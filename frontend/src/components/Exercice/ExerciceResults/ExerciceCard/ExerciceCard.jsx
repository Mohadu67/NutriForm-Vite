import React, { useState, useId } from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from "./ExerciceCard.module.css";

const canon = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const idOf = (ex) => (ex?.id ?? ex?._id ?? ex?.slug ?? canon(ex?.name || ex?.title));

export default function ExerciceCard({
  exo,
  onAdd,
  isAdded = false,
  onRemove,
  isSortable = false,
}) {
  const [open, setOpen] = useState(false);
  const dialogId = useId();

  if (!exo) return null;

  const imgSrc = Array.isArray(exo.images) && exo.images.length > 0 ? exo.images[0] : null;
  const initial = exo.name?.trim()?.[0]?.toUpperCase() || "?";
  const exId = idOf(exo);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = isSortable ? useSortable({ id: exId }) : {
    attributes: {},
    listeners: {},
    setNodeRef: null,
    transform: null,
    transition: null,
    isDragging: false
  };

  const style = isSortable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : {};

  return (
    <>
      <div
        ref={isSortable ? setNodeRef : null}
        style={style}
        role="button"
        tabIndex={0}
        className={`${styles.row} ${isDragging ? styles.isDragging : ""} ${isSortable ? styles.sortable : styles.proposed}`}
        data-ex-id={exId}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
        }}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
      >
        {isSortable && (
          <div
            className={styles.handle}
            {...attributes}
            {...listeners}
            title="Glisser pour réordonner"
            aria-label="Glisser pour réordonner"
          >
            <div className={styles.grip} aria-hidden>
              <div /><div />
              <div /><div />
              <div /><div />
            </div>
          </div>
        )}

        <div className={styles.thumb} aria-hidden>
          {imgSrc ? (
            <img src={imgSrc} alt="" />
          ) : (
            <div className={styles.initial}>{initial}</div>
          )}
        </div>

        <div className={styles.rowTitle}>{exo.name}</div>

        {isSortable && onRemove && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={(e) => { e.stopPropagation(); onRemove(exId); }}
            aria-label="Supprimer cet exercice"
            title="Supprimer"
          >
            ✕
          </button>
        )}

        {!isSortable && onAdd && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            aria-label="Ajouter cet exercice"
            title="Ajouter"
          >
            +
          </button>
        )}

        {!isSortable && onRemove && (
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={(e) => { e.stopPropagation(); onRemove(exId); }}
            aria-label="Masquer cet exercice"
            title="Masquer"
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
                  <strong >Type</strong>
                  <div >{(exo.type || []).join(", ") || "—"}</div>
                </div>
                <div>
                  <strong>Objectifs</strong>
                  <div >{(exo.objectives || []).join(", ") || "—"}</div>
                </div>
                <div>
                  <strong>Muscles</strong>
                  <div >{(exo.muscles || []).join(", ") || "—"}</div>
                </div>
                <div>
                  <strong>Équipement</strong>
                  <div >{(exo.equipment || []).join(", ") || "—"}</div>
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
