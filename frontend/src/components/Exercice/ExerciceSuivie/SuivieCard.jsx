import React, { useMemo, useState, useEffect } from "react";
import styles from "./SuivieCard.module.css";
import LabelField from "../../LabelField/LabelField.jsx";
import { saveSession, buildSessionFromEntry } from "./sessionApi";

const isCardioExo = (exo) => {
  // 1) Source de vérité: champs explicites
  const cat = String(exo?.category ?? exo?.type ?? "").toLowerCase();
  if (["cardio", "endurance"].includes(cat)) return true;
  if (["muscu", "musculation", "renforcement", "force"].includes(cat)) return false;

  // 2) Heuristique sur le NOM uniquement (pas les tags) pour éviter les faux positifs
  const name = String(exo?.name ?? "").toLowerCase();
  if (/(rameur|rower|rowing|tapis|course|elliptique|vélo|velo|bike|cycling|airdyne|skierg)/.test(name)) return true;

  // 3) Par défaut: pas cardio
  return false;
};

export default function SuivieCard({ exo, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Choix de type contrôlé par l'utilisateur (ouverture auto selon détection)
  const detected = isCardioExo(exo) ? 'cardio' : 'muscu';
  const [modeOverride, setModeOverride] = useState(detected); // 'muscu' | 'cardio' | 'pdc'

  const isCardio = modeOverride === 'cardio';
  const isPdc = modeOverride === 'pdc';
  const isMuscu = modeOverride === 'muscu';

  const initial = useMemo(() => {
    const base = value || {};
    if (modeOverride === 'cardio') {
      // Build cardioSets from base if provided, else default to one row
      const fromSingle = base.cardio ? [{
        durationMin: Number(base.cardio.durationMin || 0),
        durationSec: Number(base.cardio.durationSec || 0),
        intensity: Number(base.cardio.intensity || 5)
      }] : [];
      return {
        cardioSets: Array.isArray(base.cardioSets) && base.cardioSets.length ? base.cardioSets : (fromSingle.length ? fromSingle : [{ durationMin: 0, durationSec: 0, intensity: 5 }]),
        notes: base.notes || "",
      };
    }
    if (modeOverride === 'pdc') {
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

  useEffect(() => {
    if (isCardio) return; // cardio n'utilise pas sets
    if (!Array.isArray(data.sets)) {
      const s = isPdc
        ? { reps: 0, restSec: 0 }
        : { rm: 0, weight: 0, reps: 0, timeSec: 0, restSec: 0 };
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

  function updateSet(idx, patch) {
    const next = { ...data, sets: sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)) };
    emit(next);
  }

  function addSet() {
    if (isCardio) {
      addCardioSet();
      return;
    }
    const s = isPdc
      ? { reps: 0, restSec: 0 }
      : { rm: 0, weight: 0, reps: 0, timeSec: 0, restSec: 0 };
    const next = { ...data, sets: [...sets, s] };
    emit(next);
  }

  function removeSet(idx) {
    const next = { ...data, sets: sets.filter((_, i) => i !== idx) };
    emit(next);
  }

  function updateCardio(patch) {
    const next = { ...data, cardio: { ...(data.cardio || { durationMin: 0, durationSec: 0, intensity: 5 }), ...patch } };
    emit(next);
  }

  function updateCardioSet(idx, patch) {
    const next = { ...data, cardioSets: cardioSets.map((s, i) => (i === idx ? { ...s, ...patch } : s)) };
    emit(next);
  }
  function addCardioSet() {
    const next = { ...data, cardioSets: [...cardioSets, { durationMin: 0, durationSec: 0, intensity: 5 }] };
    emit(next);
  }
  function removeCardioSet(idx) {
    const next = { ...data, cardioSets: cardioSets.filter((_, i) => i !== idx) };
    emit(next);
  }

  async function handleSave() {
    try {
      setSaving(true);

      const entry = {
        exerciseName: exo?.name || 'Exercice',
        type: isCardio ? 'cardio' : (isPdc ? 'poids_du_corps' : 'muscu'),
        order: 1,
        notes: data?.notes || '',
        sets: []
      };

      if (isCardio) {
        entry.sets = (Array.isArray(cardioSets) ? cardioSets : []).map((s, i) => ({
          setNumber: i + 1,
          durationMin: Number(s.durationMin || 0),
          durationSec: Number(s.durationSec || 0),
          intensity: Number(s.intensity || 5)
        }));
      } else if (isPdc) {
        entry.sets = (Array.isArray(sets) ? sets : []).map((s, i) => ({
          setNumber: i + 1,
          reps: Number(s.reps || 0),
          restSec: Number(s.restSec || 0)
        }));
      } else {
        // muscu
        entry.sets = (Array.isArray(sets) ? sets : []).map((s, i) => ({
          setNumber: i + 1,
          rm: Number(s.rm || 0),
          weightKg: Number((s.weight ?? 0)),
          reps: Number(s.reps || 0),
          timeSec: Number(s.timeSec || 0),
          restSec: Number(s.restSec || 0)
        }));
      }

      if (!entry.sets.length) {
        alert("Ajoute au moins une série avant d'enregistrer.");
        setSaving(false);
        return;
      }

      const payload = buildSessionFromEntry(entry, { name: `Séance – ${new Date().toLocaleDateString()}` });
      await saveSession(payload);

      setToast('Exercice enregistré ✅');
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
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            </header>

            <div className={styles.popupBody}>
              <div className={styles.modeBar}>
                <div className={styles.selectControl}>
                  <label>Type d'exercice</label>
                  <select value={modeOverride} onChange={(e) => setModeOverride(e.target.value)}>
                    <option value="muscu">Muscu</option>
                    <option value="cardio">Cardio</option>
                    <option value="pdc">Poids du corps</option>
                  </select>
                </div>
              </div>
              {!isCardio ? (
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
                            <input type="number" value={s.rm ?? 0} onChange={(e) => updateSet(idx, { rm: Number(e.target.value) })} />
                          </div>
                        )}
                        {isMuscu && (
                          <div>
                            <input type="number" value={s.weight ?? 0} onChange={(e) => updateSet(idx, { weight: Number(e.target.value) })} />
                          </div>
                        )}
                        <div>
                          <input type="number" value={s.reps ?? 0} onChange={(e) => updateSet(idx, { reps: Number(e.target.value) })} />
                        </div>
                        {isMuscu && (
                          <div>
                            <input type="number" value={s.timeSec ?? 0} onChange={(e) => updateSet(idx, { timeSec: Number(e.target.value) })} />
                          </div>
                        )}
                        <div>
                          <input type="number" value={s.restSec ?? 0} onChange={(e) => updateSet(idx, { restSec: Number(e.target.value) })} />
                        </div>
                        <div>
                          <button type="button" className={styles.iconBtn} onClick={() => removeSet(idx)}>×</button>
                        </div>
                      </div>
                    ))}
                    <div className={styles.actions}><button type="button" onClick={addSet}>+ Ajouter une série</button></div>
                  </div>
                </div>
              ) : (
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
                          <input type="number" min="0" value={s.durationMin ?? 0} onChange={(e) => updateCardioSet(idx, { durationMin: Number(e.target.value) })} />
                        </div>
                        <div>
                          <input type="number" min="0" max="59" value={s.durationSec ?? 0} onChange={(e) => updateCardioSet(idx, { durationSec: Math.min(59, Math.max(0, Number(e.target.value))) })} />
                        </div>
                        <div>
                          <input type="number" min="1" max="10" value={s.intensity ?? 5} onChange={(e) => updateCardioSet(idx, { intensity: Math.min(10, Math.max(1, Number(e.target.value))) })} />
                        </div>
                        <div>
                          <button type="button" className={styles.iconBtn} onClick={() => removeCardioSet(idx)}>×</button>
                        </div>
                      </div>
                    ))}
                    <div className={styles.actions}><button type="button" onClick={addCardioSet}>+ Ajouter une série</button></div>
                  </div>
                </div>
              )}

              <div className={styles.notes}>
                <LabelField label="Commentaire">
                  <textarea
                    value={data.notes}
                    onChange={(e) => emit({ ...data, notes: e.target.value })}
                    placeholder="Ex: prise neutre, dos gainé, dernière série difficile…"
                  />
                </LabelField>
              </div>
            </div>

            <footer className={styles.footer}>
              <button type="button" onClick={handleSave} disabled={saving} className={styles.saveBtn}> {saving ? 'Enregistrement…' : 'Enregistrer exo'} </button>
            </footer>
          </div>
        </div>
      )}
    {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
