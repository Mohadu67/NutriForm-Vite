import { memo } from "react";
import styles from "./Etapes.module.css";

function Progress({ steps = [], currentStep = 0, onStepChange }) {
  return (
    <div className={styles.steps} role="group" aria-label="Étapes de progression">
      {steps.map((s, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        const circleClasses = `${styles.circle} ${isActive ? styles.active : ""} ${isDone ? styles.done : ""}`;

        return (
          <div key={`step-${i}`} className={styles.stepWrapper}>
            <button
              type="button"
              className={styles.step}
              onClick={() => onStepChange?.(i)}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Étape ${i + 1}: ${s.title}${isActive ? " (actuelle)" : isDone ? " (terminée)" : ""}`}
              disabled={!onStepChange}
            >
              <div className={circleClasses}>{i + 1}</div>
              <div className={styles.label}>{s.title}</div>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`${styles.connector} ${isDone ? styles.connectorDone : ""}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(Progress);