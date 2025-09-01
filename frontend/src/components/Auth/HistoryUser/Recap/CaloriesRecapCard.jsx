

import React from "react";
import style from "../HistoryUser.module.css";

export default function CaloriesRecapCard({ calPoints, onDelete }) {
  if (!calPoints || calPoints.length === 0) {
    return (
      <div className={style.recapCard}>
        <h4 className={style.recapTitle}>Mes données calories</h4>
        <p className={style.muted}>Aucune donnée disponible.</p>
      </div>
    );
  }

  const last = calPoints[calPoints.length - 1];

  return (
    <div className={style.recapCard}>
      <h4 className={style.recapTitle}>Mes données calories</h4>
      <p className={style.lastValue}>
        Dernier: <strong>{last.value} kcal</strong> le{" "}
        {last.date.toLocaleDateString("fr-FR")}
      </p>
      <div className={style.chips}>
        {calPoints.map((pt) => (
          <button
            key={pt.id || pt.date}
            type="button"
            className={style.chip}
            onClick={() => onDelete?.(pt.id)}
          >
            {pt.value} kcal
          </button>
        ))}
      </div>
    </div>
  );
}