import { useEffect, useRef, useMemo, useState } from "react";
import styles from "./MuscleHeatmap.module.css";
import bodySvgMarkup from "../../../components/Exercice/DynamiChoice/BodyPicker/body.svg?raw";
import { CalendarIcon, ClockIcon, ActivityIcon, DumbbellIcon } from "../../../components/Icons/GlobalIcons";

// Mapping des noms de muscles vers les zones du SVG
const MUSCLE_TO_ZONE = {
  pectoraux: "pectoraux", chest: "pectoraux", pecs: "pectoraux",
  epaules: "epaules", épaules: "epaules", shoulders: "epaules", deltoides: "epaules", deltoïdes: "epaules",
  biceps: "biceps", triceps: "triceps", "avant-bras": "avant-bras", forearms: "avant-bras",
  abdos: "abdos-centre", abs: "abdos-centre", "abdos-centre": "abdos-centre",
  "abdos-lateraux": "abdos-lateraux", obliques: "abdos-lateraux", core: "abdos-centre",
  dos: "dos-inferieur", back: "dos-inferieur", "dos-superieur": "dos-superieur",
  "dos-inferieur": "dos-inferieur", "dos-lats": "dos-inferieur", lats: "dos-inferieur",
  traps: "dos-superieur", trapèzes: "dos-superieur", rhomboides: "dos-superieur",
  quadriceps: "cuisses-externes", quads: "cuisses-externes", cuisses: "cuisses-externes",
  "cuisses-externes": "cuisses-externes", "cuisses-internes": "cuisses-internes",
  ischio: "cuisses-internes", ischios: "cuisses-internes", hamstrings: "cuisses-internes",
  fessiers: "fessiers", glutes: "fessiers", gluteus: "fessiers",
  mollets: "mollets", calves: "mollets",
};

const ZONE_LABELS = {
  pectoraux: "Pectoraux", epaules: "Épaules", biceps: "Biceps", triceps: "Triceps",
  "avant-bras": "Avant-bras", "abdos-centre": "Abdos", "abdos-lateraux": "Obliques",
  "dos-superieur": "Haut du dos", "dos-inferieur": "Bas du dos", fessiers: "Fessiers",
  "cuisses-externes": "Quadriceps", "cuisses-internes": "Ischio-jambiers", mollets: "Mollets",
};

const INTENSITY_COLORS = [
  { fill: "#b8e6cf", stroke: "#7bc9a3" },
  { fill: "#8fd9b6", stroke: "#5cb88a" },
  { fill: "#f7d794", stroke: "#f5b041" },
  { fill: "#f5a962", stroke: "#e67e22" },
  { fill: "#e74c3c", stroke: "#c0392b" },
];

// Muscles secondaires pour le calcul
const SECONDARY_MUSCLES = {
  pectoraux: ["triceps", "epaules"],
  "dos-lats": ["biceps", "avant-bras"],
  "dos-superieur": ["biceps", "epaules"],
  "dos-inferieur": ["biceps"],
  dos: ["biceps", "avant-bras"],
  epaules: ["triceps"],
  quadriceps: ["fessiers", "ischio"],
  fessiers: ["quadriceps", "ischio"],
  ischio: ["fessiers"],
  biceps: [], triceps: [],
};

// Utilitaires de date
function getWeekBounds(weeksAgo = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = début de semaine

  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - diff - (weeksAgo * 7));
  startOfThisWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfThisWeek);
  endOfWeek.setDate(startOfThisWeek.getDate() + 7);

  return { start: startOfThisWeek, end: endOfWeek };
}

