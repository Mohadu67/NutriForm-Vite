import styles from "./ResultatsRM.module.css";

export default function ResultatsRM({ data }) {
  const { rm, exercice, poids, reps } = data;

  return (
    <section id="rm-results" className={styles.container}>
      <div className={styles.mainCard}>
        <div className={styles.header}>
          <h2 className={styles.exercice}>{exercice}</h2>
          <p className={styles.details}>
            {poids}kg × {reps} {reps > 1 ? 'répétitions' : 'répétition'}
          </p>
        </div>

        <div className={styles.rmDisplay}>
          <div className={styles.rmLabel}>Ton 1RM estimé</div>
          <div className={styles.rmValue}>{rm}<span className={styles.unit}>kg</span></div>
          <div className={styles.rmSubtext}>Répétition Maximale</div>
        </div>

        <div className={styles.comparison}>
          <div className={styles.comparisonItem}>
            <div className={styles.comparisonLabel}>Poids utilisé</div>
            <div className={styles.comparisonValue}>{poids}kg</div>
            <div className={styles.comparisonPercent}>{Math.round((poids / rm) * 100)}% du 1RM</div>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.comparisonItem}>
            <div className={styles.comparisonLabel}>Gain potentiel</div>
            <div className={styles.comparisonValue}>+{rm - poids}kg</div>
            <div className={styles.comparisonPercent}>Marge de progression</div>
          </div>
        </div>
      </div>

      <div className={styles.methodsCard}>
        <h3 className={styles.methodsTitle}>📊 Formules utilisées</h3>
        <div className={styles.methodsGrid}>
          <div className={styles.methodItem}>
            <span className={styles.methodName}>Epley</span>
            <span className={styles.methodValue}>{data.epley}kg</span>
          </div>
          <div className={styles.methodItem}>
            <span className={styles.methodName}>Brzycki</span>
            <span className={styles.methodValue}>{data.brzycki}kg</span>
          </div>
          <div className={styles.methodItem}>
            <span className={styles.methodName}>Lander</span>
            <span className={styles.methodValue}>{data.lander}kg</span>
          </div>
          <div className={styles.methodItem}>
            <span className={styles.methodName}>Lombardi</span>
            <span className={styles.methodValue}>{data.lombardi}kg</span>
          </div>
          <div className={styles.methodItem}>
            <span className={styles.methodName}>Mayhew</span>
            <span className={styles.methodValue}>{data.mayhew}kg</span>
          </div>
          <div className={styles.methodItem}>
            <span className={styles.methodName}>O'Conner</span>
            <span className={styles.methodValue}>{data.oconner}kg</span>
          </div>
          <div className={styles.methodItem}>
            <span className={styles.methodName}>Wathan</span>
            <span className={styles.methodValue}>{data.wathan}kg</span>
          </div>
        </div>
        <p className={styles.methodsNote}>
          💡 Le résultat affiché est la moyenne de 7 formules scientifiques pour plus de précision
        </p>
      </div>
    </section>
  );
}