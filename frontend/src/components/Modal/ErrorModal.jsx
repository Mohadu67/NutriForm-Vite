import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalScroll } from '../../hooks/useModalScroll';
import styles from './ErrorModal.module.css';

/**
 * Modale générique pour afficher les erreurs
 *
 * @param {boolean} isOpen - État d'ouverture
 * @param {function} onClose - Callback de fermeture
 * @param {string} title - Titre de l'erreur
 * @param {string} message - Message d'erreur
 * @param {string} details - Détails techniques optionnels
 * @param {string} retryText - Texte du bouton retry
 * @param {function} onRetry - Callback pour réessayer
 */
export default function ErrorModal({
  isOpen,
  onClose,
  title = 'Une erreur s\'est produite',
  message = 'Une erreur inattendue s\'est produite. Veuillez réessayer plus tard.',
  details = null,
  retryText = 'Réessayer',
  onRetry = null
}) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useModalScroll(isOpen);

  // Focus initial sur le bouton de fermeture
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Escape key pour fermer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-title"
        aria-describedby="error-message"
        ref={modalRef}
      >
        <div className={styles.header}>
          <span className={styles.icon} role="img" aria-label="Erreur">
            ⚠️
          </span>
          <h2 id="error-title" className={styles.title}>{title}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fermer"
            ref={closeButtonRef}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <p id="error-message" className={styles.message}>{message}</p>

          {details && (
            <details className={styles.details}>
              <summary>Détails techniques</summary>
              <pre>{details}</pre>
            </details>
          )}
        </div>

        <div className={styles.footer}>
          {onRetry && (
            <button
              className={styles.retryBtn}
              onClick={() => {
                onRetry();
                onClose();
              }}
            >
              {retryText}
            </button>
          )}
          <button
            className={styles.closeActionBtn}
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
