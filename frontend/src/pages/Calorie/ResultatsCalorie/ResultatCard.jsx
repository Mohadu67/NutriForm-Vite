import styles from "./ResultatsCalorie.module.css";

export default function ResultatCard({ titre, icone, calories, description, onClick }) {
  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <h3 className={styles.cardTitle}>{titre}</h3>
      {icone && <img src={icone} alt="" className={styles.cardIcon} />}
      <p className={styles.cardSubtitle}>consommation calorie par jour</p>
      <div className={styles.calorieBadge}>{calories}</div>
      <p className={styles.cardDescription}>{description}</p>
    </div>
  );
}