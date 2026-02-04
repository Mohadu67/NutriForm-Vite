import { createPortal } from "react-dom";
import styles from "./CancelSessionModal.module.css";

const CANCEL_REASONS = [
  {
    id: "something_happened",
    label: "Quelque chose s'est passé",
    emoji: "😕",
    description: "Incident ou problème imprévu"
  },
  {
    id: "tired",
    label: "Je suis fatigué",
    emoji: "😴",
    description: "Trop fatigué pour continuer"
  },
  {
    id: "no_motivation",
    label: "Pas envie de continuer",
    emoji: "😑",
    description: "Manque de motivation"
  },
  {
    id: "pain",
    label: "Douleur ou malaise",
    emoji: "🤕",
    description: "Douleur ou inconfort physique"
  },
  {
    id: "no_time",
    label: "Je manque de temps",
    emoji: "⏰",
    description: "Pas assez de temps disponible"
  },
  {
    id: "other",
    label: "Autre raison",
    emoji: "❓",
    description: "Autre motif non listé"
  }
];

export default function CancelSessionModal({ show, onCancel, onContinue }) {
  if (!show) return null;

  const handleReasonSelect = (reasonId) => {
    onCancel(reasonId);
  };

  const modalContent = (
    <div className={styles.overlay} onClick={onContinue}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Pourquoi annuler ?</h2>
          <button
            className={styles.closeBtn}
            onClick={onContinue}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.subtitle}>
            Aide-nous à comprendre pourquoi tu annules cette séance
          </p>

          <div className={styles.reasonsList}>
            {CANCEL_REASONS.map((reason) => (
              <button
                key={reason.id}
                className={styles.reasonItem}
                onClick={() => handleReasonSelect(reason.id)}
              >
                <span className={styles.emoji}>{reason.emoji}</span>
                <div className={styles.reasonContent}>
                  <p className={styles.reasonLabel}>{reason.label}</p>
                  <p className={styles.reasonDescription}>{reason.description}</p>
                </div>
                <span className={styles.arrow}>→</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.continueBtn} onClick={onContinue}>
            Continuer la séance
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
