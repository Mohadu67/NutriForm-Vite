import { useState } from "react";
import { request } from "../../../TableauBord/sessionApi";

export default function useSaveSession() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sauvegarde une séance complète (une seule requête) avec toutes les entrées.
   * @param {Object} params
   * @param {Array} params.entries - Tableau d'entrées (exercices) déjà mappées
   * @param {number} params.durationSec - Durée totale en secondes
   * @param {string} params.label - Nom/label de la séance
   * @param {Object} params.summary - Résumé côté client de la séance
   */
  async function save({ entries = [], durationSec = 0, label = "", summary = null } = {}) {
    setError(null);
    setSaving(true);
    try {
      const now = Date.now();
      const durSec = Math.max(0, Number(durationSec) || 0);
      const startedAt = new Date(now - durSec * 1000).toISOString();
      const endedAt = new Date(now).toISOString();
      const durationMinutes = Math.round(durSec / 60);

      const body = {
        entries,
        label: label || `Séance – ${new Date().toLocaleDateString()}`,
        startedAt,
        endedAt,
        durationMinutes,
      };

      if (summary !== null) {
        body.summary = summary;
      }

      const data = await request('/api/sessions', {
        method: 'POST',
        body,
      });

      return { ok: true, data };
    } catch (e) {
      setError(e?.message || String(e));
      return { ok: false, error: e };
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, save };
}