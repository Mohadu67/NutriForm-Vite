import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle.js";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import style from "./Dashboard.module.css";
import ImcRecapCard from "../../components/Auth/HistoryUser/Recap/ImcRecapCard.jsx";
import WeightChart from "../../components/Auth/HistoryUser/HistoryCharts/WeightChart.jsx";
import SessionChart from "../../components/Auth/HistoryUser/HistoryCharts/SessionChart.jsx";
import useHistoryData from "../../components/Auth/HistoryUser/UseHistoryData.js";
import SuivieSeance from "../../components/Exercice/TableauBord/SuivieSeance.jsx";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

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

  const { records, sessions, points, status, error, displayName, handleDelete } = useHistoryData();

  const [userSessions, setUserSessions] = useState([]);

  React.useEffect(() => {
    const list = Array.isArray(sessions) ? sessions : [];

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
  }, [sessions]);

  const imcPoints = useMemo(() => records.filter(r => r.type === 'imc'), [records]);
  const weightPoints = useMemo(() =>
    imcPoints
      .map(r => ({ value: Number(r.poids), date: parseDate(r.date) }))
      .filter(p => Number.isFinite(p.value) && p.date)
      .sort((a, b) => a.date - b.date)
  , [imcPoints]);

  const sessionPoints = useMemo(() => {
    if (Array.isArray(points) && points.length) {
      const norm = points
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
  }, [points, userSessions, parseDate]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  return (
    <>
      <Header />
      <main className={style.dashboard}>
        <div className={style.container}>
          <div className={style.welcomeSection}>
            <h1 className={style.welcomeTitle}>Salut {displayName || "Utilisateur"} 👋</h1>
            <p className={style.welcomeSubtitle}>Voici ton tableau de bord, ton QG pour ecraser tes objectif</p>
          </div>

          {status === "loading" && <p className={style.loading}>Chargement…</p>}
          {status === "error" && <p className={style.error}>{error}</p>}

          {records.length === 0 && status === "idle" && (
            <p className={style.emptyState}>
              Aucune donnée pour l'instant. Enregistre un IMC, des calories ou une séance pour voir les courbes.
            </p>
          )}

          <div className={style.chartsGrid}>
            <WeightChart points={weightPoints} />
            <SessionChart points={sessionPoints} />
          </div>

          <div className={style.recapGrid}>
            <ImcRecapCard
              imcPoints={imcPoints}
              sessions={userSessions}
              lastSession={lastCompletedSession}
              onDelete={handleDelete}
            />
          </div>

          <div className={style.statsSection}>
            <SuivieSeance
              sessions={userSessions}
              lastSession={lastCompletedSession}
              onDeleteSuccess={(id) => {
                setUserSessions((prev) => prev.filter(s => s.id !== id));
              }}
            />
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}