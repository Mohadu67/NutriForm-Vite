import React, { useState, useEffect, useRef } from "react";
import styles from "./GlobalRestTimer.module.css";

export default function GlobalRestTimer() {
  const [showModal, setShowModal] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedTime, setSelectedTime] = useState(60);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsActive(false);
            triggerEndAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  function triggerEndAlert() {
    // Flash visuel
    document.body.classList.add(styles.flashAlert);
    setTimeout(() => {
      document.body.classList.remove(styles.flashAlert);
    }, 1500);

    // Vibration si disponible
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Notification si permission accordée
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Repos terminé !", {
        body: "C'est reparti pour la prochaine série !",
        icon: "/icon-192.png",
        silent: false,
      });
    }
  }

  function handleStartTimer(seconds) {
    setSelectedTime(seconds);
    setTimeLeft(seconds);
    setIsActive(true);
    setShowModal(false);
  }

  function stopTimer() {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  function resetTimer() {
    stopTimer();
    setTimeLeft(0);
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const quickTimes = [30, 45, 60, 90, 120];

  // Si le chrono est actif
  if (isActive || timeLeft > 0) {
    const progress = selectedTime > 0 ? ((selectedTime - timeLeft) / selectedTime) * 100 : 0;

    return (
      <div className={styles.timerBar}>
        <div className={styles.timerContent}>
          <div className={styles.progressRing}>
            <svg viewBox="0 0 56 56" className={styles.progressSvg}>
              <defs>
                <linearGradient id="globalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <circle
                cx="28"
                cy="28"
                r="24"
                className={styles.progressBg}
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                className={styles.progressBar}
                strokeWidth="4"
                stroke="url(#globalGrad)"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
              />
            </svg>
            <div className={styles.timeDisplay}>{formatTime(timeLeft)}</div>
          </div>
          <div className={styles.timerLabel}>
            <span className={styles.labelText}>Temps de repos</span>
            <span className={styles.labelTime}>{formatTime(timeLeft)}</span>
          </div>
          <button
            type="button"
            onClick={resetTimer}
            className={styles.btnReset}
            aria-label="Arrêter"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Bouton pour ouvrir la modal
  return (
    <>
      <div className={styles.timerBar}>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={styles.restBtn}
          aria-label="Démarrer le repos"
        >
          <span className={styles.btnIcon}>⏱</span>
          <span className={styles.btnText}>Lancer le chrono de repos</span>
        </button>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>Temps de repos</h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={styles.modalClose}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.quickGrid}>
                {quickTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={styles.timeBtn}
                    onClick={() => handleStartTimer(time)}
                  >
                    <span className={styles.timeBtnValue}>{time}</span>
                    <span className={styles.timeBtnLabel}>sec</span>
                  </button>
                ))}
              </div>
              <div className={styles.customTime}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(Number(e.target.value))}
                  className={styles.customInput}
                  placeholder="Personnalisé"
                />
                <button
                  type="button"
                  onClick={() => handleStartTimer(selectedTime)}
                  className={styles.customBtn}
                  disabled={!selectedTime || selectedTime <= 0}
                >
                  Démarrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
