

import React, { memo } from "react";
import styles from "./Tables.module.css";

function CardioTable({ cardioSets = [], onAdd, onRemove, onPatch }) {
  return (
    <div className={styles.table}>
      <div className={styles.rowHead}>
        <div>Série</div>
        <div>Durée (min)</div>
        <div>Durée (sec)</div>
        <div>Intensité (1–10)</div>
        <div></div>
      </div>

      {cardioSets.map((s, idx) => (
        <div key={idx} className={styles.rowSet}>
          <div>{idx + 1}</div>
          <div>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={s?.durationMin ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) {
                  onPatch && onPatch(idx, { durationMin: val === "" ? "" : Number(val) });
                }
              }}
              aria-label={`Durée minutes série ${idx + 1}`}
            />
          </div>
          <div>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="59"
              value={s?.durationSec ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (Number(val) >= 0 && Number(val) <= 59)) {
                  onPatch && onPatch(idx, { durationSec: val === "" ? "" : Number(val) });
                }
              }}
              aria-label={`Durée secondes série ${idx + 1}`}
            />
          </div>
          <div>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="10"
              value={s?.intensity ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (Number(val) >= 1 && Number(val) <= 10)) {
                  onPatch && onPatch(idx, { intensity: val === "" ? "" : Number(val) });
                }
              }}
              aria-label={`Intensité série ${idx + 1}`}
            />
          </div>
          <div>
            <button type="button" className={styles.iconBtn} aria-label={`Supprimer la série ${idx + 1}`} onClick={() => onRemove && onRemove(idx)}>
              ×
            </button>
          </div>
        </div>
      ))}

      <div className={styles.actions}>
        <button type="button" onClick={onAdd}>+ Ajouter une série</button>
      </div>
    </div>
  );
}

export default memo(CardioTable);