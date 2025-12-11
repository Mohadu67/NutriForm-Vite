import { useState, useEffect, useRef } from "react";
import { storage } from '../../../../../../shared/utils/storage';
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./RouteTracker.module.css";
import logger from '../../../../../../shared/utils/logger.js';
import { useNotification } from '../../../../../../hooks/useNotification';

// Fix pour les icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Algorithme Douglas-Peucker pour simplifier les tracés longs
function simplifyRoute(points, tolerance = 0.00005) {
  if (points.length < 3) return points;

  const getPerpendicularDistance = (point, lineStart, lineEnd) => {
    const dx = lineEnd.lat - lineStart.lat;
    const dy = lineEnd.lng - lineStart.lng;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag === 0) return Math.sqrt(Math.pow(point.lat - lineStart.lat, 2) + Math.pow(point.lng - lineStart.lng, 2));

    const u = ((point.lat - lineStart.lat) * dx + (point.lng - lineStart.lng) * dy) / (mag * mag);
    const closestPoint = {
      lat: lineStart.lat + u * dx,
      lng: lineStart.lng + u * dy
    };

    return Math.sqrt(Math.pow(point.lat - closestPoint.lat, 2) + Math.pow(point.lng - closestPoint.lng, 2));
  };

  const douglasPeucker = (pts) => {
    if (pts.length < 3) return pts;

    let maxDist = 0;
    let maxIndex = 0;
    const end = pts.length - 1;

    for (let i = 1; i < end; i++) {
      const dist = getPerpendicularDistance(pts[i], pts[0], pts[end]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    if (maxDist > tolerance) {
      const left = douglasPeucker(pts.slice(0, maxIndex + 1));
      const right = douglasPeucker(pts.slice(maxIndex));
      return [...left.slice(0, -1), ...right];
    }

    return [pts[0], pts[end]];
  };

  return douglasPeucker(points);
}

// Composant pour contrôles personnalisés avec recentrage fonctionnel
function MapControls({ onRecenter, hasRoute }) {
  const map = useMapEvents({});

  const handleRecenter = () => {
    if (onRecenter) onRecenter(map);
  };

  return (
    <div className={styles.mapControls}>
      <button
        onClick={() => map.zoomIn()}
        className={styles.controlButton}
        title="Zoomer"
        type="button"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className={styles.controlButton}
        title="Dézoomer"
        type="button"
      >
        −
      </button>
      {hasRoute && (
        <button
          onClick={handleRecenter}
          className={`${styles.controlButton} ${styles.recenterButton}`}
          title="Recentrer sur le parcours"
          type="button"
        >
          📍
        </button>
      )}
    </div>
  );
}

function MapUpdater({ center, route }) {
  const map = useMapEvents({});

  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.setView(center, 15);
    }
  }, [route.length]); // Seulement quand la longueur change, pas à chaque point

  return null;
}

