import { useEffect, useRef, useMemo, useState } from "react";
import styles from "./MuscleHeatmap.module.css";
import bodySvgMarkup from "../../../components/Exercice/DynamiChoice/BodyPicker/body.svg?raw";

// Mapping des noms de muscles vers les zones du SVG
const MUSCLE_TO_ZONE = {
  // Pectoraux
  pectoraux: "pectoraux",
  chest: "pectoraux",
  pecs: "pectoraux",

  // Épaules
  epaules: "epaules",
  épaules: "epaules",
  shoulders: "epaules",
  deltoides: "epaules",
  deltoïdes: "epaules",

  // Bras
  biceps: "biceps",
  triceps: "triceps",
  "avant-bras": "avant-bras",
  forearms: "avant-bras",

  // Abdos
  abdos: "abdos-centre",
  abs: "abdos-centre",
  "abdos-centre": "abdos-centre",
  "abdos-lateraux": "abdos-lateraux",
  obliques: "abdos-lateraux",
  core: "abdos-centre",

  // Dos
  dos: "dos-inferieur",
  back: "dos-inferieur",
  "dos-superieur": "dos-superieur",
  "dos-inferieur": "dos-inferieur",
  "dos-lats": "dos-inferieur",
  lats: "dos-inferieur",
  traps: "dos-superieur",
  trapèzes: "dos-superieur",
  rhomboides: "dos-superieur",

  // Jambes
  quadriceps: "cuisses-externes",
  quads: "cuisses-externes",
  cuisses: "cuisses-externes",
  "cuisses-externes": "cuisses-externes",
  "cuisses-internes": "cuisses-internes",
  ischio: "cuisses-internes",
  ischios: "cuisses-internes",
  hamstrings: "cuisses-internes",

  // Fessiers
  fessiers: "fessiers",
  glutes: "fessiers",
  gluteus: "fessiers",

  // Mollets
  mollets: "mollets",
  calves: "mollets",
};

// Couleurs pour l'intensité (du moins au plus travaillé) - Couleurs solides et visibles
const INTENSITY_COLORS = [
  { fill: "#b8e6cf", stroke: "#7bc9a3" },   // Vert clair
  { fill: "#8fd9b6", stroke: "#5cb88a" },   // Vert moyen
  { fill: "#f7d794", stroke: "#f5b041" },   // Jaune/Orange clair
  { fill: "#f5a962", stroke: "#e67e22" },   // Orange
  { fill: "#e74c3c", stroke: "#c0392b" },   // Rouge
];

export function MuscleHeatmap({ muscleStats = {} }) {
  const containerRef = useRef(null);
  const svgRootRef = useRef(null);
  const [isDark, setIsDark] = useState(false);

  // Détecter le dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.body.classList.contains('dark') ||
                         document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Observer les changements de classe
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Calculer l'intensité pour chaque zone
  const zoneIntensities = useMemo(() => {
    const zones = {};
    let maxCount = 0;

    // Compter par zone
    Object.entries(muscleStats).forEach(([muscle, count]) => {
      const zone = MUSCLE_TO_ZONE[muscle.toLowerCase()];
      if (zone) {
        zones[zone] = (zones[zone] || 0) + count;
        maxCount = Math.max(maxCount, zones[zone]);
      }
    });

    // Normaliser en niveaux d'intensité (0-4)
    const normalized = {};
    Object.entries(zones).forEach(([zone, count]) => {
      const ratio = maxCount > 0 ? count / maxCount : 0;
      const level = Math.min(4, Math.floor(ratio * 5));
      normalized[zone] = { count, level, color: INTENSITY_COLORS[level] };
    });

    return normalized;
  }, [muscleStats]);

  // Top 3 muscles pour la légende
  const topMuscles = useMemo(() => {
    return Object.entries(zoneIntensities)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([zone, data]) => ({ zone, ...data }));
  }, [zoneIntensities]);

  // Fonction pour mapper un data-elem SVG vers une zone (même logique que BodyPicker)
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

    // Configurer le SVG
    try {
      if (!svg.hasAttribute("viewBox")) {
        const b = svg.getBBox();
        if (b?.width && b?.height) {
          svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
        }
      }
    } catch (e) {
      // Ignore
    }
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Couleurs pour zones inactives - gris dans les deux modes
    const inactiveFill = isDark ? "rgba(80, 80, 80, 0.4)" : "rgba(52, 72, 94, 0.15)";
    const inactiveStroke = isDark ? "rgba(100, 100, 100, 0.6)" : "rgba(38, 48, 68, 0.35)";

    // Appliquer les couleurs aux zones musculaires (tous les muscles travaillés)
    const muscleNodes = svg.querySelectorAll("[data-elem]");
    muscleNodes.forEach((node) => {
      const dataElem = node.getAttribute("data-elem") || "";
      const matchedZone = getZoneFromSvgElem(dataElem);

      // Colorier si la zone a été travaillée (avec son intensité réelle)
      if (matchedZone && zoneIntensities[matchedZone]) {
        const { color } = zoneIntensities[matchedZone];
        node.style.setProperty("fill", color.fill, "important");
        node.style.setProperty("stroke", color.stroke, "important");
        node.style.setProperty("stroke-width", "1.5", "important");
      } else {
        // Zone non travaillée
        node.style.setProperty("fill", inactiveFill, "important");
        node.style.setProperty("stroke", inactiveStroke, "important");
        node.style.setProperty("stroke-width", "0.8", "important");
      }
    });

    return () => {
      svgRootRef.current = null;
      host.innerHTML = "";
    };
  }, [zoneIntensities, isDark]);

  const ZONE_LABELS = {
    pectoraux: "Pectoraux",
    epaules: "Épaules",
    biceps: "Biceps",
    triceps: "Triceps",
    "avant-bras": "Avant-bras",
    "abdos-centre": "Abdos",
    "abdos-lateraux": "Obliques",
    "dos-superieur": "Haut du dos",
    "dos-inferieur": "Bas du dos",
    fessiers: "Fessiers",
    "cuisses-externes": "Quadriceps",
    "cuisses-internes": "Ischio-jambiers",
    mollets: "Mollets",
  };

  const hasData = Object.keys(zoneIntensities).length > 0;

  return (
    <div className={styles.container}>
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
                <span className={styles.muscleCount}>{muscle.count} exo{muscle.count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
          <div className={styles.intensityScale}>
            <span className={styles.scaleLabel}>Intensité</span>
            <div className={styles.scaleBar}>
              {INTENSITY_COLORS.map((color, i) => (
                <div
                  key={i}
                  className={styles.scaleStep}
                  style={{ background: color.fill }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Complète des séances pour voir ta répartition musculaire</p>
        </div>
      )}
    </div>
  );
}

export default MuscleHeatmap;
