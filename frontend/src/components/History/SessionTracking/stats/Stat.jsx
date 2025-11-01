import { useMemo } from "react";
import styles from "./Stat.module.css";
import { computeSessionStats } from "./computeSessionStats";

const FALLBACK_STATS = {
  durationSec: 0,
  calories: 0,
  volumeKg: 0,
  totalExercises: 0,
  exercisesDone: 0,
  cardioPct: 0,
  muscuPct: 0,
  percentDone: 0,
  delta: null,
};

const ICONS = {
  duration: "🕒",
  exercises: "🎯",
  calories: "🔥",
  volume: "🏋️‍♂️",
};

const DEFAULT_EMPTY = "Aucune donnée";

export default function Stat({
  lastSession,
  items = [],
  bodyMassKg,
  titleOverride,
  serverData,
}) {
  const stats = useMemo(() => {
    try {
      const computed = computeSessionStats(lastSession, items, {
        bodyMassKg,
        serverData,
      });
      return { ...FALLBACK_STATS, ...(computed || {}) };
    } catch (error) {
      return FALLBACK_STATS;
    }
  }, [lastSession, items, bodyMassKg, serverData]);

  const percentDone = clampPercent(stats.percentDone);
  const sessionTitle = useMemo(
    () => buildSessionTitle(lastSession, titleOverride),
    [lastSession, titleOverride]
  );
  const sessionName = useMemo(() => pickSessionName(lastSession), [lastSession]);
  const metrics = useMemo(
    () => buildMetrics(stats),
    [stats.durationSec, stats.exercisesDone, stats.totalExercises, stats.calories, stats.volumeKg]
  );
  const cardioPct = clampPercent(stats.cardioPct);
  const muscuPct = clampPercent(stats.muscuPct);
  const notes = useMemo(
    () => collectNotes(lastSession, items, serverData),
    [lastSession, items, serverData]
  );

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          {sessionName && <p className={styles.sessionName}>{sessionName}</p>}
          <h3 className={styles.title}>{sessionTitle.title}</h3>
          {sessionTitle.subtitle && (
            <p className={styles.subtitle}>{sessionTitle.subtitle}</p>
          )}
        </div>
        <div className={styles.percentChip}>
          <span className={styles.percentValue}>{percentDone}%</span>
          <span className={styles.percentLabel}>terminé</span>
        </div>
      </header>

      <div className={styles.metricGrid}>
        {metrics.map((metric) => (
          <div key={metric.key} className={styles.metricCard}>
            <span className={styles.metricIcon} aria-hidden="true">
              {metric.icon}
            </span>
            <span className={styles.metricValue}>{metric.value}</span>
            <span className={styles.metricLabel}>{metric.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.splits}>
        <SplitStat label="Cardio" value={cardioPct} type="cardio" />
        <SplitStat label="Musculation" value={muscuPct} type="muscu" />
      </div>

      {notes.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>📝 Notes</h4>
          <ul className={styles.notesList}>
            {notes.map((note) => (
              <li key={note.key} className={styles.noteItem}>
                <span className={styles.noteTitle}>{note.name}</span>
                <p className={styles.noteText}>{note.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function SplitStat({ label, value, type }) {
  return (
    <div className={styles.splitCard}>
      <div className={styles.splitHeader}>
        <span>{label}</span>
        <span className={styles.splitValue}>{value}%</span>
      </div>
      <div className={styles.splitBar}>
        <span
          className={`${styles.splitFill} ${type === 'cardio' ? styles.splitFillCardio : styles.splitFillMuscu}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function buildMetrics(stats) {
  const totalExercises = Math.max(0, Number(stats.totalExercises) || 0);
  const exercisesDone = Math.max(0, Number(stats.exercisesDone) || 0);

  return [
    {
      key: "duration",
      icon: ICONS.duration,
      label: "Durée",
      value: formatDuration(stats.durationSec),
    },
    {
      key: "exercises",
      icon: ICONS.exercises,
      label: "Exercices complétés",
      value: `${exercisesDone}/${totalExercises}`,
    },
    {
      key: "calories",
      icon: ICONS.calories,
      label: "Calories brûlées",
      value: formatNumber(stats.calories, "kcal"),
    },
    {
      key: "volume",
      icon: ICONS.volume,
      label: "Volume total",
      value: formatNumber(stats.volumeKg, "kg"),
    },
  ];
}

function collectNotes(lastSession, items, serverData) {
  const collected = new Map();

  const addNote = (name, note) => {
    const cleanNote = typeof note === "string" ? note.trim() : "";
    if (!cleanNote) return;
    const cleanName = (name ? String(name) : "Exercice").trim() || "Exercice";
    const key = `${cleanName}::${cleanNote}`;
    if (!collected.has(key)) {
      collected.set(key, { key, name: cleanName, note: cleanNote });
    }
  };

  const fromArray = (array) => {
    if (!Array.isArray(array)) return;
    array.forEach((entry) => {
      if (!entry) return;
      const label =
        entry.name ||
        entry.label ||
        entry.exerciseName ||
        entry.exoName ||
        entry.title;
      const data = entry.data && typeof entry.data === "object" ? entry.data : {};
      addNote(label, entry.notes ?? data.notes);
    });
  };

  const fromSummary = (summary) => {
    if (!summary || typeof summary !== "object") return;
    const list = Array.isArray(summary.exercises) ? summary.exercises : [];
    list.forEach((exercise) => {
      addNote(exercise?.exerciseName, exercise?.note);
    });
  };

  fromArray(items);
  fromArray(lastSession?.items);
  fromArray(lastSession?.entries);
  fromArray(lastSession?.exercises);
  fromSummary(lastSession?.clientSummary);
  fromSummary(serverData?.lastSummary);

  if (typeof lastSession?.notes === "string") {
    addNote(
      lastSession?.name || lastSession?.label || "Séance",
      lastSession.notes
    );
  }
  if (typeof lastSession?.comment === "string") {
    addNote(
      lastSession?.name || lastSession?.label || "Séance",
      lastSession.comment
    );
  }

  return Array.from(collected.values()).slice(0, 4);
}

function buildSessionTitle(session, overrideTitle) {
  if (overrideTitle && overrideTitle.trim()) {
    return { title: overrideTitle.trim(), subtitle: null };
  }

  const sessionDate = extractSessionDate(session);
  if (!sessionDate) {
    return { title: "Séance récente", subtitle: null };
  }

  const formatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const isToday = isSameDay(sessionDate, today);

  return {
    title: isToday ? "Séance du jour" : "Séance terminée",
    subtitle: formatter.format(sessionDate),
  };
}

function pickSessionName(session) {
  if (!session) return "";
  const candidates = [
    session.name,
    session.label,
    session.sessionName,
    session.title,
    session.programName,
  ];
  return candidates.find((value) => value && String(value).trim()) || "";
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  if (total <= 0) return DEFAULT_EMPTY;
  const minutes = Math.round(total / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function formatNumber(value, unit) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_EMPTY;
  const safe = Math.max(0, Math.round(number));
  const formatted = new Intl.NumberFormat("fr-FR").format(safe);
  return unit ? `${formatted} ${unit}` : formatted;
}

function clampPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function extractSessionDate(session) {
  if (!session) return null;
  const fields = [
    session.endedAt,
    session.performedAt,
    session.date,
    session.day,
    session.startedAt,
    session.createdAt,
  ];

  for (const field of fields) {
    const date = toDate(field);
    if (date) return date;
  }
  return null;
}

function toDate(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return Number.isNaN(value) ? null : value;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date) ? null : date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const formatted = slash ? `${slash[3]}-${slash[2]}-${slash[1]}` : trimmed;
    const date = new Date(formatted);
    return Number.isNaN(date) ? null : date;
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
