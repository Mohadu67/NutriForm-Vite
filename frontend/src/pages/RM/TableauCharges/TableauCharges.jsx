import { ClipboardIcon, MuscleIcon, TargetIcon, FireIcon, AlertTriangleIcon } from "../../../components/Navbar/NavIcons";
import styles from "./TableauCharges.module.css";

export default function TableauCharges({ rm }) {
  const charges = [
    { percent: 100, reps: "1", objectif: "Force maximale", color: "#dc2626" },
    { percent: 95, reps: "2", objectif: "Force maximale", color: "#ea580c" },
    { percent: 90, reps: "3-4", objectif: "Force", color: "#f59e0b" },
    { percent: 85, reps: "5-6", objectif: "Force / Hypertrophie", color: "#eab308" },
    { percent: 80, reps: "6-8", objectif: "Hypertrophie", color: "#84cc16" },
    { percent: 75, reps: "8-10", objectif: "Hypertrophie", color: "#22c55e" },
    { percent: 70, reps: "10-12", objectif: "Hypertrophie", color: "#10b981" },
    { percent: 65, reps: "12-15", objectif: "Endurance musculaire", color: "#14b8a6" },
    { percent: 60, reps: "15-18", objectif: "Endurance musculaire", color: "#06b6d4" },
    { percent: 50, reps: "18-20+", objectif: "Endurance / Échauffement", color: "#0ea5e9" },
  ];

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>
            <ClipboardIcon size={24} />
          </span>
          Table des charges d'entraînement
        </h2>
        <p className={styles.subtitle}>
          Utilise ces pourcentages pour planifier tes séances selon ton objectif
        </p>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.col1}>% 1RM</div>
          <div className={styles.col2}>Charge</div>
          <div className={styles.col3}>Répétitions</div>
          <div className={styles.col4}>Objectif</div>
        </div>

        {charges.map((charge, index) => {
          const poids = Math.round((rm * charge.percent) / 100 * 2) / 2; // Arrondi à 0.5kg
          return (
            <div
              key={index}
              className={styles.tableRow}
              style={{ '--accent-color': charge.color }}
            >
              <div className={styles.col1}>
                <div className={styles.percent}>{charge.percent}%</div>
              </div>
              <div className={styles.col2}>
                <div className={styles.poids}>{poids}kg</div>
              </div>
              <div className={styles.col3}>
                <div className={styles.reps}>{charge.reps}</div>
              </div>
              <div className={styles.col4}>
                <div
                  className={styles.objectif}
                  style={{ background: charge.color }}
                >
                  {charge.objectif}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.tips}>
        <h3 className={styles.tipsTitle}>
          <span className={styles.tipsTitleIcon}>
            <MuscleIcon size={20} />
          </span>
          Conseils d'utilisation
        </h3>
        <div className={styles.tipsGrid}>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>
              <TargetIcon size={32} />
            </div>
            <h4 className={styles.tipTitle}>Force maximale</h4>
            <p className={styles.tipText}>
              85-100% du 1RM, 1-6 reps, repos 3-5min. Idéal pour progresser en force pure.
            </p>
          </div>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>
              <MuscleIcon size={32} />
            </div>
            <h4 className={styles.tipTitle}>Hypertrophie</h4>
            <p className={styles.tipText}>
              65-85% du 1RM, 6-12 reps, repos 60-90s. Parfait pour la prise de muscle.
            </p>
          </div>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>
              <FireIcon size={32} />
            </div>
            <h4 className={styles.tipTitle}>Endurance</h4>
            <p className={styles.tipText}>
              50-65% du 1RM, 15-20+ reps, repos 30-60s. Pour l'endurance musculaire.
            </p>
          </div>
        </div>

        <div className={styles.warning}>
          <span className={styles.warningIcon}>
            <AlertTriangleIcon size={20} />
          </span>
          <strong>Important :</strong> Ces valeurs sont des estimations. Commence toujours par des charges légères et augmente progressivement. En cas de doute, consulte un coach sportif.
        </div>
      </div>
    </section>
  );
}