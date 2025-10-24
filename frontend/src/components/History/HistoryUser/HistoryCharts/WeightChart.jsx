import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import style from "./HistoryCharts.module.css";
import LineChartSVG from "./LineChartSVG.jsx";

const FILTER_LABELS = {
  week: "7 derniers jours",
  month: "30 derniers jours",
  year: "12 derniers mois",
  all: "Toute la période",
};

const formatWeight = (value) => {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return `${value.toFixed(1)} kg`;
};

const computeDeltaInfo = (current, previous, suffix) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { label: null, tone: "neutral" };
  }
  const diff = Number((current - previous).toFixed(1));
  if (Math.abs(diff) < 0.1) {
    return { label: `Stable ${suffix}`, tone: "neutral" };
  }
  const sign = diff > 0 ? "+" : "-";
  return {
    label: `${sign}${Math.abs(diff).toFixed(1)} kg ${suffix}`,
    tone: diff > 0 ? "up" : "down",
  };
};

const computeRangeDelta = (entries) => {
  if (!entries || entries.length === 0) {
    return { label: "Aucune donnée", tone: "neutral" };
  }
  if (entries.length < 2) {
    return { label: "Stable", tone: "neutral" };
  }
  const first = entries[0];
  const last = entries[entries.length - 1];
  if (!Number.isFinite(first?.value) || !Number.isFinite(last?.value)) {
    return { label: "Stable", tone: "neutral" };
  }
  const diff = Number((last.value - first.value).toFixed(1));
  if (Math.abs(diff) < 0.1) {
    return { label: "Stable", tone: "neutral" };
  }
  const sign = diff > 0 ? "+" : "-";
  return {
    label: `${sign}${Math.abs(diff).toFixed(1)} kg`,
    tone: diff > 0 ? "up" : "down",
  };
};