// Hook personnalisé pour vibrations
function useVibration() {
  return (pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
}

// Hook personnalisé pour localStorage
function useRouteStorage(storageKey) {
  const save = (data) => {
    try {
      storage.set(storageKey, JSON.stringify({
        ...data,
        savedAt: Date.now()
      }));
    } catch (error) {
      logger.error("Erreur sauvegarde:", error);
    }
  };

  const load = () => {
    try {
      const saved = storage.get(storageKey);
      if (!saved) return null;

      const data = JSON.parse(saved);
      const ageMinutes = (Date.now() - data.savedAt) / 1000 / 60;

      // Ignorer les sauvegardes de plus de 6 heures
      if (ageMinutes > 360) {
        storage.remove(storageKey);
        return null;
      }

      return data;
    } catch (error) {
      logger.error("Erreur chargement:", error);
      return null;
    }
  };

  const clear = () => {
    try {
      storage.remove(storageKey);
    } catch (error) {
      logger.error("Erreur suppression:", error);
    }
  };

  return { save, load, clear };
}

export default function RouteTracker({ onRouteUpdate, onTrackingStart, onTrackingStop }) {
  const [tracking, setTracking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [route, setRoute] = useState([]);
  const [center, setCenter] = useState([48.8566, 2.3522]);
  const [stats, setStats] = useState({ distance: 0, duration: 0, pauseTime: 0, moving: true });
  const [error, setError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const lastPositionRef = useRef(null);
  const pauseStartRef = useRef(null);
  const totalPauseTimeRef = useRef(0);
  const syncIntervalRef = useRef(null);

  const vibrate = useVibration();
  const storageHook = useRouteStorage('routeTracker_session');
  const notify = useNotification();

  const MIN_MOVEMENT = 0.010; // 10m - réduit pour plus de précision
  const MAX_ROUTE_POINTS = 1000; // Limite pour performances
  const SYNC_INTERVAL = 3000; // Sync toutes les 3 secondes

  // Vibration feedback
  const vibrateFeedback = (type) => {
    switch (type) {
      case 'start':
        vibrate([100, 50, 100]);
        break;
      case 'stop':
        vibrate([200]);
        break;
      case 'pause':
        vibrate([50, 50, 50]);
        break;
      case 'resume':
        vibrate([100]);
        break;
      default:
        break;
    }
  };

  // Calcul de distance (Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Recentrage avec map passée en argument
  const recenterMap = (map) => {
    if (route.length > 0 && map) {
      const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      vibrate([30]);
    }
  };

  // Sync temps réel avec le parent
  useEffect(() => {
    if (tracking && !paused && onRouteUpdate) {
      syncIntervalRef.current = setInterval(() => {
        const activeDuration = stats.duration - totalPauseTimeRef.current;
        onRouteUpdate({
          route,
          distance: stats.distance,
          duration: stats.duration,
          pauseTime: totalPauseTimeRef.current / 60,
          isLive: true // Indicateur que c'est une mise à jour en direct
        });
      }, SYNC_INTERVAL);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [tracking, paused, stats, route]);

  // Sauvegarde automatique
  useEffect(() => {
    if (tracking && route.length > 0) {
      storageHook.save({
        route,
        stats,
        totalPauseTime: totalPauseTimeRef.current,
        startTime: startTimeRef.current,
        paused
      });
    }
  }, [route, stats, tracking, paused]);

  // Vérifier parcours sauvegardé au montage
  useEffect(() => {
    const saved = storageHook.load();
    if (saved && saved.route && saved.route.length > 0) {
      setShowRecoveryPrompt(true);
    }
  }, []);

  // Obtenir position initiale
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          setGpsAccuracy(position.coords.accuracy);
          setError(null);
        },
        (err) => {
          logger.error("Erreur de géolocalisation:", err);
          setError("Impossible d'obtenir votre position. Vérifiez les autorisations.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000 // Accepter position jusqu'à 30s
        }
      );
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  }, []);

  const recoverSession = () => {
    const saved = storageHook.load();
    if (saved) {
      setRoute(saved.route || []);
      setStats(saved.stats || { distance: 0, duration: 0, pauseTime: 0, moving: true });
      totalPauseTimeRef.current = saved.totalPauseTime || 0;
      startTimeRef.current = saved.startTime || Date.now();
      setPaused(saved.paused || false);
      setShowRecoveryPrompt(false);

      // Redémarrer le tracking
      startTracking(true);
    }
  };

  const discardSession = () => {
    storageHook.clear();
    setShowRecoveryPrompt(false);
  };

  const startTracking = (isRecovery = false) => {
    if (!("geolocation" in navigator)) {
      setError("La géolocalisation n'est pas disponible");
      return;
    }

    setTracking(true);

    if (!isRecovery) {
      setRoute([]);
      setStats({ distance: 0, duration: 0, pauseTime: 0, moving: true });
      startTimeRef.current = Date.now();
      totalPauseTimeRef.current = 0;
      lastPositionRef.current = null;
      pauseStartRef.current = null;
      setPaused(false);
    }

    setError(null);
    vibrateFeedback('start');

    if (onTrackingStart) onTrackingStart();

    // Chronomètre
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);

      setStats(prev => ({
        ...prev,
        duration: elapsed,
        pauseTime: totalPauseTimeRef.current
      }));
    }, 1000);

    // Suivi GPS avec paramètres optimisés
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        setGpsAccuracy(accuracy);

        // Filtrer les points très imprécis (>50m)
        if (accuracy > 50) {
          logger.warn("GPS imprécis, point ignoré");
          return;
        }

        // Ignorer les points en pause
        if (paused) return;

        const newPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy
        };

        setRoute((prevRoute) => {
          let updatedRoute = [...prevRoute, newPoint];

          // Simplifier si trop de points
          if (updatedRoute.length > MAX_ROUTE_POINTS) {
            updatedRoute = simplifyRoute(updatedRoute, 0.00008);
          }

          // Calculer distance
          if (lastPositionRef.current) {
            const segmentDistance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              newPoint.lat,
              newPoint.lng
            );

            // Mouvement significatif
            if (segmentDistance >= MIN_MOVEMENT) {
              setStats(prev => ({
                ...prev,
                distance: prev.distance + segmentDistance,
                moving: true
              }));
            }
          }

          lastPositionRef.current = newPoint;
          return updatedRoute;
        });
      },
      (err) => {
        logger.error("Erreur de suivi GPS:", err);
        setError("Erreur de suivi GPS. Vérifiez vos autorisations.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000, // Accepter données jusqu'à 5s (économie batterie)
        timeout: 10000, // Timeout plus long pour éviter erreurs en intérieur
      }
    );
  };

  const togglePause = () => {
    if (paused) {
      // Reprendre
      if (pauseStartRef.current) {
        const pauseDuration = Math.floor((Date.now() - pauseStartRef.current) / 1000);
        totalPauseTimeRef.current += pauseDuration;
        pauseStartRef.current = null;
      }
      setPaused(false);
      vibrateFeedback('resume');
    } else {
      // Pause
      pauseStartRef.current = Date.now();
      setPaused(true);
      vibrateFeedback('pause');
    }
  };

  const stopTracking = async () => {
    // Confirmation avant arrêt
    const confirmed = await notify.confirm("Voulez-vous vraiment terminer ce parcours ? Les données seront sauvegardées.", {
      title: "Terminer le parcours"
    });
    if (!confirmed) {
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // Ajouter temps de pause en cours
    if (paused && pauseStartRef.current) {
      const pauseDuration = Math.floor((Date.now() - pauseStartRef.current) / 1000);
      totalPauseTimeRef.current += pauseDuration;
    }

    setTracking(false);
    vibrateFeedback('stop');

    if (onTrackingStop) onTrackingStop();

    // Envoyer données finales
    if (route.length > 0 && onRouteUpdate) {
      const simplifiedRoute = route.length > 100 ? simplifyRoute(route, 0.00008) : route;

      onRouteUpdate({
        route: simplifiedRoute,
        distance: stats.distance,
        duration: stats.duration,
        pauseTime: totalPauseTimeRef.current / 60,
        isLive: false
      });
    }

    // Nettoyer le stockage
    storageHook.clear();
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const activeDuration = stats.duration - totalPauseTimeRef.current;
  const currentPace = activeDuration > 0 && stats.distance > 0
    ? ((activeDuration / 60) / stats.distance).toFixed(2)
    : null;

  // Indicateur qualité GPS
  const getGpsQuality = (accuracy) => {
    if (!accuracy) return { text: "GPS initialisation...", color: "#9e9e9e", icon: "📡" };
    if (accuracy <= 10) return { text: "Excellent", color: "#4caf50", icon: "📶" };
    if (accuracy <= 25) return { text: "Bon", color: "#8bc34a", icon: "📶" };
    if (accuracy <= 50) return { text: "Moyen", color: "#ff9800", icon: "📶" };
    return { text: "Faible", color: "#f44336", icon: "📶" };
  };

  const gpsQuality = getGpsQuality(gpsAccuracy);

  return (
    <div className={styles.routeTracker}>
      {/* Prompt de récupération */}
      {showRecoveryPrompt && (
        <div className={styles.recoveryPrompt}>
          <div className={styles.recoveryContent}>
            <span className={styles.recoveryIcon}>🔄</span>
            <h4>Parcours en cours détecté</h4>
            <p>Un parcours non terminé a été trouvé. Voulez-vous le reprendre ?</p>
            <div className={styles.recoveryButtons}>
              <button
                type="button"
                className={styles.recoverButton}
                onClick={recoverSession}
              >
                ✅ Reprendre
              </button>
              <button
                type="button"
                className={styles.discardButton}
                onClick={discardSession}
              >
                ❌ Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {!tracking ? (
        <div className={styles.startScreen}>
          <div className={styles.startIcon}>🏃‍♂️</div>
          <h3 className={styles.startTitle}>Prêt à démarrer ?</h3>
          <p className={styles.startDesc}>
            Suivi GPS intelligent avec sauvegarde automatique, détection de pause et synchronisation en temps réel.
          </p>

          {/* Indicateur GPS avant démarrage */}
          {gpsAccuracy && (
            <div className={styles.preStartGps}>
              <span style={{ color: gpsQuality.color }}>
                {gpsQuality.icon} Signal GPS: {gpsQuality.text} ({Math.round(gpsAccuracy)}m)
              </span>
            </div>
          )}

          <button
            type="button"
            className={`${styles.trackButton} ${styles.startButton}`}
            onClick={() => startTracking(false)}
          >
            🚀 Démarrer le suivi GPS
          </button>
        </div>
      ) : (
        <>
          <div className={styles.mapContainer}>
            <MapContainer
              center={center}
              zoom={15}
              className={styles.map}
              style={{ height: "400px", width: "100%", borderRadius: "20px" }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                maxZoom={20}
              />

              {route.length > 0 && (
                <>
                  <Marker
                    position={[route[0].lat, route[0].lng]}
                    icon={L.divIcon({
                      className: 'start-marker',
                      html: `<div style="
                        width: 32px;
                        height: 32px;
                        background: linear-gradient(135deg, #4CAF50, #45a049);
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.6);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        color: white;
                      ">🏁</div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16]
                    })}
                  />

                  <Polyline
                    positions={route.map(p => [p.lat, p.lng])}
                    color="#000000"
                    weight={9}
                    opacity={0.08}
                  />

                  <Polyline
                    positions={route.map(p => [p.lat, p.lng])}
                    pathOptions={{
                      color: paused ? '#ff9800' : '#667eea',
                      weight: 6,
                      opacity: 1,
                      lineJoin: 'round',
                      lineCap: 'round'
                    }}
                  />

                  <Circle
                    center={[route[route.length - 1].lat, route[route.length - 1].lng]}
                    radius={gpsAccuracy || 10}
                    pathOptions={{
                      color: gpsQuality.color,
                      fillColor: gpsQuality.color,
                      fillOpacity: 0.1,
                      weight: 1,
                      opacity: 0.3
                    }}
                  />

                  <Marker
                    position={[route[route.length - 1].lat, route[route.length - 1].lng]}
                    icon={L.divIcon({
                      className: 'current-position-marker',
                      html: `<div class="${styles.currentPositionPulse}">
                        <div class="${paused ? styles.pausedPositionDot : styles.currentPositionDot}"></div>
                      </div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                    })}
                  />
                </>
              )}

              <MapUpdater center={center} route={route} />
              <MapControls onRecenter={recenterMap} hasRoute={route.length > 0} />
            </MapContainer>

            {/* Badges sur la carte */}
            <div className={styles.mapStats}>
              <div className={styles.statBadge}>
                <span className={styles.statIcon}>📍</span>
                <span className={styles.statText}>{stats.distance.toFixed(2)} km</span>
              </div>
              <div
                className={styles.statBadge}
                style={{
                  background: `rgba(${gpsQuality.color === '#4caf50' ? '76, 175, 80' : gpsQuality.color === '#ff9800' ? '255, 152, 0' : '244, 67, 54'}, 0.95)`,
                  color: 'white'
                }}
              >
                <span className={styles.statIcon}>{gpsQuality.icon}</span>
                <span className={styles.statText} style={{ color: 'white' }}>{Math.round(gpsAccuracy || 0)}m</span>
              </div>
              {paused && (
                <div className={`${styles.statBadge} ${styles.pauseBadge}`}>
                  <span className={styles.statIcon}>⏸</span>
                  <span className={styles.statText}>Pause</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className={styles.error}>⚠️ {error}</div>
          )}

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Distance</span>
              <span className={styles.statValue}>
                {stats.distance.toFixed(2)} <span className={styles.statUnit}>km</span>
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Temps actif</span>
              <span className={styles.statValue}>{formatTime(activeDuration)}</span>
            </div>
            {currentPace && (
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Allure</span>
                <span className={styles.statValue}>
                  {currentPace} <span className={styles.statUnit}>min/km</span>
                </span>
              </div>
            )}
            {totalPauseTimeRef.current > 0 && (
              <div className={`${styles.statCard} ${styles.pauseCard}`}>
                <span className={styles.statLabel}>Pause</span>
                <span className={styles.statValue}>{formatTime(totalPauseTimeRef.current)}</span>
              </div>
            )}
          </div>

          <div className={styles.trackingIndicator}>
            <span className={paused ? styles.pausePulse : styles.pulse}></span>
            {paused ? 'En pause' : 'En mouvement'}
            <span className={styles.autoSave}>💾 Sauvegarde auto</span>
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={`${styles.trackButton} ${paused ? styles.resumeButton : styles.pauseButton}`}
              onClick={togglePause}
            >
              {paused ? '▶ Reprendre' : '⏸ Pause'}
            </button>
            <button
              type="button"
              className={`${styles.trackButton} ${styles.stopButton}`}
              onClick={stopTracking}
            >
              ⏹ Terminer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
