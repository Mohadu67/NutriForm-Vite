import React from "react";
import style from "./HistoryCharts.module.css";
import LineChartSVG from "./LineChartSVG.jsx";

export default function WeightChart({ points }) {
  if (!points || points.length === 0) {
    return (
      <div className={`${style.chartCard} ${style.chartContainer}`}>
        <h4>Évolution du poids</h4>
        <p className={style.muted}>Aucune donnée disponible.</p>
      </div>
    );
  }

  return (
    <div className={`${style.chartCard} ${style.chartContainer}`}>
      <h4>Évolution du poids</h4>
      <LineChartSVG
        points={points.map((pt) => ({
          value: pt.value,
          date: pt.date,
        }))}
      />
    </div>
  );
}