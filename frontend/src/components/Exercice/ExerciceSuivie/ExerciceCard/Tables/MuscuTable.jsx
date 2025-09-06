

import React, { memo } from "react";
import styles from "./Tables.module.css";

function MuscuTable({ sets = [], onAdd, onRemove, onPatch }) {
  return (
    <div className={styles.table}>
      <div className={styles.rowHead}>
        <div>Série</div>
        <div>Poids (kg)</div>
        <div>Reps</div>
        <div>Repos (s)</div>
        <div></div>
      </div>

      {sets.map((s, idx) => (
        <div key={idx} className={styles.rowSet}>
          <div>{idx + 1}</div>
          <div>
            <input
              type="number"
              inputMode="decimal"
              value={s?.weight ?? ""}
              onChange={(e) => onPatch && onPatch(idx, { weight: e.target.value === "" ? "" : Number(e.target.value) })}
              aria-label={`Poids kg série ${idx + 1}`}
            />
          </div>
          <div>
            <input
              type="number"
              inputMode="numeric"
              value={s?.reps ?? ""}
              onChange={(e) => onPatch && onPatch(idx, { reps: e.target.value === "" ? "" : Number(e.target.value) })}
              aria-label={`Répétitions série ${idx + 1}`}
            />
          </div>
          <div>
            <input
              type="number"
              inputMode="numeric"
              value={s?.restSec ?? ""}
              onChange={(e) => onPatch && onPatch(idx, { restSec: e.target.value === "" ? "" : Number(e.target.value) })}
              aria-label={`Repos en secondes série ${idx + 1}`}
            />
          </div>
          <div>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={`Supprimer la série ${idx + 1}`}
              onClick={() => onRemove && onRemove(idx)}
            >
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

export default memo(MuscuTable);