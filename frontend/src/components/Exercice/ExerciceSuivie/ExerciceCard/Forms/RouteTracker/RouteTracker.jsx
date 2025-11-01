import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./RouteTracker.module.css";

// Fix pour les icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Composant pour contrôles personnalisés
function MapControls({ onRecenter }) {
  const map = useMap();

  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();

  return (
    <div className={styles.mapControls}>
      <button onClick={zoomIn} className={styles.controlButton} title="Zoomer">
        +
      </button>
      <button onClick={zoomOut} className={styles.controlButton} title="Dézoomer">
        −
      </button>
      <button onClick={onRecenter} className={styles.controlButton} title="Me centrer">
        📍
      </button>
    </div>
  );
}

function MapUpdater({ center, route }) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.setView(center, 15);
    }
  }, [route, center, map]);

  return null;
}

export default function RouteTracker({ onRouteUpdate, onTrackingStart, onTrackingStop }) {
  const [tracking, setTracking] = useState(false);
  const [route, setRoute] = useState([]);
  const [center, setCenter] = useState([48.8566, 2.3522]); // Paris par défaut
  const [stats, setStats] = useState({ distance: 0, duration: 0, pauseTime: 0, moving: true });
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastMoveTimeRef = useRef(null);
  const pauseStartRef = useRef(null);
  const mapRef = useRef(null);

  const PAUSE_THRESHOLD = 30; // Secondes sans mouvement = pause (augmenté pour éviter fausses pauses)
  const MIN_MOVEMENT = 0.015; // km minimum (15m) pour considérer un mouvement (filtrage GPS)

  const recenterMap = () => {
    if (route.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  };

  // Calcul de distance entre deux points GPS (formule Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Obtenir la position initiale
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          setError(null);
        },
        (err) => {
          console.error("Erreur de géolocalisation:", err);
          setError("Impossible d'obtenir votre position. Vérifiez les autorisations.");
        }
      );
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  }, []);

  const startTracking = () => {
    if (!("geolocation" in navigator)) {
      setError("La géolocalisation n'est pas disponible");
      return;
    }

    setTracking(true);
    setRoute([]);
    setStats({ distance: 0, duration: 0, pauseTime: 0, moving: true });
    startTimeRef.current = Date.now();
    lastMoveTimeRef.current = Date.now();
    lastPositionRef.current = null;
    pauseStartRef.current = null;
    setError(null);

    if (onTrackingStart) onTrackingStart();

    // Mise à jour du chrono et détection pause
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const timeSinceLastMove = Math.floor((now - lastMoveTimeRef.current) / 1000);

      // Détection de pause automatique
      if (timeSinceLastMove >= PAUSE_THRESHOLD) {
        if (!pauseStartRef.current) {
          pauseStartRef.current = lastMoveTimeRef.current;
        }
        const pauseDuration = Math.floor((now - pauseStartRef.current) / 1000);
        setStats(prev => ({
          ...prev,
          duration: elapsed,
          pauseTime: pauseDuration,
          moving: false
        }));
      } else {
        pauseStartRef.current = null;
        setStats(prev => ({
          ...prev,
          duration: elapsed,
          moving: true
        }));
      }
    }, 1000);

    // Suivi GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };

        setRoute((prevRoute) => {
          const updatedRoute = [...prevRoute, newPoint];

          // Calculer la distance et détecter mouvement
          if (lastPositionRef.current) {
            const segmentDistance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              newPoint.lat,
              newPoint.lng
            );

            // Si mouvement significatif détecté
            if (segmentDistance >= MIN_MOVEMENT) {
              lastMoveTimeRef.current = Date.now();
              pauseStartRef.current = null;

              setStats(prev => ({
                ...prev,
                distance: prev.distance + segmentDistance,
                moving: true
                // pauseTime conservé (ne pas réinitialiser)
              }));
            }
          }

          lastPositionRef.current = newPoint;
          return updatedRoute;
        });
      },
      (err) => {
        console.error("Erreur de suivi GPS:", err);
        setError("Erreur de suivi GPS. Vérifiez vos autorisations.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTracking(false);

    if (onTrackingStop) onTrackingStop();

    // Envoyer les données au parent avec temps de pause
    if (route.length > 0 && onRouteUpdate) {
      const totalPauseMinutes = stats.pauseTime / 60;
      onRouteUpdate({
        route,
        distance: stats.distance,
        duration: stats.duration,
        pauseTime: totalPauseMinutes,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const activeDuration = stats.duration - stats.pauseTime;
  const currentPace = activeDuration > 0 && stats.distance > 0
    ? ((activeDuration / 60) / stats.distance).toFixed(2)
    : null;

  return (
    <div className={styles.routeTracker}>
      {!tracking ? (
        <div className={styles.startScreen}>
          <div className={styles.startIcon}>🏃‍♂️</div>
          <h3 className={styles.startTitle}>Prêt à démarrer ?</h3>
          <p className={styles.startDesc}>
            Active le GPS pour suivre automatiquement ton parcours, ta distance, ton temps et tes pauses.
          </p>
          <button
            type="button"
            className={`${styles.trackButton} ${styles.startButton}`}
            onClick={startTracking}
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
              ref={mapRef}
            >
              {/* Style Carto Voyager - moderne et épuré */}
              <TileLayer
                attribution='&copy; OpenStreetMap &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                maxZoom={20}
              />

              {route.length > 0 && (
                <>
                  {/* Point de départ */}
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

                  {/* Ombre du tracé */}
                  <Polyline
                    positions={route.map(p => [p.lat, p.lng])}
                    color="#000000"
                    weight={9}
                    opacity={0.08}
                  />

                  {/* Tracé principal - design épuré */}
                  <Polyline
                    positions={route.map(p => [p.lat, p.lng])}
                    pathOptions={{
                      color: '#667eea',
                      weight: 6,
                      opacity: 1,
                      lineJoin: 'round',
                      lineCap: 'round'
                    }}
                  />

                  {/* Point actuel avec animation pulse */}
                  <Circle
                    center={[route[route.length - 1].lat, route[route.length - 1].lng]}
                    radius={3}
                    pathOptions={{
                      color: '#667eea',
                      fillColor: '#667eea',
                      fillOpacity: 0.3,
                      weight: 0
                    }}
                  />

                  <Marker
                    position={[route[route.length - 1].lat, route[route.length - 1].lng]}
                    icon={L.divIcon({
                      className: 'current-position-marker',
                      html: `<div class="${styles.currentPositionPulse}">
                        <div class="${styles.currentPositionDot}"></div>
                      </div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                    })}
                  />
                </>
              )}

              <MapUpdater center={center} route={route} />
              <MapControls onRecenter={recenterMap} />
            </MapContainer>

            {/* Badge minimaliste */}
            <div className={styles.mapStats}>
              <div className={styles.statBadge}>
                <span className={styles.statIcon}>📍</span>
                <span className={styles.statText}>{stats.distance.toFixed(2)} km</span>
              </div>
              {!stats.moving && (
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
            {stats.pauseTime > 0 && (
              <div className={`${styles.statCard} ${styles.pauseCard}`}>
                <span className={styles.statLabel}>Pause</span>
                <span className={styles.statValue}>{formatTime(stats.pauseTime)}</span>
              </div>
            )}
          </div>

          <div className={styles.trackingIndicator}>
            <span className={stats.moving ? styles.pulse : styles.pausePulse}></span>
            {stats.moving ? 'En mouvement' : 'En pause'}
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={`${styles.trackButton} ${styles.stopButton}`}
              onClick={stopTracking}
            >
              ⏹ Terminer le suivi
            </button>
          </div>
        </>
      )}
    </div>
  );
}