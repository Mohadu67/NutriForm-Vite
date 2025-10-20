import { useMemo } from "react";
import styles from "./RMHistory.module.css";
import RMChart from "../RMChart/RMChart.jsx";

export default function RMHistory({ rmTests = [] }) {
  // Trier les tests par date (plus récent en premier)
  const sortedTests = useMemo(() => {
    return [...rmTests].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [rmTests]);

  // Derniers tests (limite à 10)
  const recentTests = useMemo(() => sortedTests.slice(0, 10), [sortedTests]);

  // Stats rapides
  const stats = useMemo(() => {
    if (rmTests.length === 0) {
      return {
        bestRM: null,
        bestExercise: null,
        totalTests: 0,
        thisMonth: 0,
        topExercise: null
      };
    }

    // Meilleur 1RM
    const best = rmTests.reduce((max, test) =>
      test.rm > max.rm ? test : max
    );

    // Nombre de tests ce mois-ci
    const now = new Date();
    const thisMonthTests = rmTests.filter(test => {
      const testDate = new Date(test.date);
      return testDate.getMonth() === now.getMonth() &&
             testDate.getFullYear() === now.getFullYear();
    });

    // Exercice le plus testé
    const exerciseCounts = rmTests.reduce((acc, test) => {
      acc[test.exercice] = (acc[test.exercice] || 0) + 1;
      return acc;
    }, {});

    const topExercise = Object.entries(exerciseCounts).reduce((max, [ex, count]) =>
      count > max.count ? { exercice: ex, count } : max
    , { exercice: null, count: 0 });

    return {
      bestRM: best.rm,
      bestExercise: best.exercice,
      totalTests: rmTests.length,
      thisMonth: thisMonthTests.length,
      topExercise: topExercise.exercice
    };
  }, [rmTests]);

  // Calculer l'évolution par rapport au test précédent
  const getEvolution = (currentTest, index) => {
    if (index === sortedTests.length - 1) return null;

    const previousTests = sortedTests
      .slice(index + 1)
      .filter(t => t.exercice === currentTest.exercice);

    if (previousTests.length === 0) return null;

    const previousTest = previousTests[0];
    const diff = currentTest.rm - previousTest.rm;
    const percent = ((diff / previousTest.rm) * 100).toFixed(1);

    return { diff, percent };
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (rmTests.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>💪 Historique 1RM</h3>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏋️</div>
          <p className={styles.emptyText}>Aucun test de 1RM enregistré</p>
          <p className={styles.emptyHint}>
            Utilise le calculateur 1RM pour tester ta force maximale et suivre ta progression !
          </p>
          <a href="/outils" className={styles.emptyButton}>
            Calculer mon 1RM
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>💪 Historique 1RM</h3>
        <span className={styles.totalTests}>{stats.totalTests} test{stats.totalTests > 1 ? 's' : ''}</span>
      </div>

      {/* Graphique de progression */}
      {rmTests.length >= 2 && <RMChart rmTests={rmTests} />}

      {/* Stats rapides */}
      <div className={styles.quickStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Meilleur 1RM</p>
            <h4 className={styles.statValue}>{stats.bestRM}kg</h4>
            <p className={styles.statDetail}>{stats.bestExercise}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Ce mois-ci</p>
            <h4 className={styles.statValue}>{stats.thisMonth}</h4>
            <p className={styles.statDetail}>test{stats.thisMonth > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Exercice favori</p>
            <h4 className={styles.statValue}>{stats.topExercise || 'N/A'}</h4>
            <p className={styles.statDetail}>le plus testé</p>
          </div>
        </div>
      </div>

      {/* Liste des tests récents */}
      <div className={styles.testsList}>
        <div className={styles.testsHeader}>
          <h4 className={styles.testsTitle}>Tests récents</h4>
          <span className={styles.testsCount}>({recentTests.length})</span>
        </div>

        <div className={styles.tests}>
          {recentTests.map((test, index) => {
            const evolution = getEvolution(test, index);
            const fullIndex = sortedTests.findIndex(t => t === test);

            return (
              <div key={test.id || index} className={styles.testCard}>
                <div className={styles.testHeader}>
                  <div className={styles.testInfo}>
                    <h5 className={styles.testExercise}>{test.exercice}</h5>
                    <span className={styles.testDate}>{formatDate(test.date)}</span>
                  </div>
                  <div className={styles.testRM}>
                    <span className={styles.rmValue}>{test.rm}</span>
                    <span className={styles.rmUnit}>kg</span>
                  </div>
                </div>

                <div className={styles.testDetails}>
                  <span className={styles.testDetail}>
                    {test.poids}kg × {test.reps} reps
                  </span>
                  {evolution && (
                    <span
                      className={`${styles.evolution} ${evolution.diff > 0 ? styles.evolutionUp : styles.evolutionDown}`}
                    >
                      {evolution.diff > 0 ? '↗' : '↘'} {Math.abs(evolution.diff)}kg ({evolution.percent}%)
                    </span>
                  )}
                  {!evolution && fullIndex === sortedTests.length - 1 && (
                    <span className={styles.firstTest}>Premier test 🎯</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedTests.length > 10 && (
          <button className={styles.showMoreBtn}>
            Voir tous les tests ({sortedTests.length})
          </button>
        )}
      </div>
    </div>
  );
}
