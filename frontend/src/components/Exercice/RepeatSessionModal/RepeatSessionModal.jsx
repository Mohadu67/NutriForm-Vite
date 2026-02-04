import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./RepeatSessionModal.module.css";

export default function RepeatSessionModal({ session, onAccept, onDecline }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Supporter à la fois un array de sessions et une session unique (pour compatibilité)
  const sessions = Array.isArray(session) ? session : (session ? [session] : []);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (sessions.length > 0) {
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
  }, [sessions]);

  if (!sessions || sessions.length === 0) return null;

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

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const primarySession = sessions[0];
  const otherSessions = sessions.slice(1);

  const getPrimarySessionInfo = () => {
    const exerciseCount = primarySession.entries?.length || 0;
    const duration = primarySession.durationSec
      ? Math.round(primarySession.durationSec / 60)
      : null;
    return { exerciseCount, duration };
  };

  const getSessionInfo = (sess) => {
    const exerciseCount = sess.entries?.length || 0;
    const duration = sess.durationSec ? Math.round(sess.durationSec / 60) : null;
    return { exerciseCount, duration };
  };

  const { exerciseCount, duration } = getPrimarySessionInfo();

  const handleAcceptClick = () => {
    // Passer la première session (celle sélectionnée par défaut)
    onAccept(primarySession);
  };

  const handleOtherSessionClick = (sessionToRepeat) => {
    onAccept(sessionToRepeat);
  };

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const modalContent = (
    <div className={styles.overlay} onClick={onDecline}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>🔁 Répéter une séance</h2>
          <button
            className={styles.closeBtn}
            onClick={onDecline}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* SÉANCE PRINCIPALE */}
          <div className={styles.primarySessionSection}>
            <p className={styles.primaryLabel}>Dernière séance</p>

            <p className={styles.message}>
              Vous avez fait une séance <strong>{formatDate(primarySession.startedAt)}</strong>
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
              {primarySession.calories && (
                <div className={styles.infoItem}>
                  <span className={styles.icon}>🔥</span>
                  <span className={styles.label}>
                    {Math.round(primarySession.calories)} kcal
                  </span>
                </div>
              )}
            </div>

            {primarySession.name && (
              <p className={styles.sessionName}>"{primarySession.name}"</p>
            )}

            <p className={styles.question}>
              Voulez-vous refaire cette séance ?
            </p>
          </div>

          {/* AUTRES SÉANCES */}
          {otherSessions.length > 0 && (
            <div className={styles.otherSessionsSection}>
              <p className={styles.otherSessionsTitle}>Autres séances</p>

              <div className={styles.sessionsList}>
                {otherSessions.map((sess, index) => {
                  const { exerciseCount: count, duration: dur } = getSessionInfo(sess);
                  const isExpanded = expandedIndex === index;

                  return (
                    <div key={sess._id || index} className={styles.sessionItem}>
                      <button
                        className={styles.sessionItemHeader}
                        onClick={() => toggleExpanded(index)}
                      >
                        <div className={styles.sessionItemInfo}>
                          <div className={styles.sessionItemDate}>
                            <span className={styles.sessionDate}>
                              {formatDate(sess.startedAt)}
                            </span>
                            <span className={styles.sessionTime}>
                              {formatTime(sess.startedAt)}
                            </span>
                          </div>
                          <div className={styles.sessionItemStats}>
                            <span className={styles.stat}>💪 {count} exo</span>
                            {dur && <span className={styles.stat}>⏱️ {dur}min</span>}
                          </div>
                        </div>
                        <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                          ▼
                        </span>
                      </button>

                      {isExpanded && (
                        <div className={styles.sessionItemContent}>
                          {sess.name && (
                            <p className={styles.expandedSessionName}>
                              "{sess.name}"
                            </p>
                          )}

                          <div className={styles.exercisesList}>
                            <p className={styles.exercisesListTitle}>Exercices :</p>
                            {sess.entries && sess.entries.length > 0 ? (
                              <ul className={styles.exercises}>
                                {sess.entries.map((entry, exIdx) => (
                                  <li key={exIdx} className={styles.exerciseItem}>
                                    {entry.exerciseName || "Exercice"}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className={styles.noExercises}>Aucun exercice</p>
                            )}
                          </div>

                          <button
                            className={styles.repeatSessionBtn}
                            onClick={() => handleOtherSessionClick(sess)}
                          >
                            Refaire cette séance
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.declineBtn} onClick={onDecline}>
            Non, merci
          </button>
          <button className={styles.acceptBtn} onClick={handleAcceptClick}>
            Oui, c'est parti !
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
