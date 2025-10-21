import { useMemo, useState } from "react";
import styles from "./RMChart.module.css";

export default function RMChart({ rmTests = [] }) {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Grouper les tests par exercice
  const testsByExercise = useMemo(() => {
    const grouped = {};
    rmTests.forEach(test => {
      if (!grouped[test.exercice]) {
        grouped[test.exercice] = [];
      }
      grouped[test.exercice].push(test);
    });

    // Trier chaque groupe par date
    Object.keys(grouped).forEach(exercice => {
      grouped[exercice].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return grouped;
  }, [rmTests]);

  // Exercice sélectionné ou le premier disponible
  const exercice = selectedExercise || Object.keys(testsByExercise)[0];
  const tests = testsByExercise[exercice] || [];

  // Calculer les stats
  const stats = useMemo(() => {
    if (tests.length === 0) return { min: 0, max: 0, range: 0, avgProgress: 0 };

    const rms = tests.map(t => t.rm);
    const min = Math.min(...rms);
    const max = Math.max(...rms);
    const range = max - min;

    // Progression moyenne par test
    const avgProgress = tests.length > 1 ? range / (tests.length - 1) : 0;

    return { min, max, range, avgProgress };
  }, [tests]);

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (Object.keys(testsByExercise).length === 0) {
    return null;
  }

  // Dimensions du graphique
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Échelles
  const xScale = (index) => margin.left + (index / Math.max(tests.length - 1, 1)) * chartWidth;
  const yScale = (rm) => {
    const minY = Math.floor(stats.min * 0.9);
    const maxY = Math.ceil(stats.max * 1.1);
    const range = maxY - minY || 1;
    return margin.top + chartHeight - ((rm - minY) / range) * chartHeight;
  };

  // Valeurs pour l'axe Y
  const minY = Math.floor(stats.min * 0.9);
  const maxY = Math.ceil(stats.max * 1.1);
  const yStep = Math.ceil((maxY - minY) / 5);
  const yTicks = Array.from({ length: 6 }, (_, i) => minY + i * yStep);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>📈 Progression du 1RM</h4>
        <select
          value={exercice}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className={styles.select}
        >
          {Object.keys(testsByExercise).map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      {tests.length < 2 ? (
        <div className={styles.notEnough}>
          <div className={styles.notEnoughIcon}>📊</div>
          <p className={styles.notEnoughText}>
            Effectue au moins 2 tests pour visualiser ta progression
          </p>
          <p className={styles.notEnoughHint}>
            Fais un nouveau test de 1RM pour {exercice} !
          </p>
        </div>
      ) : (
        <>
          {/* Stats en haut */}
          <div className={styles.statsTop}>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Premier test</div>
              <div className={styles.statValue}>{tests[0].rm}<span className={styles.unit}>kg</span></div>
              <div className={styles.statDate}>{formatDateShort(tests[0].date)}</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Dernier test</div>
              <div className={styles.statValue}>{tests[tests.length - 1].rm}<span className={styles.unit}>kg</span></div>
              <div className={styles.statDate}>{formatDateShort(tests[tests.length - 1].date)}</div>
            </div>
            <div className={styles.statBox} style={{ borderColor: stats.range >= 0 ? '#10b981' : '#ef4444' }}>
              <div className={styles.statLabel}>Progression</div>
              <div
                className={styles.statValue}
                style={{ color: stats.range >= 0 ? '#10b981' : '#ef4444' }}
              >
                {stats.range >= 0 ? '+' : ''}{stats.range}<span className={styles.unit}>kg</span>
              </div>
              <div className={styles.statDate}>
                {stats.avgProgress > 0 ? `+${stats.avgProgress.toFixed(1)}kg/test` : 'Stable'}
              </div>
            </div>
          </div>

          {/* Graphique */}
          <div className={styles.chartWrapper}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className={styles.svg}
              width="100%"
              height={height}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9E8CFF" />
                  <stop offset="100%" stopColor="#FFB385" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#9E8CFF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FFB385" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grille horizontale avec labels */}
              {yTicks.map((tick, i) => {
                const y = yScale(tick);
                return (
                  <g key={i}>
                    <line
                      x1={margin.left}
                      y1={y}
                      x2={width - margin.right}
                      y2={y}
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={margin.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="11"
                      fill="#9ca3af"
                      fontWeight="500"
                    >
                      {tick}kg
                    </text>
                  </g>
                );
              })}

              {/* Axes */}
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={margin.top + chartHeight}
                y2={margin.top + chartHeight}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="2"
              />
              <line
                x1={margin.left}
                x2={margin.left}
                y1={margin.top}
                y2={margin.top + chartHeight}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="2"
              />

              {/* Labels des dates */}
              {tests.map((test, index) => {
                const showLabel = tests.length <= 5 || index === 0 || index === tests.length - 1 || index % Math.ceil(tests.length / 4) === 0;
                if (!showLabel) return null;
                const x = xScale(index);
                return (
                  <text
                    key={`date-${index}`}
                    x={x}
                    y={margin.top + chartHeight + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9ca3af"
                    fontWeight="500"
                  >
                    {formatDateShort(test.date)}
                  </text>
                );
              })}

              {/* Aire sous la courbe */}
              <path
                d={`
                  M ${margin.left} ${margin.top + chartHeight}
                  L ${tests.map((test, i) => `${xScale(i)} ${yScale(test.rm)}`).join(' L ')}
                  L ${xScale(tests.length - 1)} ${margin.top + chartHeight}
                  Z
                `}
                fill="url(#areaGradient)"
              />

              {/* Ligne de progression */}
              <path
                d={`M ${tests.map((test, i) => `${xScale(i)} ${yScale(test.rm)}`).join(' L ')}`}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 2px 4px rgba(158, 140, 255, 0.3))"
              />

              {/* Points */}
              {tests.map((test, index) => {
                const cx = xScale(index);
                const cy = yScale(test.rm);
                const isHovered = hoveredPoint === index;
                const isFirst = index === 0;
                const isLast = index === tests.length - 1;

                return (
                  <g key={index}>
                    {/* Halo au hover */}
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="12"
                        fill="#9E8CFF"
                        opacity="0.2"
                      />
                    )}
                    {/* Point principal */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? "7" : isFirst || isLast ? "6" : "5"}
                      fill="#fff"
                      stroke={isFirst ? "#10b981" : isLast ? "#FFB385" : "#9E8CFF"}
                      strokeWidth="3"
                      style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}

              {/* Tooltip */}
              {hoveredPoint !== null && (() => {
                const test = tests[hoveredPoint];
                const cx = xScale(hoveredPoint);
                const cy = yScale(test.rm);
                const tooltipWidth = 140;
                const tooltipHeight = 60;

                let tooltipX = cx - tooltipWidth / 2;
                if (tooltipX + tooltipWidth > width - 10) tooltipX = width - tooltipWidth - 10;
                if (tooltipX < 10) tooltipX = 10;

                let tooltipY = cy - tooltipHeight - 15;
                if (tooltipY < 10) tooltipY = cy + 15;

                const prevRM = hoveredPoint > 0 ? tests[hoveredPoint - 1].rm : null;
                const diff = prevRM !== null ? test.rm - prevRM : null;

                return (
                  <foreignObject
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        background: "linear-gradient(135deg, rgba(255, 179, 133, 0.98), rgba(181, 234, 215, 0.98))",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#2B2B2B",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
                        {test.rm} kg
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.85 }}>
                        {formatDate(test.date)}
                      </div>
                      {diff !== null && (
                        <div style={{
                          fontSize: "11px",
                          marginTop: "4px",
                          fontWeight: "700",
                          color: diff > 0 ? "#10b981" : diff < 0 ? "#ef4444" : "#666"
                        }}>
                          {diff > 0 ? "↗" : diff < 0 ? "↘" : "→"} {diff > 0 ? "+" : ""}{diff} kg
                        </div>
                      )}
                    </div>
                  </foreignObject>
                );
              })()}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
