import styles from "./LabelField.module.css";

export default function LabelField({ label, htmlFor, helper, error, children, className }) {
  return (
    <div className={`${styles.field} ${className || ""}`}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
      </label>
      {children}
      {helper && !error ? <div className={styles.helper}>{helper}</div> : null}
      {error ? <div className={styles.error} role="alert">{error}</div> : null}
    </div>
  );
}