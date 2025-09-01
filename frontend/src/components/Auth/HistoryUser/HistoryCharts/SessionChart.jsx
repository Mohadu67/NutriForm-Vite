import React, { useMemo } from "react";
import style from "../HistoryUser.module.css";
import LineChartSVG from "./LineChartSVG.jsx";

export default function SessionChart({ points }) {
  const safePoints = useMemo(() => {
    const toDate = (raw) => {
      if (!raw) return null;
      if (raw instanceof Date) return isNaN(raw) ? null : raw;
      if (typeof raw === "number") {
        const d = new Date(raw);
        return isNaN(d) ? null : d;
      }
      if (typeof raw === "string") {
        // support dd/mm/yyyy and iso-like strings
        const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
        const d = new Date(iso);
        return isNaN(d) ? null : d;
      }
      return null;
    };

    return (points || [])
      .map((pt) => ({
        value: Number(pt?.value ?? 1),
        date: toDate(pt?.date ?? pt?.createdAt ?? pt?.day)
      }))
      .filter((p) => p.date && Number.isFinite(p.value))
      .sort((a, b) => a.date - b.date);
  }, [points]);

  if (!safePoints || safePoints.length === 0) {
    return (
      <div className={style.chartCard}>
        <h4>Évolution des Séances</h4>
        <p className={style.muted}>Aucune donnée disponible.</p>
      </div>
    );
  }

  return (
    <div className={style.chartCard}>
      <h4>Évolution des Séances</h4>
      <LineChartSVG points={safePoints} color="#2e86de" />
    </div>
  );
}