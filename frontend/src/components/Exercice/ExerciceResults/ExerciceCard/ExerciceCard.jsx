import React, { useState, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from "./ExerciceCard.module.css";
import { idOf } from "../../Shared/idOf.js";

export default function ExerciceCard({
  exo,
  onAdd,
  onRemove,
  isSortable = false,
}) {
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const overlayRef = useRef(null);

  if (!exo) return null;

  const imgSrc = Array.isArray(exo.images) && exo.images.length > 0 ? exo.images[0] : null;
  const initial = exo.name?.trim()?.[0]?.toUpperCase() || "?";
  const exId = idOf(exo);

  const sortable = useSortable({ id: exId });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = isSortable ? sortable : {
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

  // Gestion de la fermeture de la popup
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (overlayRef.current === e.target) {
        setOpen(false);
      }
    };

    // Bloquer le scroll du body
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);

  const handleClose = (e) => {
    e?.stopPropagation();
    setOpen(false);
  };

  return (
    <>
      <div
        ref={isSortable ? setNodeRef : null}
        style={style}
        className={`${styles.row} ${isDragging ? styles.isDragging : ""} ${isSortable ? styles.sortable : styles.proposed}`}
        data-ex-id={exId}
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

        <button
          type="button"
          className={styles.contentBtn}
          onClick={() => setOpen(true)}
        >
          <div className={styles.thumb} aria-hidden>
            {imgSrc ? (
              <img src={imgSrc} alt="" />
            ) : (
              <div className={styles.initial}>{initial}</div>
            )}
          </div>

          <div className={styles.rowTitle}>
            {exo.name}
          </div>
        </button>

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

      {open && createPortal(
        <div
          ref={overlayRef}
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-title`}
          id={dialogId}
        >
          <div className={styles.popup}>
            <header className={styles.popupHeader}>
              <h3 id={`${dialogId}-title`} className={styles.popupTitle}>
                {exo.name}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClose}
                aria-label="Fermer"
              >
                ×
              </button>
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
                  <div>{Array.isArray(exo.type) ? exo.type.join(", ") : (exo.type || "—")}</div>
                </div>
                <div>
                  <strong>Objectifs</strong>
                  <div>{Array.isArray(exo.objectives) ? exo.objectives.join(", ") : (exo.objectives || "—")}</div>
                </div>
                <div>
                  <strong>Muscles</strong>
                  <div>{Array.isArray(exo.muscles) ? exo.muscles.join(", ") : (exo.muscles || "—")}</div>
                </div>
                <div>
                  <strong>Équipement</strong>
                  <div>{Array.isArray(exo.equipment) ? exo.equipment.join(", ") : (exo.equipment || "—")}</div>
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
        </div>,
        document.body
      )}
    </>
  );
}