const computeMinMax = (entries) => {
  if (!entries || entries.length === 0) {
    return { min: null, max: null };
  }

  const values = entries
    .map((pt) => Number(pt?.value))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

export default function WeightChart({ points = [], imcSummary = null }) {
  const [showTooltip, setShowTooltip] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const containerRef = useRef(null);

  const imcValue = imcSummary?.value ?? null;
  const imcInterpretation = imcSummary?.interpretation ?? null;
  const imcWeight = imcSummary?.weight ?? null;
  const imcDateLabel = imcSummary?.dateLabel ?? null;

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const periodFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
    []
  );

  const sanitizedPoints = useMemo(() => {
    return (Array.isArray(points) ? points : [])
      .map((point) => {
        const value = Number(point?.value);
        const date =
          point?.date instanceof Date
            ? point.date
            : point?.date
            ? new Date(point.date)
            : null;

        if (!Number.isFinite(value) || !(date instanceof Date) || Number.isNaN(date.valueOf())) {
          return null;
        }

        return { value, date };
      })
      .filter(Boolean)
      .sort((a, b) => a.date - b.date);
  }, [points]);

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
    if (!sanitizedPoints.length) return [];
    if (timeFilter === "all") return sanitizedPoints;

    const now = new Date();
    const cutoffDate = new Date(now);

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
        return sanitizedPoints;
    }

    return sanitizedPoints.filter((pt) => pt.date && pt.date >= cutoffDate);
  }, [sanitizedPoints, timeFilter]);

  if (!sanitizedPoints.length) {
    const showImc = imcValue != null;
    return (
      <div className={`${style.chartCard} ${style.weightCard} ${style.chartContainer}`}>
        <div className={style.weightSummary}>
          <div className={style.weightPrimary}>
            <p className={style.weightLabel}>Poids actuel</p>
            <h4 className={style.weightValue}>--</h4>
            <p className={style.weightMeta}>Ajoute une première mesure pour visualiser ton évolution.</p>
          </div>
          {showImc && (
            <div className={style.weightImcInfo}>
              <span className={style.weightImcBadge}>IMC {imcValue}</span>
              {imcInterpretation && <p className={style.weightImcMeta}>{imcInterpretation}</p>}
              {imcWeight && <p className={style.weightImcMeta}>{`Poids associé : ${imcWeight}`}</p>}
              {imcDateLabel && <p className={style.weightImcMeta}>{imcDateLabel}</p>}
            </div>
          )}
        </div>
        <div className={style.emptyState}>
          <div className={style.emptyIcon}>📊</div>
          <p className={style.emptyText}>Aucune pesée enregistrée</p>
          <p className={style.emptyHint}>
            {showImc
              ? "Continue de suivre ton IMC pour enrichir ce graphique."
              : "Utilise le calculateur IMC pour suivre l'évolution de ton poids au fil du temps !"}
          </p>
          <a href="/outils" className={style.emptyButton}>
            Calculer mon IMC
          </a>
        </div>
      </div>
    );
  }

  const latestMeasurement = sanitizedPoints[sanitizedPoints.length - 1];
  const previousMeasurement =
    sanitizedPoints.length > 1 ? sanitizedPoints[sanitizedPoints.length - 2] : null;
  const latestWeight = Number(latestMeasurement?.value);
  const previousWeight = Number(previousMeasurement?.value);
  const latestDateLabel =
    latestMeasurement?.date instanceof Date ? dateFormatter.format(latestMeasurement.date) : null;

  const lastDelta = computeDeltaInfo(latestWeight, previousWeight, "vs dernière pesée");


  const rangeLabel = FILTER_LABELS[timeFilter] || "Période active";
  const periodDelta = computeRangeDelta(filteredPoints);
  const { min: minPeriod, max: maxPeriod } = computeMinMax(filteredPoints);
  const { min: minGlobal, max: maxGlobal } = computeMinMax(sanitizedPoints);

  const minValue = Number.isFinite(minPeriod) ? minPeriod : Number.isFinite(minGlobal) ? minGlobal : null;
  const maxValue = Number.isFinite(maxPeriod) ? maxPeriod : Number.isFinite(maxGlobal) ? maxGlobal : null;

  const periodCountLabel = filteredPoints.length
    ? `${filteredPoints.length} mesure${filteredPoints.length > 1 ? "s" : ""}`
    : "Aucune mesure sur cette période";

  let periodRangeLabel = rangeLabel;
  if (filteredPoints.length) {
    const startDate = filteredPoints[0].date;
    const endDate = filteredPoints[filteredPoints.length - 1].date;
    if (startDate && endDate) {
      const start = periodFormatter.format(startDate);
      const end = periodFormatter.format(endDate);
      periodRangeLabel = start === end ? end : `${start} -> ${end}`;
    }
  }

  return (
    <div className={`${style.chartCard} ${style.weightCard} ${style.chartContainer}`} ref={containerRef}>
      <div className={style.weightSummary}>
        <div className={style.weightPrimary}>
          <p className={style.weightLabel}>Poids actuel</p>
          <div className={style.weightValueRow}>
            <h4 className={style.weightValue}>{formatWeight(latestWeight)}</h4>
            {lastDelta.label && (
              <span
                className={`${style.deltaBadge} ${
                  lastDelta.tone === "up"
                    ? style.deltaBadgePositive
                    : lastDelta.tone === "down"
                    ? style.deltaBadgeNegative
                    : style.deltaBadgeNeutral
                }`}
              >
                {lastDelta.label}
              </span>
            )}
          </div>
          <p className={style.weightMeta}>
            {latestDateLabel ? `Mesuré le ${latestDateLabel}` : "Mesure la plus récente affichée ici"}
          </p>
        </div>
        <div className={style.weightControls}>
          <span className={style.rangeLabel}>{periodCountLabel}</span>
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
      </div>

      <div className={style.weightRangeMeta}>
        <span>{periodRangeLabel}</span>
        {imcValue && (
          <span className={style.weightImcBadge} title="Dernier IMC enregistré">
            IMC {imcValue}
          </span>
        )}
      </div>

      <div className={style.weightChartArea} onClick={handleChartClick}>
        <LineChartSVG points={filteredPoints} tooltipClass={style.chartTooltip} tooltipClassName={style.chartTooltip} showTooltip={showTooltip} />
      </div>

      {showTooltip && (
        <div className={style.tooltipHint}>
          Cliquez ailleurs pour fermer l'infobulle.
        </div>
      )}
      {filteredPoints.length === 0 && (
        <p className={style.muted}>Aucune donnée pour cette période.</p>
      )}

      <div className={style.weightStats}>
        <div className={style.weightStat}>
          <span className={style.weightStatLabel}>Variation ({rangeLabel})</span>
          <span
            className={`${style.weightStatValue} ${
              periodDelta.tone === "up"
                ? style.trendPositive
                : periodDelta.tone === "down"
                ? style.trendNegative
                : style.trendNeutral
            }`}
          >
            {periodDelta.label}
          </span>
        </div>
        <div className={style.weightStat}>
          <span className={style.weightStatLabel}>Plus bas</span>
          <span className={style.weightStatValue}>{formatWeight(minValue)}</span>
        </div>
        <div className={style.weightStat}>
          <span className={style.weightStatLabel}>Plus haut</span>
          <span className={style.weightStatValue}>{formatWeight(maxValue)}</span>
        </div>
        {imcValue && (
          <div className={style.weightStat}>
            <span className={style.weightStatLabel}>Dernier IMC</span>
            <span className={style.weightStatValue}>{imcValue}</span>
            {imcInterpretation && <span className={style.weightStatMeta}>{imcInterpretation}</span>}
            {imcWeight && <span className={style.weightStatMeta}>{`Poids associé : ${imcWeight}`}</span>}
            {imcDateLabel && <span className={style.weightStatMeta}>{imcDateLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
