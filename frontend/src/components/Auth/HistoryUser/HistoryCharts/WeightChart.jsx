import React, { useState, useCallback, useEffect, useRef } from "react";
import style from "./HistoryCharts.module.css";
import LineChartSVG from "./LineChartSVG.jsx";

export default function WeightChart({ points }) {
  const [showTooltip, setShowTooltip] = useState(true);
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
  if (!points || points.length === 0) {
    return (
      <div className={`${style.chartCard} ${style.chartContainer}`}>
        <h4>Évolution du poids</h4>
        <p className={style.muted}>Aucune donnée disponible.</p>
      </div>
    );
  }

  return (
    <div className={`${style.chartCard} ${style.chartContainer}`} ref={containerRef}>
      <h4>Évolution du poids</h4>
      <div onClick={handleChartClick}>
        <LineChartSVG
          points={points.map((pt) => ({
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
          Cliquez ailleurs pour fermer l’infobulle.
        </div>
      )}
    </div>
  );
}