import { useState } from "react";
import { saveSession as apiSaveSession, mapItemsToEntries } from "../../../../History/SessionTracking/sessionApi.js";

export default function useSaveSession() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save(opts = {}) {
    setError(null);
    setSaving(true);

    const snapshot = opts.snapshot || {};
    const label = opts.label || snapshot.sessionName || snapshot.name || "";
    const durSec = Number(opts.durationSec ?? snapshot.durationSec ?? 0) || 0;
    const summary = opts.summary || snapshot.summary || null;
    const summaryCounts = (() => {
      if (!summary || typeof summary !== 'object') return {};
      const planned = Number(summary.plannedExercises);
      const completed = Number(summary.completedExercises);
      const skipped = Number(summary.skippedExercises);
      return {
        plannedExercises: Number.isFinite(planned) ? planned : undefined,
        completedExercises: Number.isFinite(completed) ? completed : undefined,
        skippedExercises: Number.isFinite(skipped) ? skipped : undefined,
      };
    })();

    let entries = Array.isArray(opts.entries) ? opts.entries : null;
    if (!entries || entries.length === 0) {
      const items = Array.isArray(opts.items)
        ? opts.items
        : Array.isArray(snapshot.items)
        ? snapshot.items
        : [];
      entries = mapItemsToEntries(items);
    }

    if (!entries || entries.length === 0) {
      setSaving(false);
      return { ok: true, skipped: true, reason: "NO_VALID_ENTRIES" };
    }

    try {
      const startedAt = snapshot.startedAt || snapshot.started_at || opts.startedAt || new Date(Date.now() - durSec * 1000).toISOString();
      const endedAt = snapshot.finishedAt || snapshot.endedAt || opts.endedAt || new Date().toISOString();
      const durationMinutes = Math.max(0, Math.round(durSec / 60));

      const body = {
        entries,
        label: label || `Séance – ${new Date().toLocaleDateString()}`,
        startedAt,
        endedAt,
        durationMinutes,
        meta: {
          durationSec: durSec,
          ...(summary && typeof summary === "object" ? summary : {}),
        },
        summary: summary && typeof summary === 'object' ? summary : undefined,
        ...summaryCounts,
      };

      const data = await apiSaveSession(body);
      return { ok: true, skipped: false, data };
    } catch (e) {
      setError(e?.message || String(e));
      return { ok: false, error: e };
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, save };
}
