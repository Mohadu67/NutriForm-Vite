import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmModal.module.css';
import { AlertTriangleIcon } from '../ProgramIcons';

export default function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Focus trap: focus sur le premier bouton à l'ouverture
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Gestion du clavier (Escape pour fermer, Tab pour focus trap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Focus trap avec Tab
      if (e.key === 'Tab') {
        if (!modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={onCancel} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
        ref={modalRef}
      >
        <div className={styles.iconContainer}>
          <AlertTriangleIcon size={32} />
        </div>

        <h3 className={styles.title} id="modal-title">{title}</h3>
        <p className={styles.message} id="modal-message">{message}</p>

        <div className={styles.actions}>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
            ref={cancelButtonRef}
          >
            Annuler
          </button>
          <button onClick={onConfirm} className={styles.confirmButton}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
