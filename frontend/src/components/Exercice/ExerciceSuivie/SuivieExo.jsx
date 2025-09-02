import React from "react";
import styles from "./SuivieExo.module.css";
import SuivieCard from "./SuivieCard";
import Button from "../../BoutonAction/BoutonAction";
import FinSeance from "./Finseance";


export default function SuivieExo({ sessionName, exercises, onBack, onSearch }) {
  const label = (sessionName && sessionName.trim()) ? sessionName.trim() : "ta séance";

  return (
    <section className={styles.wrapper}>
      <div className={styles.titleRow}>
        {onBack && (
          <Button
            type="button"
            className={styles.titleBackBtn}
            onClick={onBack}
            aria-label="Retour"
          >
            ←
          </Button>
        )}
        <h2 className={styles.title}>
          C'est parti pour ta séance <span className={styles.highlight}>{label}</span>
        </h2>
      </div>
      {exercises && exercises.length > 0 && (
        <>
          {exercises.map((exo, idx) => (
            <SuivieCard key={exo?.id ?? exo?.name ?? idx} exo={exo} />
          ))}
        </>
      )}
      <FinSeance />
    </section>
  );
}