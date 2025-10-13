import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import style from "./HistoryCharts.module.css";
import LineChartSVG from "./LineChartSVG.jsx";

export default function WeightChart({ points }) {
  const [showTooltip, setShowTooltip] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all"); 
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleChartClick = useCallback((e) => {
    e?.stopPropagation?.();
    setShowTooltip(true);
  }, []);

  const filteredPoints = useMemo(() => {
    if (!points || points.length === 0) return [];
    if (timeFilter === "all") return points;

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeFilter) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return points;
    }

    return points.filter(pt => pt.date && pt.date >= cutoffDate);
  }, [points, timeFilter]);

  if (!points || points.length === 0) {
    return (
      <div className={`${style.chartCard} ${style.chartContainer}`}>
        <div className={style.chartHeader}>
          <h4>Évolution du poids</h4>
        </div>
        <p className={style.muted}>Aucune donnée disponible.</p>
      </div>
    );
  }

  return (
    <div className={`${style.chartCard} ${style.chartContainer}`} ref={containerRef}>
      <div className={style.chartHeader}>
        <h4>Évolution du poids</h4>
        <div className={style.filterButtons}>
          <button
            className={`${style.filterBtn} ${timeFilter === "week" ? style.filterBtnActive : ""}`}
            onClick={() => setTimeFilter("week")}
          >
            Semaine
          </button>
          <button
            className={`${style.filterBtn} ${timeFilter === "month" ? style.filterBtnActive : ""}`}
            onClick={() => setTimeFilter("month")}
          >
            Mois
          </button>
          <button
            className={`${style.filterBtn} ${timeFilter === "year" ? style.filterBtnActive : ""}`}
            onClick={() => setTimeFilter("year")}
          >
            Année
          </button>
          <button
            className={`${style.filterBtn} ${timeFilter === "all" ? style.filterBtnActive : ""}`}
            onClick={() => setTimeFilter("all")}
          >
            Tout
          </button>
        </div>
      </div>
      <div onClick={handleChartClick}>
        <LineChartSVG
          points={filteredPoints.map((pt) => ({
            value: pt.value,
            date: pt.date,
          }))}
          tooltipClass={style.chartTooltip}
          tooltipClassName={style.chartTooltip}
          showTooltip={showTooltip}
        />
      </div>
      {showTooltip && (
        <div className={style.tooltipHint}>
          Cliquez ailleurs pour fermer l'infobulle.
        </div>
      )}
      {filteredPoints.length === 0 && (
        <p className={style.muted}>Aucune donnée pour cette période.</p>
      )}
    </div>
  );
}