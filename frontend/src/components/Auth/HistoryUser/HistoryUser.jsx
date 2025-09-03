import React, { useMemo, useState } from "react";
import style from "./HistoryUser.module.css";
import LogoutActions from "./LogoutActions.jsx";
import HistoryHeader from "./HistoryHeader.jsx";
import ImcRecapCard from "./Recap/ImcRecapCard.jsx";
import WeightChart from "./HistoryCharts/WeightChart.jsx";
import SessionChart from "./HistoryCharts/SessionChart.jsx";
import useHistoryData from "./UseHistoryData.js";
import SuivieSeance from "../../Exercice/ExerciceSuivie/SuivieSeance.jsx";

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

  console.log("sessions length:", sessions?.length, "sample:", sessions?.[0]);

  const [userSessions, setUserSessions] = useState([]);
  React.useEffect(() => {
    setUserSessions(Array.isArray(sessions) ? sessions : []);
  }, [sessions]);

  const imcPoints = useMemo(() => records.filter(r => r.type === 'imc'), [records]);
  const weightPoints = useMemo(() =>
    imcPoints
      .map(r => ({ value: Number(r.poids), date: parseDate(r.date) }))
      .filter(p => Number.isFinite(p.value) && p.date)
      .sort((a, b) => a.date - b.date)
  , [imcPoints]);

  const sessionPoints = useMemo(() => {
    const toDayKey = (raw) => {
      if (!raw) return null;
      let d;
      if (raw instanceof Date) d = raw;
      else if (typeof raw === 'number') d = new Date(raw);
      else if (typeof raw === 'string') {
        const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
        d = new Date(iso);
      }
      if (!d || isNaN(d)) return null;
      const y = d.getFullYear();
      const mth = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${mth}-${day}`; // YYYY-MM-DD
    };

    const byDay = new Map();
    for (const s of (userSessions || [])) {
      const key = toDayKey(
        s?.date || s?.createdAt || s?.day || s?.performedAt || s?.startedAt || s?.endedAt
      );
      if (!key) continue;
      byDay.set(key, (byDay.get(key) || 0) + 1); // compter toutes les séances du jour
    }

    const keys = Array.from(byDay.keys()).sort();
    let total = 0;
    const arr = keys.map((k) => ({ date: new Date(k), value: (total += byDay.get(k)) }));
    console.log("sessionPoints length:", arr.length, "sample:", arr[0]);
    return arr;
  }, [userSessions]);

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
        <ImcRecapCard imcPoints={imcPoints} onDelete={handleDelete} />
      </div>

      <div style={{ marginTop: 12 }}>
        <SuivieSeance />
      </div>

      {onLogout && <LogoutActions onLogout={onLogout} />}
    </div>
  );
}