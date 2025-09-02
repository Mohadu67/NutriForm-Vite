import React from "react";
import styles from "./SuivieExo.module.css";
import SuivieCard from "./SuivieCard";

export default function SuivieExo({ sessionName, exercises, onBack }) {
  const label = (sessionName && sessionName.trim()) ? sessionName.trim() : "ta séance";

  return (
    <section className={styles.wrapper}>
      <div className={styles.titleRow}>
        {onBack && (
          <button
            type="button"
            className={styles.titleBackBtn}
            onClick={onBack}
            aria-label="Retour"
          >
            ←
          </button>
        )}
        <h2 className={styles.title}>
          C'est parti pour ta séance <span className={styles.highlight}>{label}</span>
        </h2>
      </div>
      {exercises && exercises.length > 0 && (
        <>
          {exercises.map((exo, idx) => (
            <SuivieCard key={idx} exo={exo} />
          ))}
        </>
      )}
    </section>
  );
}