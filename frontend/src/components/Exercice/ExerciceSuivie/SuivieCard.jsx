import React, { useMemo, useState, useEffect, memo } from "react";
import styles from "./SuivieCard.module.css";
import LabelField from "../../LabelField/LabelField.jsx";
import { saveSession, buildSessionFromEntry } from "./sessionApi";

/** Utils */
const isCardioExo = (exo) => {
  const cat = String(exo?.category ?? exo?.type ?? "").toLowerCase();
  if (["cardio", "endurance"].includes(cat)) return true;
  if (["muscu", "musculation", "renforcement", "force"].includes(cat)) return false;
  const name = String(exo?.name ?? "").toLowerCase();
  if (/(rameur|rower|rowing|tapis|course|elliptique|vélo|velo|bike|cycling|airdyne|skierg)/.test(name)) return true;
  return false;
};

/** Small view components */
const ModeBar = memo(function ModeBar({ mode, onChange }) {
  return (
    <div className={styles.modeBar}>
      <div className={styles.selectControl}>
        <label>Type d'exercice</label>
        <select value={mode} onChange={(e) => onChange(e.target.value)}>
          <option value="muscu">Muscu</option>
          <option value="cardio">Cardio</option>
          <option value="pdc">Poids du corps</option>
        </select>
      </div>
    </div>
  );
});

const MuscuPdcTable = memo(function MuscuPdcTable({
  isMuscu,
  sets,
  onAdd,
  onRemove,
  onPatch,
}) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.table}>
        <div className={styles.rowHead}>
          <div>Série</div>
          {isMuscu && <div>RM (kg)</div>}
          {isMuscu && <div>Poids (kg)</div>}
          <div>Reps</div>
          {isMuscu && <div>Temps (sec)</div>}
          <div>Repos (s)</div>
          <div></div>
        </div>
        {sets.map((s, idx) => (
          <div key={idx} className={styles.rowSet}>
            <div>{idx + 1}</div>
            {isMuscu && (
              <div>
                <input
                  type="number"
                  value={s.rm ?? 0}
                  onChange={(e) => onPatch(idx, { rm: Number(e.target.value) })}
                />
              </div>
            )}
            {isMuscu && (
              <div>
                <input
                  type="number"
                  value={s.weight ?? 0}
                  onChange={(e) => onPatch(idx, { weight: Number(e.target.value) })}
                />
              </div>
            )}
            <div>
              <input
                type="number"
                value={s.reps ?? 0}
                onChange={(e) => onPatch(idx, { reps: Number(e.target.value) })}
              />
            </div>
            {isMuscu && (
              <div>
                <input
                  type="number"
                  value={s.timeSec ?? 0}
                  onChange={(e) => onPatch(idx, { timeSec: Number(e.target.value) })}
                />
              </div>
            )}
            <div>
              <input
                type="number"
                value={s.restSec ?? 0}
                onChange={(e) => onPatch(idx, { restSec: Number(e.target.value) })}
              />
            </div>
            <div>
              <button type="button" className={styles.iconBtn} onClick={() => onRemove(idx)}>
                ×
              </button>
            </div>
          </div>
        ))}
        <div className={styles.actions}>
          <button type="button" onClick={onAdd}>+ Ajouter une série</button>
        </div>
      </div>
    </div>
  );
});

const CardioTable = memo(function CardioTable({ cardioSets, onAdd, onRemove, onPatch }) {
  return (
    <div className={styles.cardioBlock}>
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
                min="0"
                value={s.durationMin ?? 0}
                onChange={(e) => onPatch(idx, { durationMin: Number(e.target.value) })}
              />
            </div>
            <div>
              <input
                type="number"
                min="0"
                max="59"
                value={s.durationSec ?? 0}
                onChange={(e) => onPatch(idx, { durationSec: Math.min(59, Math.max(0, Number(e.target.value))) })}
              />
            </div>
            <div>
              <input
                type="number"
                min="1"
                max="10"
                value={s.intensity ?? 5}
                onChange={(e) => onPatch(idx, { intensity: Math.min(10, Math.max(1, Number(e.target.value))) })}
              />
            </div>
            <div>
              <button type="button" className={styles.iconBtn} onClick={() => onRemove(idx)}>
                ×
              </button>
            </div>
          </div>
        ))}
        <div className={styles.actions}>
          <button type="button" onClick={onAdd}>+ Ajouter une série</button>
        </div>
      </div>
    </div>
  );
});

const NotesSection = memo(function NotesSection({ notes, onChange }) {
  return (
    <div className={styles.notes}>
      <LabelField label="Commentaire">
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex: prise neutre, dos gainé, dernière série difficile…"
        />
      </LabelField>
    </div>
  );
});

