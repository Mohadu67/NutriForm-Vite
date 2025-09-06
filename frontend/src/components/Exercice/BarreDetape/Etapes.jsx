import styles from "./Etapes.module.css";

export default function Progress({ steps = [], currentStep = 0, onStepChange }) {
  return (
    <div className={styles.steps}>
      {steps.map((s, i) => (
        <div key={`step-${i}`} className={styles.stepWrapper}>
          <button
            type="button"
            className={styles.step}
            onClick={() => onStepChange && onStepChange(i)}
            aria-current={i === currentStep ? "step" : undefined}
          >
            <div className={`${styles.circle} ${i === currentStep ? styles.active : ""} ${i < currentStep ? styles.done : ""}`}>{i + 1}</div>
            <div className={styles.label}>{s.title}</div>
          </button>
          {i < steps.length - 1 && (
            <div className={`${styles.connector} ${i < currentStep ? styles.connectorDone : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}