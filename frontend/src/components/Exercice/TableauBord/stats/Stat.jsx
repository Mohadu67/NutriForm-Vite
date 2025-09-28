import React, { useMemo, useRef, useState, useEffect } from "react";
import styles from "./Stat.module.css";
import { computeSessionStats } from "./computeSessionStats";

export default function Stat({ lastSession, items = [], bodyMassKg, titleOverride, serverData }) {
  const computed = useMemo(() => {
    const fallback = {
      percentDone: 0,
      durationSec: 0,
      exercisesDone: 0,
      totalExercises: 0,
      calories: 0,
      volumeKg: 0,
      cardioPct: 0,
      muscuPct: 0,
      delta: null,
    };
    try {
      const res = computeSessionStats(lastSession, items || [], { bodyMassKg, serverData });
      return { ...fallback, ...(res || {}) };
    } catch (e) {
      return fallback;
    }
  }, [lastSession, items, bodyMassKg, serverData]);

  const exerciseNotes = useMemo(() => {
    const collected = new Map();

    const addNote = (rawName, rawNote) => {
      const note = typeof rawNote === 'string' ? rawNote.trim() : '';
      if (!note) return;
      const name = rawName ? String(rawName).trim() || 'Exercice' : 'Exercice';
      const key = `${name}::${note}`;
      if (!collected.has(key)) collected.set(key, { name, note });
    };

    const extractFromArray = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const entry of arr) {
        if (!entry) continue;
        const baseData = entry?.data && typeof entry.data === 'object' ? entry.data : entry;
        const note = baseData?.notes ?? entry?.notes;
        const label = entry?.name || entry?.label || entry?.exerciseName || entry?.exoName || entry?.title;
        addNote(label, note);
      }
    };

    const extractFromSummary = (summary) => {
      if (!summary || typeof summary !== 'object') return;
      const list = Array.isArray(summary.exercises) ? summary.exercises : [];
      for (const ex of list) {
        addNote(ex?.exerciseName, ex?.note);
      }
    };

    extractFromArray(items);
    extractFromArray(lastSession?.items);
    extractFromArray(lastSession?.exercises);
    extractFromArray(lastSession?.entries);
    extractFromSummary(lastSession?.clientSummary);
    extractFromSummary(serverData?.lastSummary);

    if (typeof lastSession?.notes === 'string') {
      addNote(lastSession?.name || lastSession?.label || 'Séance', lastSession.notes);
    }
    if (typeof lastSession?.comment === 'string') {
      addNote(lastSession?.name || lastSession?.label || 'Séance', lastSession.comment);
    }

    return Array.from(collected.values());
  }, [items, lastSession]);

  const exerciseStats = useMemo(() => {
    const sanitize = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
    };

    const candidates = [];

    {
      const done = sanitize(computed.exercisesDone);
      const total = sanitize(computed.totalExercises);
      if (done > 0 || total > 0) candidates.push({ src: 'computed', done, total });
    }

    if (Array.isArray(items) && items.length) {
      const totalFromItems = items.length;
      const doneFromItems = items.filter(x => x && (x.done === true || x.completed === true || x.status === 'done' || x.status === 'completed')).length;
      candidates.push({ src: 'items', done: sanitize(doneFromItems), total: sanitize(totalFromItems) });
    }

    {
      const cs = lastSession?.clientSummary;
      if (cs) {
        const list = Array.isArray(cs.exercises) ? cs.exercises : [];
        const doneFromList = list.filter(x => x && (x.done === true || x.completed === true || x.status === 'done' || x.status === 'completed')).length;
        const a2 = sanitize(cs.completedExercises || doneFromList);
        let b2 = sanitize(cs.plannedExercises);
        if (b2 <= 0) b2 = sanitize(list.length);
        if (a2 > 0 || b2 > 0) candidates.push({ src: 'clientSummary', done: a2, total: b2 });
      }
    }

    {
      const entries = Array.isArray(lastSession?.entries) ? lastSession.entries : null;
      if (entries && entries.length) {
        const totalFromEntries = entries.length;
        const doneFromEntries = entries.filter(x => x && (x.done === true || x.completed === true || x.status === 'done' || x.status === 'completed')).length;
        candidates.push({ src: 'entries', done: sanitize(doneFromEntries), total: sanitize(totalFromEntries) });
      }
    }

    {
      const a = sanitize(serverData?.lastCompletedExercises);
      const b = sanitize(serverData?.lastPlannedExercises);
      if (a > 0 || b > 0) candidates.push({ src: 'serverDataAB', done: a, total: b });
      const list = Array.isArray(serverData?.lastExercisesList) ? serverData.lastExercisesList : null;
      if (list && list.length) {
        const doneFromList = list.filter(x => x && (x.done === true || x.completed === true || x.status === 'done' || x.status === 'completed')).length;
        candidates.push({ src: 'serverDataList', done: sanitize(doneFromList), total: sanitize(list.length) });
      }
    }

    let top = { src: 'none', done: 0, total: 0 };
    if (candidates.length) {
      candidates.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return b.done - a.done;
      });
      top = candidates[0];
    }

    return { top, candidates };
  }, [computed, items, lastSession, serverData]);

  const sessionIdRef = useRef(null);
  const [bestCount, setBestCount] = useState({ done: 0, total: 0, src: 'none' });

  const currentSessionId = lastSession?._id || lastSession?.id || lastSession?.startedAt || null;
  useEffect(() => {
    if (sessionIdRef.current !== currentSessionId) {
      sessionIdRef.current = currentSessionId;
      setBestCount({ done: 0, total: 0, src: 'none' });
    }
  }, [currentSessionId]);

  useEffect(() => {
    const { done, total, src } = exerciseStats.top;
    const better = (total > bestCount.total) || (total === bestCount.total && done > bestCount.done);
    if (better) setBestCount({ done, total, src });
  }, [exerciseStats.top, bestCount.total, bestCount.done]);

  const cardioPct = clampPct(computed.cardioPct);
  const muscuPct = clampPct(computed.muscuPct);

  const sessionMeta = useMemo(() => {
    const date = extractSessionDate(lastSession);
    if (!date) {
      return {
        title: titleOverride && titleOverride.trim() ? titleOverride : "Séance",
      };
    }

    const today = new Date();
    const isToday = isSameDay(date, today);
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      title: isToday ? "Séance du jour" : `Séance du ${formatter.format(date)}`,
      isToday,
    };
  }, [lastSession, titleOverride]);

  const sessionNameBadge = lastSession?.name
    || lastSession?.label
    || lastSession?.sessionName
    || lastSession?.title
    || sessionMeta.title
    || 'Séance';

  return (
    <section className={styles.card} aria-labelledby="stat-title">
      <header className={styles.header}>
        <div className={styles.titleBox}>
          <h3 id="stat-title" className={styles.title}>{sessionMeta.title}</h3>
        </div>
        <div className={styles.doneChip} aria-label="pourcentage terminé">
          <span className={styles.dot} /> {computed.percentDone}% terminé
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.item}>
          <div className={`${styles.icon} ${styles.iconClock}`}>🕒</div>
          <div className={styles.value}>{formatDurationMin(computed.durationSec)}</div>
          <div className={styles.label}>Durée</div>
        </div>
        <div className={styles.item}>
          <div className={`${styles.icon} ${styles.iconTarget}`}>🎯</div>
          <div className={styles.value}>
          {formatExerciseCount(bestCount.done, bestCount.total)}
          <span aria-hidden style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }} title={`src:${bestCount.src} d:${bestCount.done} t:${bestCount.total}`}></span>
          </div>
          <div className={styles.label}>Exercices</div>
        </div>
        <div className={styles.item}>
          <div className={`${styles.icon} ${styles.iconFire}`}>🔥</div>
          <div className={styles.value}>~{formatNumber(computed.calories)}<span className={styles.unit}> kcal</span></div>
          <div className={styles.label}>Calories</div>
        </div>
        <div className={styles.item}>
          <div className={`${styles.icon} ${styles.iconWeight}`}>🏋️‍♂️</div>
          <div className={styles.value}>{formatNumber(computed.volumeKg)}<span className={styles.unit}> kg</span></div>
          <div className={styles.label}>Volume total</div>
        </div>
      </div>

      <div className={styles.splitRow}>
        <div className={styles.splitItem}>
          <div className={styles.splitLabel}>Cardio</div>
          <div
            className={styles.splitBar}
            style={{ '--pct': cardioPct + '%' }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={cardioPct}
            aria-label="Part cardio"
          >
            <span
              className={styles.barFill}
              style={{ width: `${cardioPct}%`, opacity: cardioPct === 0 ? 0.15 : 1 }}
            />
          </div>
          <div className={styles.splitPct}>{cardioPct}%</div>
        </div>
        <div className={styles.splitItem}>
          <div className={styles.splitLabel}>Muscu</div>
          <div
            className={styles.splitBar}
            style={{ '--pct': muscuPct + '%' }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={muscuPct}
            aria-label="Part musculation"
          >
            <span
              className={styles.barFill}
              style={{ width: `${muscuPct}%`, opacity: muscuPct === 0 ? 0.15 : 1 }}
            />
          </div>
      <div className={styles.splitPct}>{muscuPct}%</div>
    </div>
  </div>

  {exerciseNotes.length > 0 && (
    <div className={styles.notesSection}>
      <div className={styles.sessionBadge}>{sessionNameBadge}</div>
      <ul className={styles.notesList}>
        {exerciseNotes.map(({ name, note }, idx) => (
          <li key={`${idx}-${name}`} className={styles.noteItem}>
            <div className={styles.noteTitle}>{name || 'Exercice'}</div>
            <p className={styles.noteText}>{note}</p>
          </li>
        ))}
      </ul>
    </div>
  )}

  {computed.delta && (
    <div className={styles.compare}>
      <div className={styles.compareTitle}>Comparaison avec la dernière séance</div>
      <div className={styles.compareRow}>
        <span>Durée:</span>
            <span className={deltaClass(computed.delta.durationSec)}>{formatDurationMin(Math.abs(computed.delta.durationSec))}</span>
            <span>Volume:</span>
            <span className={deltaClass(computed.delta.volumeKg)}>{formatNumber(Math.abs(computed.delta.volumeKg))} kg</span>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDurationMin(sec) {
  const m = Math.max(0, Math.round(sec / 60));
  return `${m}min`;
}

function formatNumber(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.max(0, Math.round(n)));
}

function formatExerciseCount(done, total) {
  const sanitize = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.round(num));
  };
  const safeDone = sanitize(done);
  const safeTotal = sanitize(total);
  return `${safeDone}/${safeTotal}`;
}

function deltaClass(n) { return n >= 0 ? "" : styles.down; }

function clampPct(n) {
  const v = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function extractSessionDate(session) {
  if (!session) return null;
  const candidates = [
    session?.endedAt,
    session?.performedAt,
    session?.date,
    session?.day,
    session?.startedAt,
    session?.createdAt,
  ];

  for (const raw of candidates) {
    if (!raw && raw !== 0) continue;
    const date = toDate(raw);
    if (date) return date;
  }

  return null;
}

function toDate(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;

  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const iso = slash ? `${slash[3]}-${slash[2]}-${slash[1]}` : trimmed;
    const d = new Date(iso);
    return isNaN(d) ? null : d;
  }

  return null;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
