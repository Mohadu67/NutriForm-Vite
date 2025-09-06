

import { useState } from "react";
import { saveSession, buildSessionFromEntry } from "../../../TableauBord/sessionApi.js";

export default function useSaveSession() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save({ exo, data, mode, sessionName }) {
    setError(null);
    setSaving(true);
    try {
      const isCardio = mode === "cardio";
      const isPdc = mode === "pdc";

      const entry = {
        exerciseName: exo?.name || "Exercice",
        type: isCardio ? "cardio" : isPdc ? "poids_du_corps" : "muscu",
        order: 1,
        notes: data?.notes || "",
        sets: [],
      };

      if (isCardio) {
        const arr = Array.isArray(data?.cardioSets) ? data.cardioSets : [];
        if (!arr.length) throw new Error("Ajoute au moins une série cardio.");
        entry.sets = arr.map((s, i) => ({
          setNumber: i + 1,
          durationMin: numberOrZero(s?.durationMin),
          durationSec: numberOrZero(s?.durationSec),
          intensity: numberOrDefault(s?.intensity, 5),
        }));
      } else if (isPdc) {
        const arr = Array.isArray(data?.sets) ? data.sets : [];
        if (!arr.length) throw new Error("Ajoute au moins une série.");
        entry.sets = arr.map((s, i) => ({
          setNumber: i + 1,
          reps: numberOrZero(s?.reps),
          restSec: numberOrZero(s?.restSec),
        }));
      } else {
        const arr = Array.isArray(data?.sets) ? data.sets : [];
        if (!arr.length) throw new Error("Ajoute au moins une série.");
        entry.sets = arr.map((s, i) => ({
          setNumber: i + 1,
          weightKg: numberOrZero(s?.weight),
          reps: numberOrZero(s?.reps),
          restSec: numberOrZero(s?.restSec),
        }));
      }

      const payload = buildSessionFromEntry(entry, {
        name: sessionName || `Séance – ${new Date().toLocaleDateString()}`,
      });

      await saveSession(payload);
      return { ok: true };
    } catch (e) {
      setError(e?.message || String(e));
      return { ok: false, error: e };
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, save };
}

function numberOrZero(v) {
  if (v === "" || v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numberOrDefault(v, d) {
  if (v === "" || v == null) return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}