/** Main component */
export default function SuivieCard({ exo, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const detected = isCardioExo(exo) ? "cardio" : "muscu";
  const [modeOverride, setModeOverride] = useState(detected); // 'muscu' | 'cardio' | 'pdc'

  const isCardio = modeOverride === "cardio";
  const isPdc = modeOverride === "pdc";
  const isMuscu = modeOverride === "muscu";

  const initial = useMemo(() => {
    const base = value || {};
    if (modeOverride === "cardio") {
      const fromSingle = base.cardio
        ? [
            {
              durationMin: Number(base.cardio.durationMin || 0),
              durationSec: Number(base.cardio.durationSec || 0),
              intensity: Number(base.cardio.intensity || 5),
            },
          ]
        : [];
      return {
        cardioSets:
          Array.isArray(base.cardioSets) && base.cardioSets.length
            ? base.cardioSets
            : fromSingle.length
            ? fromSingle
            : [{ durationMin: 0, durationSec: 0, intensity: 5 }],
        notes: base.notes || "",
      };
    }
    if (modeOverride === "pdc") {
      return {
        sets: base.sets || [{ reps: 0, restSec: 0 }],
        notes: base.notes || "",
      };
    }
    // muscu
    return {
      sets: base.sets || [{ rm: 0, weight: 0, reps: 0, timeSec: 0, restSec: 0 }],
      notes: base.notes || "",
    };
  }, [value, modeOverride]);

  const [data, setData] = useState(initial);
  const sets = Array.isArray(data?.sets) ? data.sets : [];
  const cardioSets = Array.isArray(data?.cardioSets) ? data.cardioSets : [];

  // Initialize arrays when switching modes
  useEffect(() => {
    if (isCardio) return;
    if (!Array.isArray(data.sets)) {
      const s = isPdc ? { reps: 0, restSec: 0 } : { rm: 0, weight: 0, reps: 0, timeSec: 0, restSec: 0 };
      setData((prev) => ({ ...prev, sets: [s] }));
    }
  }, [isCardio, isPdc]);

  useEffect(() => {
    if (!isCardio) return;
    if (!Array.isArray(data.cardioSets)) {
      setData((prev) => ({ ...prev, cardioSets: [{ durationMin: 0, durationSec: 0, intensity: 5 }] }));
    }
  }, [isCardio]);

  const imgSrc = Array.isArray(exo?.images) && exo.images.length ? exo.images[0] : null;
  const initialLetter = exo?.name?.trim()?.[0]?.toUpperCase() || "?";

  function emit(next) {
    setData(next);
    if (typeof onChange === "function") onChange(exo?.id || exo?.name, next);
  }

  // handlers
  const updateSet = (idx, patch) => emit({ ...data, sets: sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  const addSet = () => {
    if (isCardio) return addCardioSet();
    const s = isPdc ? { reps: 0, restSec: 0 } : { rm: 0, weight: 0, reps: 0, timeSec: 0, restSec: 0 };
    emit({ ...data, sets: [...sets, s] });
  };
  const removeSet = (idx) => emit({ ...data, sets: sets.filter((_, i) => i !== idx) });

  const updateCardioSet = (idx, patch) => emit({ ...data, cardioSets: cardioSets.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  const addCardioSet = () => emit({ ...data, cardioSets: [...cardioSets, { durationMin: 0, durationSec: 0, intensity: 5 }] });
  const removeCardioSet = (idx) => emit({ ...data, cardioSets: cardioSets.filter((_, i) => i !== idx) });

  async function handleSave() {
    try {
      setSaving(true);

      const entry = {
        exerciseName: exo?.name || "Exercice",
        type: isCardio ? "cardio" : isPdc ? "poids_du_corps" : "muscu",
        order: 1,
        notes: data?.notes || "",
        sets: [],
      };

      if (isCardio) {
        entry.sets = (Array.isArray(cardioSets) ? cardioSets : []).map((s, i) => ({
          setNumber: i + 1,
          durationMin: Number(s.durationMin || 0),
          durationSec: Number(s.durationSec || 0),
          intensity: Number(s.intensity || 5),
        }));
      } else if (isPdc) {
        entry.sets = (Array.isArray(sets) ? sets : []).map((s, i) => ({
          setNumber: i + 1,
          reps: Number(s.reps || 0),
          restSec: Number(s.restSec || 0),
        }));
      } else {
        entry.sets = (Array.isArray(sets) ? sets : []).map((s, i) => ({
          setNumber: i + 1,
          rm: Number(s.rm || 0),
          weightKg: Number(s.weight ?? 0),
          reps: Number(s.reps || 0),
          timeSec: Number(s.timeSec || 0),
          restSec: Number(s.restSec || 0),
        }));
      }

      if (!entry.sets.length) {
        alert("Ajoute au moins une série avant d'enregistrer.");
        setSaving(false);
        return;
      }

      const payload = buildSessionFromEntry(entry, { name: `Séance – ${new Date().toLocaleDateString()}` });
      await saveSession(payload);

      setToast("Exercice enregistré ✅");
      setOpen(false);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.error(e);
      alert("Échec de l'enregistrement ❌");
    } finally {
      setSaving(false);
    }
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
        <div className={styles.overlay} role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <header className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>{exo?.name}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Fermer">
                ×
              </button>
            </header>

            <div className={styles.popupBody}>
              <ModeBar mode={modeOverride} onChange={setModeOverride} />

              {!isCardio ? (
                <MuscuPdcTable
                  isMuscu={isMuscu}
                  sets={sets}
                  onAdd={addSet}
                  onRemove={removeSet}
                  onPatch={updateSet}
                />
              ) : (
                <CardioTable
                  cardioSets={cardioSets}
                  onAdd={addCardioSet}
                  onRemove={removeCardioSet}
                  onPatch={updateCardioSet}
                />
              )}

              <NotesSection
                notes={data?.notes || ""}
                onChange={(val) => emit({ ...data, notes: val })}
              />
            </div>

            <footer className={styles.footer}>
              <button type="button" onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                {saving ? "Enregistrement…" : "Enregistrer exo"}
              </button>
            </footer>
          </div>
        </div>
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
