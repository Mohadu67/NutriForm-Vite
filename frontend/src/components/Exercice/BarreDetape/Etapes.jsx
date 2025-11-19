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
            <div className={`${styles.circle} ${i === currentStep ? styles.active : ""} ${i < currentStep ? styles.done : ""}`}>
              {i < currentStep ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
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