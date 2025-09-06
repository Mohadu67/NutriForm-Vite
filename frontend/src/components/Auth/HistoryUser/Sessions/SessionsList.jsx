import React, { useMemo, useEffect, useState } from "react";
import style from "../HistoryUser.module.css";

function parseDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw) ? null : raw;
  if (typeof raw === "number") {
    const d = new Date(raw);
    return isNaN(d) ? null : d;
  }
  if (typeof raw === "string") {
    const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
    const d = new Date(iso);
    return isNaN(d) ? null : d;
  }
  return null;
}

function uniqByIdKeepLatest(items) {
  const map = new Map();
  for (const it of items) {
    const prev = map.get(it.id);
    if (!prev || (it.date && prev.date && it.date > prev.date)) {
      map.set(it.id, it);
    }
  }
  return Array.from(map.values());
}

export default function SessionsList({ sessions, onData, onDeleteSuccess }) {
  const [localRows, setLocalRows] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

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

    const deduped = uniqByIdKeepLatest(items);

    return deduped
      .filter(r => r.date)
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
  }, [sessions]);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  useEffect(() => {
    if (typeof onData === "function") {
      onData(rows);
    }
  }, [rows, onData]);

  async function handleDelete(id) {
    if (!id) return;
    const ok = window.confirm("Supprimer cette séance ?");
    if (!ok) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Suppression impossible');
      }
      setLocalRows(prev => prev.filter(r => r.id !== id));
      if (typeof onDeleteSuccess === 'function') onDeleteSuccess(id);
      if (typeof onData === 'function') onData(localRows.filter(r => r.id !== id));
    } catch (e) {
      console.error('[SessionsList] delete error', e);
      alert(e.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  }

  if (!localRows || localRows.length === 0) {
    return <p className={style.muted}>Aucune séance enregistrée.</p>;
  }

  return (
    <div className={style.sessionsSection}>
      <h4>Mes dernières séances</h4>
      <ul className={style.sessionList}>
        {localRows.map((s) => (
          <li key={s.id} className={style.sessionItem}>
            <span className={style.sessionName}>{s.name}</span>
            <span className={style.sessionDate}>
              {s.date ? s.date.toLocaleDateString('fr-FR') : '—'}
            </span>
            <span className={style.sessionCount}>
              {s.entriesCount ? `${s.entriesCount} exos` : '—'}
            </span>
            <button
              type="button"
              aria-label="Supprimer la séance"
              className={style.sessionDeleteBtn || ''}
              onClick={() => handleDelete(s.id)}
              disabled={deletingId === s.id}
              style={{ marginLeft: 'auto', fontSize: 12, color: '#b91c1c', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {deletingId === s.id ? '…' : 'Supprimer'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}