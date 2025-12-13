import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./RepeatSessionModal.module.css";

export default function RepeatSessionModal({ session, onAccept, onDecline }) {

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (session) {
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
  }, [session]);

  if (!session) return null;

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return "";
    }
  };

  const exerciseCount = session.entries?.length || 0;
  const duration = session.durationSec
    ? Math.round(session.durationSec / 60)
    : null;

  const modalContent = (
    <div className={styles.overlay} onClick={onDecline}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>🔁 Répéter votre séance ?</h2>
          <button
            className={styles.closeBtn}
            onClick={onDecline}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>
            Vous avez fait une séance <strong>{formatDate(session.startedAt)}</strong>.
          </p>

          <div className={styles.sessionInfo}>
            <div className={styles.infoItem}>
              <span className={styles.icon}>💪</span>
              <span className={styles.label}>
                {exerciseCount} exercice{exerciseCount > 1 ? "s" : ""}
              </span>
            </div>
            {duration && (
              <div className={styles.infoItem}>
                <span className={styles.icon}>⏱️</span>
                <span className={styles.label}>{duration} min</span>
              </div>
            )}
            {session.calories && (
              <div className={styles.infoItem}>
                <span className={styles.icon}>🔥</span>
                <span className={styles.label}>{Math.round(session.calories)} kcal</span>
              </div>
            )}
          </div>

          {session.name && (
            <p className={styles.sessionName}>"{session.name}"</p>
          )}

          <p className={styles.question}>
            Voulez-vous refaire cette séance ?
          </p>
        </div>

        <div className={styles.actions}>
          <button className={styles.declineBtn} onClick={onDecline}>
            Non, merci
          </button>
          <button className={styles.acceptBtn} onClick={onAccept}>
            Oui, c'est parti !
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
