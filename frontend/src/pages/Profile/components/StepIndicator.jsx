import styles from './StepIndicator.module.css';

const STEPS = [
  { number: 1, label: 'Profil' },
  { number: 2, label: 'Disponibilites' },
  { number: 3, label: 'Preferences' }
];

export default function StepIndicator({ currentStep }) {
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div className={styles.trackFill} style={{ width: `${progress}%` }} />
        {STEPS.map((step) => (
          <div
            key={step.number}
            className={`${styles.step} ${currentStep >= step.number ? styles.active : ''} ${currentStep === step.number ? styles.current : ''}`}
          >
            <div className={styles.dot}>
              {currentStep > step.number ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <span className={styles.label}>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}