

import React from "react";
import style from "../HistoryUser.module.css";

export default function ImcRecapCard({ imcPoints, onDelete }) {
  if (!imcPoints || imcPoints.length === 0) {
    return (
      <div className={style.recapCard}>
        <h4 className={style.recapTitle}>Mes données IMC / Poids</h4>
        <p className={style.muted}>Aucune donnée disponible.</p>
      </div>
    );
  }

  const last = imcPoints[imcPoints.length - 1];

  return (
    <div className={style.recapCard}>
      <h4 className={style.recapTitle}>Mes données IMC / Poids</h4>
      <p className={style.lastValue}>
        Dernier: <strong>{last.value} (IMC)</strong>, Poids:{" "}
        <strong>{last.poids} kg</strong> le{" "}
        {last.date.toLocaleDateString("fr-FR")}
      </p>
      <div className={style.chips}>
        {imcPoints.map((pt) => (
          <button
            key={pt.id || pt.date}
            type="button"
            className={style.chip}
            onClick={() => onDelete?.(pt.id)}
          >
            {pt.value} (IMC) • {pt.poids} kg
          </button>
        ))}
      </div>
    </div>
  );
}