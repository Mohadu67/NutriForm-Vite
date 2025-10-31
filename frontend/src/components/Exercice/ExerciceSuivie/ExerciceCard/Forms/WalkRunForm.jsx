import { useState, useEffect, useRef } from "react";
import styles from "../SuivieCard.module.css";
import walkStyles from "./WalkRunForm.module.css";
import RouteTracker from "./RouteTracker/RouteTracker.jsx";

export default function WalkRunForm({ data, patchWalkRun }) {
  const walkRun = data?.walkRun || { durationMin: "", pauseMin: "", distanceKm: "", route: [] };
  const [showGPS, setShowGPS] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  const [pauseTimerRunning, setPauseTimerRunning] = useState(false);
  const [pauseTimerSeconds, setPauseTimerSeconds] = useState(0);
  const pauseIntervalRef = useRef(null);

  const togglePauseTimer = () => {
    if (pauseTimerRunning) {
      clearInterval(pauseIntervalRef.current);
      setPauseTimerRunning(false);
      const pauseMinutes = Math.round((pauseTimerSeconds / 60) * 10) / 10;
      patchWalkRun({ pauseMin: pauseMinutes });
      setPauseTimerSeconds(0);
    } else {
      setPauseTimerRunning(true);
      pauseIntervalRef.current = setInterval(() => {
        setPauseTimerSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (pauseIntervalRef.current) {
        clearInterval(pauseIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const averagePace = walkRun.durationMin && walkRun.distanceKm
    ? (() => {
        const totalMin = Number(walkRun.durationMin);
        const pauseMin = Number(walkRun.pauseMin || 0);
        const activeMin = totalMin - pauseMin;
        if (activeMin <= 0) return null;
        return (walkRun.distanceKm / (activeMin / 60)).toFixed(2);
      })()
    : null;

  return (
    <section className={`${styles.focusForm} ${walkStyles.walkRunForm}`}>
      <div className={styles.focusFormHeader}>
        <h4>Suivi marche / course</h4>
        <p>{showGPS ? 'Utilise le GPS pour un suivi automatique' : 'Indique ton temps d\'activité, tes pauses et la distance parcourue.'}</p>
      </div>

      {/* Bouton GPS */}
      <div className={walkStyles.gpsToggle}>
        <button
          type="button"
          className={walkStyles.gpsToggleButton}
          onClick={() => setShowGPS(!showGPS)}
        >
          {showGPS ? '📝 Saisie manuelle' : '🗺️ Suivi GPS automatique'}
        </button>
      </div>

      {/* Carte GPS */}
      {showGPS ? (
        <RouteTracker
          onRouteUpdate={(routeData) => {
            patchWalkRun({
              distanceKm: routeData.distance.toFixed(2),
              durationMin: Math.round(routeData.duration / 60),
              pauseMin: routeData.pauseTime.toFixed(1),
              route: routeData.route,
            });
            setGpsActive(false);
          }}
          onTrackingStart={() => setGpsActive(true)}
          onTrackingStop={() => setGpsActive(false)}
        />
      ) : (
        <>
          <div className={styles.focusInputsRow}>
            <label className={styles.focusField}>
              <span>⏱ Temps total</span>
              <div className={walkStyles.inputWrapper}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={walkRun.durationMin}
                  onChange={(e) => patchWalkRun({ durationMin: e.target.value })}
                  placeholder="30"
                />
                <span className={walkStyles.unit}>min</span>
              </div>
            </label>

            <label className={styles.focusField}>
              <span>📍 Distance</span>
              <div className={walkStyles.inputWrapper}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={walkRun.distanceKm}
                  onChange={(e) => patchWalkRun({ distanceKm: e.target.value })}
                  placeholder="5.0"
                />
                <span className={walkStyles.unit}>km</span>
              </div>
            </label>
          </div>

          {averagePace && (
            <div className={walkStyles.paceCard}>
              <span className={walkStyles.paceLabel}>Allure moyenne</span>
              <span className={walkStyles.paceValue}>{averagePace} <span className={walkStyles.paceUnit}>km/h</span></span>
            </div>
          )}

          <div className={walkStyles.pauseSection}>
            <div className={walkStyles.pauseTopRow}>
              <span className={walkStyles.pauseLabel}>⏸ Temps de pause</span>
              {pauseTimerRunning && (
                <span className={walkStyles.timerDisplay}>{formatTime(pauseTimerSeconds)}</span>
              )}
            </div>

            <div className={walkStyles.pauseControls}>
              <div className={walkStyles.inputWrapper}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={walkRun.pauseMin}
                  onChange={(e) => patchWalkRun({ pauseMin: e.target.value })}
                  placeholder="0"
                  disabled={pauseTimerRunning}
                />
                <span className={walkStyles.unit}>min</span>
              </div>
              <button
                type="button"
                className={walkStyles.timerButton}
                onClick={togglePauseTimer}
                data-running={pauseTimerRunning}
              >
                {pauseTimerRunning ? '⏹ Arrêter' : '▶ Démarrer'}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}