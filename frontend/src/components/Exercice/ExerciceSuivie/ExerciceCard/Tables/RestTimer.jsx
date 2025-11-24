import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./RestTimer.module.css";

export default function RestTimer({ value = "", onChange, serieNumber }) {
  const [showModal, setShowModal] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedTime, setSelectedTime] = useState(value || 60);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (value) setSelectedTime(value);
  }, [value]);

  const triggerEndAlert = useCallback(() => {

    document.body.classList.add(styles.flashAlert);
    setTimeout(() => {
      document.body.classList.remove(styles.flashAlert);
    }, 1500);


    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }


    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Repos terminé !", {
        body: `Série ${serieNumber} - C'est reparti !`,
        icon: "/icon-192.png",
        silent: false,
      });
    }
  }, [serieNumber]);

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
  }, [isActive, timeLeft, triggerEndAlert]);

  function handleStartTimer(seconds) {
    setSelectedTime(seconds);
    if (onChange) onChange(seconds);
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

  
  if (isActive || timeLeft > 0) {
    const progress = selectedTime > 0 ? ((selectedTime - timeLeft) / selectedTime) * 100 : 0;

    return (
      <div className={styles.timerActive}>
        <div className={styles.progressRing}>
          <svg viewBox="0 0 48 48" className={styles.progressSvg}>
            <defs>
              <linearGradient id={`grad-${serieNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle
              cx="24"
              cy="24"
              r="20"
              className={styles.progressBg}
              strokeWidth="3"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              className={styles.progressBar}
              strokeWidth="3"
              stroke={`url(#grad-${serieNumber})`}
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
            />
          </svg>
          <div className={styles.timeDisplay}>{formatTime(timeLeft)}</div>
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
    );
  }

  
  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={styles.restBtn}
        aria-label="Démarrer le repos"
      >
        ⏱
      </button>

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
