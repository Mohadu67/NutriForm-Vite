

import { memo } from "react";
import styles from "./Alert.module.css";

function Alert({ show = false, message = "", onClose, variant = "error", children }) {
  if (!show) return null;

  const alertClass =
    variant === "success" ? styles.alertSuccess : styles.alert;
  const closeClass =
    variant === "success" ? styles.closeSuccess : styles.close;

  return (
    <>
      {/* Overlay */}
      <div className={styles.alertOverlay} onClick={onClose} />

      {/* Popup */}
      <div className={alertClass} role="alert" aria-live="assertive">
        <span className={styles.message}>{message}</span>
        {children && <div className={styles.actions}>{children}</div>}
        {onClose && (
          <button type="button" className={closeClass} onClick={onClose}>
            OK
          </button>
        )}
      </div>
    </>
  );
}

export default memo(Alert);