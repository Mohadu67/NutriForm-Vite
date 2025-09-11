import React, { useMemo, useState } from "react";
import style from "./HistoryUser.module.css";
import LogoutActions from "./LogoutActions.jsx";
import HistoryHeader from "./HistoryHeader.jsx";
import ImcRecapCard from "./Recap/ImcRecapCard.jsx";
import WeightChart from "./HistoryCharts/WeightChart.jsx";
import SessionChart from "./HistoryCharts/SessionChart.jsx";
import useHistoryData from "./UseHistoryData.js";
import SuivieSeance from "../../Exercice/TableauBord/SuivieSeance.jsx";

export default function HistoryUser({ onClose, onLogout }) {
  const parseDate = (raw) => {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw) ? null : raw;
    if (typeof raw === 'number') {
      const d = new Date(raw);
      return isNaN(d) ? null : d;
    }
    if (typeof raw === 'string') {
      const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
      const d = new Date(iso);
      return isNaN(d) ? null : d;
    }
    return null;
  };
  const { records, sessions, status, error, displayName, setRecords, handleDelete } = useHistoryData();

  const [wsSessions, setWsSessions] = useState(null);
  const [wsPoints, setWsPoints] = useState(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/sessions', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        if (!alive) return;
        setWsSessions(Array.isArray(json.items) ? json.items : null);
        setWsPoints(Array.isArray(json.points) ? json.points : null);
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, []);

  const [userSessions, setUserSessions] = useState([]);
  React.useEffect(() => {
    const base = Array.isArray(wsSessions) ? wsSessions : sessions;
    const list = Array.isArray(base) ? base : [];

    const normalize = (s) => {

      const raw = Array.isArray(s?.entries) ? s.entries
        : Array.isArray(s?.items) ? s.items
        : Array.isArray(s?.exercises) ? s.exercises
        : [];

      const entries = raw.map((e) => {
        if (e && typeof e === 'object') {
          const name = e.name || e.label || e.exerciseName || e.exoName || e.title || 'Exercice';
          return { ...e, name };
        }
        return { name: String(e ?? 'Exercice') };
      });

      return { ...s, entries, items: entries, exercises: entries };
    };

    setUserSessions(list.map(normalize));
  }, [sessions, wsSessions]);

  const imcPoints = useMemo(() => records.filter(r => r.type === 'imc'), [records]);
  const weightPoints = useMemo(() =>
    imcPoints
      .map(r => ({ value: Number(r.poids), date: parseDate(r.date) }))
      .filter(p => Number.isFinite(p.value) && p.date)
      .sort((a, b) => a.date - b.date)
  , [imcPoints]);

  const sessionPoints = useMemo(() => {
    if (Array.isArray(wsPoints) && wsPoints.length) {
      const norm = wsPoints
        .map(p => ({ ...p, date: parseDate(p.date) }))
        .filter(p => p.date)
        .sort((a, b) => a.date - b.date);
      return norm;
    }

    const safeDate = (raw) => parseDate(
      raw?.date || raw?.createdAt || raw?.day || raw?.performedAt || raw?.startedAt || raw?.endedAt || raw
    );

    const pts = [];

    for (const s of (userSessions || [])) {
      const date = safeDate(s);
      if (!date) continue;

      const sessionName = s?.title || s?.name || s?.sessionName || s?.seanceName || null;
      const base = {
        date,
        value: 1,
        sessionName,
        type: s?.type || s?.category || s?.kind || s?.mode || s?.sport,
        minutes: s?.durationMinutes ?? s?.minutes,
        seconds: s?.durationSeconds ?? s?.seconds,
        distance: s?.distance ?? s?.km ?? s?.meters,
        pace: s?.pace ?? s?.allure,
        weight: s?.weight ?? s?.poids ?? s?.kg ?? s?.load,
        sets: s?.sets ?? s?.series ?? s?.séries,
        reps: s?.reps ?? s?.repetitions ?? s?.répétitions,
      };

      const exs = Array.isArray(s?.entries) ? s.entries
        : Array.isArray(s?.exercises) ? s.exercises
        : Array.isArray(s?.items) ? s.items
        : [];

      if (exs.length > 0) {
        for (const ex of exs) {
          const exName = ex?.name || ex?.label || ex?.exerciseName || ex?.exoName || null;
          pts.push({
            ...base,
            exerciseName: exName,
            type: (ex?.type || base.type),
            minutes: ex?.durationMinutes ?? ex?.minutes ?? base.minutes,
            seconds: ex?.durationSeconds ?? ex?.seconds ?? base.seconds,
            distance: ex?.distance ?? ex?.km ?? ex?.meters ?? base.distance,
            pace: ex?.pace ?? ex?.allure ?? base.pace,
            weight: ex?.weight ?? ex?.poids ?? ex?.kg ?? ex?.load ?? base.weight,
            sets: ex?.sets ?? ex?.series ?? ex?.séries ?? base.sets,
            reps: ex?.reps ?? ex?.repetitions ?? ex?.répétitions ?? base.reps,
          });
        }
      } else {
        const exerciseName = s?.exerciseName || s?.exoName || s?.lastExercise?.name || null;
        pts.push({ ...base, exerciseName });
      }
    }

    pts.sort((a, b) => a.date - b.date);
    return pts;
  }, [wsPoints, userSessions, parseDate]);

  const lastCompletedSession = useMemo(() => {
    const list = Array.isArray(userSessions) ? userSessions : [];
    if (list.length === 0) return null;

    const toDate = (s) => parseDate(
      s?.endedAt || s?.date || s?.createdAt || s?.performedAt || s?.startedAt || s?.day
    );
    const isDone = (s) => {
      const status = String(s?.status || "").toLowerCase();
      return (
        Boolean(s?.endedAt) ||
        Boolean(s?.finishedAt) ||
        s?.isFinished === true ||
        s?.percent === 100 || s?.progress === 100 ||
        ["done", "completed", "finished", "terminee", "terminée"].includes(status)
      );
    };

    const candidates = list
      .filter((s) => isDone(s))
      .map((s) => ({ s, d: toDate(s) }))
      .filter((x) => x.d)
      .sort((a, b) => b.d - a.d);

    return candidates.length ? candidates[0].s : null;
  }, [userSessions, parseDate]);

  return (
    <div className={style["popup-body"]}>
      <HistoryHeader displayName={displayName} />

      {status === "loading" && <p>Chargement…</p>}
      {status === "error" && <p className={style["popup-error"]}>{error}</p>}

      {records.length === 0 && status === "idle" && (
        <p>Aucune donnée pour l'instant. Enregistre un IMC, des calories ou une séance pour voir les courbes.</p>
      )}

      <div className={style.historyGrid}>
        <WeightChart points={weightPoints} />
        <SessionChart points={sessionPoints} />
      </div>

      <div className={style.recapGrid}>
        <ImcRecapCard imcPoints={imcPoints} sessions={userSessions} lastSession={lastCompletedSession} onDelete={handleDelete} />
      </div>

      <div className={style.suivieSeanceBlock}>
        <SuivieSeance 
          sessions={userSessions}
          lastSession={lastCompletedSession}
          onDeleteSuccess={(id) => {
            setUserSessions((prev) => prev.filter(s => s.id !== id));
          }}
        />
      </div>


      {onLogout && <LogoutActions onLogout={onLogout} />}
    </div>
  );
}