function formatSessionDate(session) {
  const date = session?.startedAt || session?.endedAt || session?.createdAt;
  if (!date) return "Date inconnue";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export function MuscleHeatmap({ sessions = [], muscleStats: externalStats = null }) {
  const containerRef = useRef(null);
  const svgRootRef = useRef(null);
  const [isDark, setIsDark] = useState(false);
  const [filter, setFilter] = useState("week-0"); // week-0, week-1, week-2, all, session-{id}
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Détecter le dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.body.classList.contains('dark') ||
                         document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Sessions triées par date (plus récentes en premier)
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dateA = new Date(a?.startedAt || a?.endedAt || a?.createdAt || 0);
      const dateB = new Date(b?.startedAt || b?.endedAt || b?.createdAt || 0);
      return dateB - dateA;
    });
  }, [sessions]);

  // Filtrer les sessions selon le filtre sélectionné
  const filteredSessions = useMemo(() => {
    if (filter === "all") return sortedSessions;

    if (filter.startsWith("session-")) {
      const sessionId = filter.replace("session-", "");
      return sortedSessions.filter(s => (s._id || s.id) === sessionId);
    }

    if (filter.startsWith("week-")) {
      const weeksAgo = parseInt(filter.replace("week-", ""), 10);
      const { start, end } = getWeekBounds(weeksAgo);
      return sortedSessions.filter(s => {
        const date = new Date(s?.startedAt || s?.endedAt || s?.createdAt || 0);
        return date >= start && date < end;
      });
    }

    return sortedSessions;
  }, [sortedSessions, filter]);

  // Calculer les stats musculaires pour les sessions filtrées
  const muscleStats = useMemo(() => {
    // Si des stats externes sont fournies et pas de filtre spécifique, les utiliser
    if (externalStats && filter === "all" && !sessions.length) {
      return externalStats;
    }

    if (!filteredSessions.length) return {};

    const muscleCount = {};
    const addMuscle = (muscle, weight = 1) => {
      const key = String(muscle || "").toLowerCase().trim();
      if (key && key !== "undefined" && key !== "null") {
        muscleCount[key] = (muscleCount[key] || 0) + weight;
      }
    };

    const addMuscleWithSecondaries = (primaryMuscle) => {
      const key = String(primaryMuscle || "").toLowerCase().trim();
      if (!key) return;
      addMuscle(key, 1);
      const secondaries = SECONDARY_MUSCLES[key] || [];
      secondaries.forEach((secondary) => addMuscle(secondary, 0.5));
    };

    filteredSessions.forEach((session) => {
      const entries = session?.entries || session?.items || session?.exercises || [];
      entries.forEach((entry) => {
        if (!entry) return;

        // Priorité 1: Utiliser primaryMuscle si défini (le plus précis)
        if (entry.primaryMuscle) {
          addMuscle(entry.primaryMuscle, 1);
          // Ajouter les muscles secondaires avec un poids réduit
          const secondaries = entry.secondaryMuscles || [];
          if (Array.isArray(secondaries)) {
            secondaries.forEach((m) => addMuscle(m, 0.3));
          }
          return;
        }

        // Priorité 2: Utiliser muscle ou muscleGroup avec les secondaires calculés
        if (entry.muscle) { addMuscleWithSecondaries(entry.muscle); return; }
        if (entry.muscleGroup) { addMuscleWithSecondaries(entry.muscleGroup); return; }

        // Fallback: Utiliser le tableau muscles (ancien comportement)
        const entryMuscles = entry.muscles;
        if (Array.isArray(entryMuscles) && entryMuscles.length > 0) {
          // Prendre le premier comme principal, les autres comme secondaires
          addMuscle(entryMuscles[0], 1);
          entryMuscles.slice(1).forEach((m) => addMuscle(m, 0.3));
          return;
        }
      });
    });

    Object.keys(muscleCount).forEach((key) => {
      muscleCount[key] = Math.round(muscleCount[key] * 10) / 10;
    });

    return muscleCount;
  }, [filteredSessions, externalStats, filter, sessions.length]);

  // Calculer l'intensité pour chaque zone
  const zoneIntensities = useMemo(() => {
    const zones = {};
    let maxCount = 0;
    Object.entries(muscleStats).forEach(([muscle, count]) => {
      const zone = MUSCLE_TO_ZONE[muscle.toLowerCase()];
      if (zone) {
        zones[zone] = (zones[zone] || 0) + count;
        maxCount = Math.max(maxCount, zones[zone]);
      }
    });
    const normalized = {};
    Object.entries(zones).forEach(([zone, count]) => {
      const ratio = maxCount > 0 ? count / maxCount : 0;
      const level = Math.min(4, Math.floor(ratio * 5));
      normalized[zone] = { count, level, color: INTENSITY_COLORS[level] };
    });
    return normalized;
  }, [muscleStats]);

  const topMuscles = useMemo(() => {
    return Object.entries(zoneIntensities)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([zone, data]) => ({ zone, ...data }));
  }, [zoneIntensities]);

  const getZoneFromSvgElem = (raw) => {
    if (!raw) return null;
    const low = raw.toLowerCase();
    const lowNorm = low.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s._-]+/g, "");
    if (low.includes("chest") || low.includes("pec") || lowNorm.includes("pectoraux")) return "pectoraux";
    if (low.includes("shoulder") || low.includes("epaule") || low.includes("deltoid") || lowNorm.includes("epaules")) return "epaules";
    if (low.includes("oblique") || lowNorm.includes("obliques")) return "abdos-lateraux";
    if (low.includes("abs") || low.includes("abdo") || low.includes("abdominal")) return "abdos-centre";
    if (low.includes("bicep")) return "biceps";
    if (low.includes("tricep")) return "triceps";
    if (low.includes("forearm") || low.includes("avant-bras") || lowNorm.includes("avantbras")) return "avant-bras";
    if (low.includes("quad") || low.includes("cuisse")) return "cuisses-externes";
    if (low.includes("hamstring") || low.includes("ischio")) return "cuisses-internes";
    if (low.includes("calf") || low.includes("calves") || low.includes("mollet")) return "mollets";
    if (low.includes("glute") || low.includes("fess")) return "fessiers";
    if (low.includes("trap")) return "dos-superieur";
    if (low.includes("back") || low.includes("dos") || low.includes("lat")) return "dos-inferieur";
    return null;
  };

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    host.innerHTML = bodySvgMarkup;
    svgRootRef.current = host.querySelector("svg");
    const svg = svgRootRef.current;
    if (!svg) return;

    try {
      if (!svg.hasAttribute("viewBox")) {
        const b = svg.getBBox();
        if (b?.width && b?.height) svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
      }
    } catch { /* ignore */ }
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const inactiveFill = isDark ? "rgba(80, 80, 80, 0.4)" : "rgba(52, 72, 94, 0.15)";
    const inactiveStroke = isDark ? "rgba(100, 100, 100, 0.6)" : "rgba(38, 48, 68, 0.35)";

    const muscleNodes = svg.querySelectorAll("[data-elem]");
    muscleNodes.forEach((node) => {
      const dataElem = node.getAttribute("data-elem") || "";
      const matchedZone = getZoneFromSvgElem(dataElem);
      if (matchedZone && zoneIntensities[matchedZone]) {
        const { color } = zoneIntensities[matchedZone];
        node.style.setProperty("fill", color.fill, "important");
        node.style.setProperty("stroke", color.stroke, "important");
        node.style.setProperty("stroke-width", "1.5", "important");
      } else {
        node.style.setProperty("fill", inactiveFill, "important");
        node.style.setProperty("stroke", inactiveStroke, "important");
        node.style.setProperty("stroke-width", "0.8", "important");
      }
    });

    return () => { svgRootRef.current = null; host.innerHTML = ""; };
  }, [zoneIntensities, isDark]);

  const hasData = Object.keys(zoneIntensities).length > 0;

  // Options de période
  const periodOptions = [
    { value: "week-0", label: "Cette semaine", shortLabel: "Semaine", icon: CalendarIcon },
    { value: "week-1", label: "Sem. dernière", shortLabel: "-1 sem.", icon: ClockIcon },
    { value: "week-2", label: "Il y a 2 sem.", shortLabel: "-2 sem.", icon: ClockIcon },
    { value: "all", label: "Tout", shortLabel: "Tout", icon: ActivityIcon },
  ];

  return (
    <div className={styles.container}>
      {/* Filtres */}
      <div className={styles.filters}>
        <div className={styles.periodPills}>
          {periodOptions.map((option) => {
            const Icon = option.icon;
            const isActive = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.pillBtn} ${isActive ? styles.pillActive : ""}`}
                onClick={() => setFilter(option.value)}
                title={option.label}
              >
                <Icon size={14} />
                <span className={styles.pillLabel}>{option.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {sortedSessions.length > 0 && (
          <select
            className={`${styles.pillBtn} ${filter.startsWith("session-") ? styles.pillActive : ""}`}
            value={filter.startsWith("session-") ? filter : ""}
            onChange={(e) => e.target.value && setFilter(e.target.value)}
          >
            <option value="">Séance</option>
            {sortedSessions.slice(0, 8).map((session) => (
              <option key={session._id || session.id} value={`session-${session._id || session.id}`}>
                {formatSessionDate(session)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.bodyWrapper}>
        <div ref={containerRef} className={styles.svgContainer} />
      </div>

      {hasData ? (
        <div className={styles.legend}>
          <h4 className={styles.legendTitle}>Muscles les plus travaillés</h4>
          <div className={styles.topMuscles}>
            {topMuscles.map((muscle, index) => (
              <div key={muscle.zone} className={styles.muscleItem}>
                <span className={styles.muscleRank}>{index + 1}</span>
                <span className={styles.muscleName}>{ZONE_LABELS[muscle.zone] || muscle.zone}</span>
                <span className={styles.muscleCount}>{muscle.count % 1 === 0 ? muscle.count : muscle.count.toFixed(1)} pts</span>
              </div>
            ))}
          </div>
          <div className={styles.intensityScale}>
            <span className={styles.scaleLabel}>Intensité</span>
            <div className={styles.scaleBar}>
              {INTENSITY_COLORS.map((color, i) => (
                <div key={i} className={styles.scaleStep} style={{ background: color.fill }} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>{filter === "all" ? "Complète des séances pour voir ta répartition musculaire" : "Aucune séance sur cette période"}</p>
        </div>
      )}
    </div>
  );
}

export default MuscleHeatmap;
