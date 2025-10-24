import React, { useMemo, useState } from "react";
import style from "./HistoryCharts.module.css";

const FILTERS = [
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
  { id: "all", label: "Tout" },
];

const numberFormatter = new Intl.NumberFormat("fr-FR");
const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING_LEFT = 36;
const PADDING_RIGHT = 24;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 36;

export default function CalorieChart({ burnPoints = [], targets = {}, summary = {} }) {
  const [timeFilter, setTimeFilter] = useState("month");
  const [consumedInput, setConsumedInput] = useState("");
  const [consumedCalories, setConsumedCalories] = useState(null);
  const [inputError, setInputError] = useState(null);

  const normalizedBurn = useMemo(() => {
    return (Array.isArray(burnPoints) ? burnPoints : [])
      .map((point) => {
        const date =
          point?.date instanceof Date
            ? point.date
            : point?.date
            ? new Date(point.date)
            : null;
        const burned = Number(point?.burned);
        if (!(date instanceof Date) || Number.isNaN(date?.getTime())) return null;
        if (!Number.isFinite(burned) || burned < 0) return null;
        return { date, burned: Math.round(burned) };
      })
      .filter(Boolean)
      .sort((a, b) => a.date - b.date);
  }, [burnPoints]);

  const filteredBurn = useMemo(() => {
    if (timeFilter === "all") return normalizedBurn;
    const now = new Date();
    const cutoff = new Date(now);
    switch (timeFilter) {
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "year":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        break;
    }
    cutoff.setHours(0, 0, 0, 0);
    return normalizedBurn.filter((point) => point.date >= cutoff);
  }, [normalizedBurn, timeFilter]);

  const primaryBurn = filteredBurn.length ? filteredBurn : normalizedBurn;

  const domain = useMemo(() => {
    if (primaryBurn.length) {
      return primaryBurn;
    }
    const reference =
      targets?.updatedAt instanceof Date && !Number.isNaN(targets.updatedAt.getTime())
        ? new Date(targets.updatedAt)
        : new Date();
    const start = new Date(reference);
    start.setDate(reference.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    reference.setHours(0, 0, 0, 0);
    return [
      { date: start, burned: null },
      { date: reference, burned: null },
    ];
  }, [primaryBurn, targets]);

  const maintenance = Number.isFinite(Number(targets?.maintenance))
    ? Math.round(Number(targets.maintenance))
    : null;
  const deficit = Number.isFinite(Number(targets?.deficit)) ? Math.round(Number(targets.deficit)) : null;
  const surplus = Number.isFinite(Number(targets?.surplus)) ? Math.round(Number(targets.surplus)) : null;

  const chartValues = [];
  domain.forEach((point) => {
    if (Number.isFinite(point?.burned)) {
      chartValues.push(point.burned);
    }
  });
  [maintenance, deficit, surplus].forEach((value) => {
    if (Number.isFinite(value)) chartValues.push(value);
  });

  const yMaxCandidate = chartValues.length ? Math.max(...chartValues) : 100;
  const yMax = yMaxCandidate === 0 ? 100 : yMaxCandidate * 1.15;
  const yMin = 0;

  const xStart = domain[0]?.date instanceof Date ? domain[0].date.getTime() : Date.now();
  const xEnd = domain[domain.length - 1]?.date instanceof Date ? domain[domain.length - 1].date.getTime() : xStart;
  const xRange = Math.max(xEnd - xStart, 1);
  const innerWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const xScale = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return PADDING_LEFT;
    }
    if (xRange === 0) {
      return PADDING_LEFT + innerWidth / 2;
    }
    const ratio = (date.getTime() - xStart) / xRange;
    return PADDING_LEFT + ratio * innerWidth;
  };

  const yScale = (value) => {
    if (!Number.isFinite(value)) {
      return CHART_HEIGHT - PADDING_BOTTOM;
    }
    if (yMax === yMin) {
      return PADDING_TOP + innerHeight / 2;
    }
    const ratio = (value - yMin) / (yMax - yMin);
    return CHART_HEIGHT - PADDING_BOTTOM - ratio * innerHeight;
  };

  const buildLinePath = (valueAccessor) => {
    const segments = domain
      .map((point) => {
        const value = valueAccessor(point);
        if (!Number.isFinite(value)) return null;
        const x = xScale(point.date).toFixed(2);
        const y = yScale(value).toFixed(2);
        return `${x} ${y}`;
      })
      .filter(Boolean);
    if (!segments.length) return "";
    return `M ${segments[0]}${segments.slice(1).map((seg) => ` L ${seg}`).join("")}`;
  };

  const buildAreaPath = (valueAccessor) => {
    const coordinates = domain
      .map((point) => {
        const value = valueAccessor(point);
        if (!Number.isFinite(value)) return null;
        return {
          x: xScale(point.date),
          y: yScale(value),
        };
      })
      .filter(Boolean);
    if (!coordinates.length) return "";
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const baseline = yScale(0);
    const topPath = coordinates.map((coord) => `${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`).join(" L ");
    return `M ${first.x.toFixed(2)} ${baseline.toFixed(2)} L ${topPath} L ${last.x.toFixed(2)} ${baseline.toFixed(
      2
    )} Z`;
  };

  const burnedPath = buildLinePath((point) => point.burned);
  const burnedAreaPath = buildAreaPath((point) => point.burned);
  const maintenancePath = maintenance != null ? buildLinePath(() => maintenance) : "";
  const deficitPath = deficit != null ? buildLinePath(() => deficit) : "";
  const surplusPath = surplus != null ? buildLinePath(() => surplus) : "";

  const totalBurned = filteredBurn.reduce((acc, point) => acc + (Number(point.burned) || 0), 0);
  const averageBurned = filteredBurn.length ? Math.round(totalBurned / filteredBurn.length) : null;
  const lastBurnedPoint = filteredBurn.length ? filteredBurn[filteredBurn.length - 1] : null;

  const maintenanceDiff =
    Number.isFinite(averageBurned) && Number.isFinite(maintenance)
      ? averageBurned - maintenance
      : null;

  const maintenanceDiffLabel =
    maintenanceDiff == null
      ? "Objectif maintien non défini"
      : `${maintenanceDiff > 0 ? "+" : "−"}${numberFormatter.format(Math.abs(maintenanceDiff))} kcal vs maintien`;

  const diffTone =
    maintenanceDiff == null
      ? "neutral"
      : maintenanceDiff > 0
      ? "positive"
      : maintenanceDiff < 0
      ? "negative"
      : "neutral";

  const periodLabel = useMemo(() => {
    if (!domain.length) return "Période indisponible";
    const first = domain[0].date;
    const last = domain[domain.length - 1].date;
    if (!(first instanceof Date) || !(last instanceof Date)) return "Période indisponible";
    const startLabel = shortDateFormatter.format(first);
    const endLabel = shortDateFormatter.format(last);
    return startLabel === endLabel ? endLabel : `${startLabel} -> ${endLabel}`;
  }, [domain]);

  const showEmptyPeriodMessage = !filteredBurn.length && normalizedBurn.length > 0;
  const noBurnData = normalizedBurn.length === 0;

  const summaryDeltaClass =
    summary?.deltaTone === "up"
      ? `${style.deltaBadge} ${style.deltaBadgePositive}`
      : summary?.deltaTone === "down"
      ? `${style.deltaBadge} ${style.deltaBadgeNegative}`
      : summary?.delta
      ? `${style.deltaBadge} ${style.deltaBadgeNeutral}`
      : null;

  const legendItems = [
    maintenance != null && { label: "Maintien", className: style.legendDotMaintenance },
    deficit != null && { label: "Perte (déficit)", className: style.legendDotDeficit },
    surplus != null && { label: "Prise (surplus)", className: style.legendDotSurplus },
    normalizedBurn.length > 0 && { label: "Calories brûlées", className: style.legendDotBurned },
  ].filter(Boolean);

  const handleConsumptionSubmit = (event) => {
    event.preventDefault();
    const normalized = consumedInput.trim().replace(",", ".");
    if (!normalized) {
      setConsumedCalories(null);
      setInputError("Saisis une valeur en kcal.");
      return;
    }
    const value = Number(normalized);
    if (!Number.isFinite(value) || value <= 0) {
      setInputError("Utilise un nombre positif (ex. 2200).");
      return;
    }
    setConsumedCalories(Math.round(value));
    setConsumedInput("");
    setInputError(null);
  };

  const consumptionDiff =
    consumedCalories != null && Number.isFinite(maintenance)
      ? consumedCalories - maintenance
      : null;

  const consumptionDiffLabel =
    consumptionDiff == null
      ? null
      : consumptionDiff === 0
      ? "Identique au maintien"
      : `${consumptionDiff > 0 ? "+" : "−"}${numberFormatter.format(Math.abs(consumptionDiff))} kcal vs maintien`;

  const consumptionTone =
    consumptionDiff == null
      ? "neutral"
      : consumptionDiff > 0
      ? "positive"
      : consumptionDiff < 0
      ? "negative"
      : "neutral";

  const consumptionToneClass =
    consumptionTone === "positive"
      ? style.trendPositive
      : consumptionTone === "negative"
      ? style.trendNegative
      : style.trendNeutral;

  return (
    <div className={`${style.chartCard} ${style.metricCard} ${style.chartContainer}`}>
      <div className={style.calorieSummary}>
        <div className={style.caloriePrimary}>
          <p className={style.calorieLabel}>Apport calorique recommandé</p>
          <div className={style.calorieValueRow}>
            <h4 className={style.calorieValue}>{summary?.value || "--"}</h4>
            {summary?.delta && summaryDeltaClass && <span className={summaryDeltaClass}>{summary.delta}</span>}
          </div>
          <p className={style.calorieMeta}>
            {summary?.meta || "Calcule ton besoin calorique pour personnaliser tes objectifs."}
          </p>
        <div className={style.calorieTargets}>
          {deficit != null && (
            <span className={`${style.calorieTargetPill} ${style.targetDeficit}`}>
              Perte&nbsp;: {numberFormatter.format(deficit)} kcal
            </span>
            )}
            {maintenance != null && (
              <span className={`${style.calorieTargetPill} ${style.targetMaintenance}`}>
                Maintien&nbsp;: {numberFormatter.format(maintenance)} kcal
              </span>
            )}
          {surplus != null && (
            <span className={`${style.calorieTargetPill} ${style.targetSurplus}`}>
              Prise&nbsp;: {numberFormatter.format(surplus)} kcal
            </span>
          )}
        </div>

        <form className={style.intakeForm} onSubmit={handleConsumptionSubmit}>
          <label htmlFor="calorie-consumed" className={style.intakeLabel}>
            Calories consommées aujourd'hui
          </label>
          <div className={style.intakeField}>
            <input
              id="calorie-consumed"
              type="number"
              inputMode="numeric"
              className={style.intakeInput}
              placeholder="Ex : 2200"
              value={consumedInput}
              onChange={(event) => setConsumedInput(event.target.value)}
              min="0"
            />
            <button type="submit" className={style.intakeButton}>
              Ajouter
            </button>
          </div>
          {inputError && <p className={style.intakeError}>{inputError}</p>}
          {consumedCalories != null && (
            <p className={`${style.intakeFeedback} ${consumptionToneClass}`}>
              {`Apport enregistré : ${numberFormatter.format(consumedCalories)} kcal`}
              {consumptionDiffLabel ? ` · ${consumptionDiffLabel}` : ""}
            </p>
          )}
        </form>
      </div>
        <div className={style.calorieControls}>
          <span className={style.rangeLabel}>{periodLabel}</span>
          <div className={style.filterButtons}>
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={`${style.filterBtn} ${timeFilter === filter.id ? style.filterBtnActive : ""}`}
                onClick={() => setTimeFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={style.calorieLegend}>
        {legendItems.map((item) => (
          <span key={item.label} className={style.legendItem}>
            <span className={`${style.legendDot} ${item.className}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>

      <div className={style.calorieChartArea}>
        <svg width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Courbe calorique">
          <defs>
            <linearGradient id="calorieBurnedArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 122, 89, 0.35)" />
              <stop offset="100%" stopColor="rgba(255, 122, 89, 0)" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = yMin + fraction * (yMax - yMin);
            const y = yScale(value);
            return (
              <line
                key={fraction}
                x1={PADDING_LEFT}
                x2={CHART_WIDTH - PADDING_RIGHT}
                y1={y}
                y2={y}
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="1"
              />
            );
          })}

          {burnedAreaPath && <path d={burnedAreaPath} fill="url(#calorieBurnedArea)" stroke="none" />}
          {maintenancePath && (
            <path d={maintenancePath} fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="6 6" />
          )}
          {deficitPath && <path d={deficitPath} fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="4 6" />}
          {surplusPath && <path d={surplusPath} fill="none" stroke="#EA580C" strokeWidth="2" strokeDasharray="2 6" />}
          {burnedPath && <path d={burnedPath} fill="none" stroke="#FF7A59" strokeWidth="3" strokeLinecap="round" />}

          {domain.map((point, index) => {
            if (!Number.isFinite(point?.burned)) return null;
            const cx = xScale(point.date);
            const cy = yScale(point.burned);
            return <circle key={index} cx={cx} cy={cy} r="4" fill="#FF7A59" stroke="#fff" strokeWidth="1.5" />;
          })}
        </svg>
      </div>

      {showEmptyPeriodMessage && (
        <p className={style.muted}>Aucune séance avec calories enregistrées pour cette période.</p>
      )}
      {noBurnData && (
        <p className={style.muted}>
          Ajoute des séances avec calories brûlées pour comparer à tes objectifs.
        </p>
      )}

      <div className={style.calorieStats}>
        <div className={style.calorieStat}>
          <span className={style.calorieStatLabel}>Écart vs maintien</span>
          <span
            className={`${style.calorieStatValue} ${
              diffTone === "positive"
                ? style.trendPositive
                : diffTone === "negative"
                ? style.trendNegative
                : style.trendNeutral
            }`}
          >
            {maintenanceDiffLabel}
          </span>
        </div>
        <div className={style.calorieStat}>
          <span className={style.calorieStatLabel}>Total brûlé ({FILTERS.find((f) => f.id === timeFilter)?.label ?? "Période"})</span>
          <span className={style.calorieStatValue}>
            {filteredBurn.length ? `${numberFormatter.format(totalBurned)} kcal` : "--"}
          </span>
        </div>
        <div className={style.calorieStat}>
          <span className={style.calorieStatLabel}>Dernière séance</span>
          <span className={style.calorieStatValue}>
            {lastBurnedPoint?.burned != null
              ? `${numberFormatter.format(lastBurnedPoint.burned)} kcal`
              : "—"}
          </span>
          {lastBurnedPoint?.date instanceof Date && (
            <span className={style.calorieStatMeta}>
              {`Le ${shortDateFormatter.format(lastBurnedPoint.date)}`}
            </span>
          )}
        </div>
        <div className={style.calorieStat}>
          <span className={style.calorieStatLabel}>Apport saisi</span>
          <span className={style.calorieStatValue}>
            {consumedCalories != null ? `${numberFormatter.format(consumedCalories)} kcal` : "—"}
          </span>
          {consumptionDiffLabel && (
            <span className={`${style.calorieStatMeta} ${consumptionToneClass}`}>
              {consumptionDiffLabel}
            </span>
          )}
        </div>
        <div className={style.calorieStat}>
          <span className={style.calorieStatLabel}>Moyenne quotidienne</span>
          <span className={style.calorieStatValue}>
            {averageBurned != null ? `${numberFormatter.format(averageBurned)} kcal` : "--"}
          </span>
        </div>
      </div>
    </div>
  );
}
