import styles from './ConfirmModal.module.css';
import { AlertTriangleIcon } from '../ProgramIcons';

export default function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconContainer}>
          <AlertTriangleIcon size={32} />
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Annuler
          </button>
          <button onClick={onConfirm} className={styles.confirmButton}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
