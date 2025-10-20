import { useMemo } from "react";
import styles from "./RMChart.module.css";

export default function RMChart({ rmTests = [], selectedExercise = null }) {
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
    if (tests.length === 0) return { min: 0, max: 0, range: 0 };

    const rms = tests.map(t => t.rm);
    const min = Math.min(...rms);
    const max = Math.max(...rms);
    const range = max - min;

    return { min, max, range };
  }, [tests]);

  // Générer les points du graphique
  const chartPoints = useMemo(() => {
    if (tests.length === 0) return [];

    const padding = 20;
    const chartHeight = 200 - padding * 2;
    const chartWidth = 100;

    return tests.map((test, index) => {
      const x = (index / Math.max(tests.length - 1, 1)) * chartWidth;
      const y = padding + chartHeight - ((test.rm - stats.min) / (stats.range || 1)) * chartHeight;

      return { x, y, rm: test.rm, date: test.date };
    });
  }, [tests, stats]);

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (Object.keys(testsByExercise).length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>📈 Progression du 1RM</h4>
        <select
          value={exercice}
          onChange={(e) => {}}
          className={styles.select}
        >
          {Object.keys(testsByExercise).map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      {tests.length < 2 ? (
        <div className={styles.notEnough}>
          <p className={styles.notEnoughText}>
            📊 Fais au moins 2 tests pour voir ta progression
          </p>
        </div>
      ) : (
        <>
          <div className={styles.chart}>
            <svg viewBox="0 0 100 200" className={styles.svg}>
              {/* Grille horizontale */}
              {[0, 25, 50, 75, 100].map((percent) => {
                const y = 20 + (160 * (100 - percent) / 100);
                return (
                  <g key={percent}>
                    <line
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="0.2"
                      opacity="0.2"
                    />
                  </g>
                );
              })}

              {/* Ligne de progression */}
              <polyline
                points={chartPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#9E8CFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Aire sous la courbe */}
              <polygon
                points={`0,180 ${chartPoints.map(p => `${p.x},${p.y}`).join(' ')} 100,180`}
                fill="url(#gradient)"
                opacity="0.3"
              />

              {/* Gradient */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#9E8CFF" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#9E8CFF" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Points */}
              {chartPoints.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="2"
                    fill="#9E8CFF"
                    stroke="white"
                    strokeWidth="1"
                  />
                  {/* Tooltip au survol (approximatif) */}
                  <title>{`${point.rm}kg - ${formatDate(point.date)}`}</title>
                </g>
              ))}
            </svg>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Premier test</span>
              <span className={styles.statValue}>{tests[0].rm}kg</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Dernier test</span>
              <span className={styles.statValue}>{tests[tests.length - 1].rm}kg</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Progression</span>
              <span
                className={styles.statValue}
                style={{ color: stats.range >= 0 ? '#10b981' : '#ef4444' }}
              >
                {stats.range >= 0 ? '+' : ''}{stats.range}kg
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
