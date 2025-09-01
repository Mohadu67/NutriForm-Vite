import React, { useMemo, useEffect } from "react";
import style from "../HistoryUser.module.css";

// Utilitaire local pour parser différentes formes de dates
function parseDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw) ? null : raw;
  if (typeof raw === "number") {
    const d = new Date(raw);
    return isNaN(d) ? null : d;
  }
  if (typeof raw === "string") {
    // supporte dd/mm/yyyy et formats ISO
    const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
    const d = new Date(iso);
    return isNaN(d) ? null : d;
  }
  return null;
}

export default function SessionsList({ sessions, onData }) {
  const rows = useMemo(() => {
    const items = (sessions || []).map((s, i) => {
      const rawDate = s?.startedAt || s?.date || s?.createdAt || s?.performedAt || s?.day;
      const d = parseDate(rawDate);
      return {
        id: s?.id || s?._id || i,
        name: s?.name || "Séance",
        date: d,
        entriesCount: Array.isArray(s?.entries) ? s.entries.length : (Number(s?.count) || 0)
      };
    });

    // garde uniquement celles qui ont une date valide puis trie du plus récent au plus ancien
    return items
      .filter(r => r.date)
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
  }, [sessions]);

  // Remonte éventuellement les données normalisées au parent si onData est fourni
  useEffect(() => {
    if (typeof onData === "function") {
      onData(rows);
    }
  }, [rows, onData]);

  if (!rows || rows.length === 0) {
    return <p className={style.muted}>Aucune séance enregistrée.</p>;
  }

  return (
    <div className={style.sessionsSection}>
      <h4>Mes dernières séances</h4>
      <ul className={style.sessionList}>
        {rows.map((s) => (
          <li key={s.id} className={style.sessionItem}>
            <span className={style.sessionName}>{s.name}</span>
            <span className={style.sessionDate}>
              {s.date ? s.date.toLocaleDateString("fr-FR") : "—"}
            </span>
            <span className={style.sessionCount}>
              {s.entriesCount ? `${s.entriesCount} exos` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}