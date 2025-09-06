

import React, { memo } from "react";

function ModeBar({ mode = "muscu", onChange, classes = {} }) {
  const { modeBar = "", selectControl = "" } = classes;

  return (
    <div className={modeBar}>
      <div className={selectControl}>
        <label htmlFor="mode-select">Type d'exercice</label>
        <select
          id="mode-select"
          value={mode}
          onChange={(e) => onChange && onChange(e.target.value)}
          aria-label="Type d'exercice"
        >
          <option value="muscu">Muscu</option>
          <option value="cardio">Cardio</option>
          <option value="pdc">Poids du corps</option>
        </select>
      </div>
    </div>
  );
}

export default memo(ModeBar);