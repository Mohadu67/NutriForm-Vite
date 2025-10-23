import React from "react";
import styles from "./SuivieCard.module.css";

function formatNumber(value) {
  if (value === "" || value === undefined || value === null) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(1);
}

export default function SwimForm({ swim = {}, onPatch }) {
  const poolLength = swim.poolLength ?? "";
  const lapCount = swim.lapCount ?? "";
  const totalDistance = swim.totalDistance ?? "";
  const asNumber =
    typeof totalDistance === "number"
      ? totalDistance
      : typeof totalDistance === "string"
      ? Number(totalDistance)
      : NaN;
  const distanceKm = !Number.isNaN(asNumber) && asNumber > 0 ? (asNumber / 1000).toFixed(asNumber >= 1000 ? 2 : 3) : null;
  const formattedDistance = formatNumber(totalDistance);

  const handleChange = (field) => (event) => {
    if (typeof onPatch !== "function") return;
    const value = event.target.value;
    onPatch({ [field]: value === "" ? "" : Number(value) >= 0 ? value : "" });
  };

  return (
    <section className={styles.swimForm}>
      <div className={styles.swimFormHeader}>
        <h4>Suivi piscine</h4>
        <p>Indique la longueur du bassin et le nombre d&apos;aller-retours réalisés.</p>
      </div>

      <div className={styles.swimInputsRow}>
        <label className={styles.swimField}>
          <span>Longueur du bassin (m)</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={poolLength}
            onChange={handleChange("poolLength")}
            placeholder="ex. 25"
          />
        </label>

        <label className={styles.swimField}>
          <span>Aller-retours effectués</span>
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={lapCount}
            onChange={handleChange("lapCount")}
            placeholder="ex. 20"
          />
        </label>
      </div>

      <div className={styles.swimSummary}>
        <span className={styles.swimSummaryLabel}>Distance totale estimée</span>
        <strong className={styles.swimSummaryValue}>
          {formattedDistance || "--"} m
          {distanceKm ? <span className={styles.swimSummarySub}>({distanceKm} km)</span> : null}
        </strong>
      </div>
    </section>
  );
}
