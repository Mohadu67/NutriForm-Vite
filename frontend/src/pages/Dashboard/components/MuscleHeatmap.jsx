import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import styles from "./MuscleHeatmap.module.css";
import bodySvgMarkup from "../../../components/Exercice/DynamiChoice/BodyPicker/body.svg?raw";
import { getBodyCompositionSummary } from "../../../shared/api/bodyComposition";

// ─── Mapping muscles → zones SVG ────────────────────────────────────
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

// ─── Palettes ────────────────────────────────────────────────────────
const EFFORT_COLORS = [
  { fill: "#b8e6cf", stroke: "#7bc9a3" },
  { fill: "#8fd9b6", stroke: "#5cb88a" },
  { fill: "#f7d794", stroke: "#f5b041" },
  { fill: "#f5a962", stroke: "#e67e22" },
  { fill: "#e74c3c", stroke: "#c0392b" },
];

const GAINS_COLORS = [
  { fill: "#d1ebe3", stroke: "#b8ddd1" },
  { fill: "#b8ddd1", stroke: "#9fcfbf" },
  { fill: "#9fcfbf", stroke: "#86c1ad" },
  { fill: "#86c1ad", stroke: "#6db39b" },
  { fill: "#6db39b", stroke: "#549589" },
];

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

// ─── Utils ───────────────────────────────────────────────────────────
function getWeekBounds(weeksAgo = 0) {
  const now = new Date();
  const diff = (now.getDay() || 7) - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff - weeksAgo * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

// ─── Composant ───────────────────────────────────────────────────────
export function MuscleHeatmap({ sessions = [], muscleStats: externalStats = null }) {
  const containerRef = useRef(null);
  const svgRootRef = useRef(null);
  const [isDark, setIsDark] = useState(false);
  const [weeksAgo, setWeeksAgo] = useState(0);
  const [mode, setMode] = useState("effort");
  const [bodyComp, setBodyComp] = useState(null);
  const [bodyCompLoading, setBodyCompLoading] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const check = () => setIsDark(document.body.classList.contains("dark") || document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Fetch body composition for gains mode
  useEffect(() => {
    if (mode !== "gains") return;
    let cancelled = false;
    setBodyCompLoading(true);
    getBodyCompositionSummary((weeksAgo + 1) * 7)
      .then(data => { if (!cancelled) setBodyComp(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBodyCompLoading(false); });
    return () => { cancelled = true; };
  }, [mode, weeksAgo]);

  // Sorted sessions
  const sortedSessions = useMemo(() =>
    [...sessions].sort((a, b) =>
      new Date(b?.startedAt || b?.endedAt || b?.createdAt || 0) -
      new Date(a?.startedAt || a?.endedAt || a?.createdAt || 0)
    ), [sessions]);

  // Filtered by week
  const filteredSessions = useMemo(() => {
    const { start, end } = getWeekBounds(weeksAgo);
    return sortedSessions.filter(s => {
      const d = new Date(s?.startedAt || s?.endedAt || s?.createdAt || 0);
      return d >= start && d < end;
    });
  }, [sortedSessions, weeksAgo]);

  // Muscle stats (effort)
  const muscleStats = useMemo(() => {
    if (externalStats && !sessions.length) return externalStats;
    if (!filteredSessions.length) return {};
    const counts = {};
    const add = (m, w = 1) => {
      const k = String(m || "").toLowerCase().trim();
      if (k && k !== "undefined" && k !== "null") counts[k] = (counts[k] || 0) + w;
    };
    const addWithSecondaries = (primary) => {
      const k = String(primary || "").toLowerCase().trim();
      if (!k) return;
      add(k, 1);
      (SECONDARY_MUSCLES[k] || []).forEach(s => add(s, 0.5));
    };
    filteredSessions.forEach(session => {
      (session?.entries || session?.items || session?.exercises || []).forEach(e => {
        if (!e) return;
        if (e.primaryMuscle) { add(e.primaryMuscle, 1); (e.secondaryMuscles || []).forEach(m => add(m, 0.3)); }
        else if (e.muscle) addWithSecondaries(e.muscle);
        else if (e.muscleGroup) addWithSecondaries(e.muscleGroup);
        else if (Array.isArray(e.muscles) && e.muscles.length) { add(e.muscles[0], 1); e.muscles.slice(1).forEach(m => add(m, 0.3)); }
      });
    });
    Object.keys(counts).forEach(k => { counts[k] = Math.round(counts[k] * 10) / 10; });
    return counts;
  }, [filteredSessions, externalStats, sessions.length]);

  // Zone intensities
  const effortZones = useMemo(() => {
    const zones = {};
    let max = 0;
    Object.entries(muscleStats).forEach(([muscle, count]) => {
      const zone = MUSCLE_TO_ZONE[muscle.toLowerCase()];
      if (zone) { zones[zone] = (zones[zone] || 0) + count; max = Math.max(max, zones[zone]); }
    });
    const out = {};
    Object.entries(zones).forEach(([zone, count]) => {
      const level = Math.min(4, Math.floor((max > 0 ? count / max : 0) * 5));
      out[zone] = { count, level, color: EFFORT_COLORS[level] };
    });
    return out;
  }, [muscleStats]);

  const gainsZones = useMemo(() => {
    if (!bodyComp?.muscleGain?.byZone) return {};
    const byZone = bodyComp.muscleGain.byZone;
    let max = 0;
    const zones = {};
    Object.entries(byZone).forEach(([zone, data]) => {
      if (data.gainG > 0) { zones[zone] = data; max = Math.max(max, data.gainG); }
    });
    const out = {};
    Object.entries(zones).forEach(([zone, data]) => {
      const level = Math.min(4, Math.floor((max > 0 ? data.gainG / max : 0) * 5));
      out[zone] = { count: data.gainG, level, color: GAINS_COLORS[level], gainG: data.gainG };
    });
    return out;
  }, [bodyComp]);

  const zoneIntensities = mode === "gains" ? gainsZones : effortZones;
  const colorPalette = mode === "gains" ? GAINS_COLORS : EFFORT_COLORS;
  const isGains = mode === "gains";

  const topMuscles = useMemo(() =>
    Object.entries(zoneIntensities)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([zone, data]) => ({ zone, ...data })),
    [zoneIntensities]);

  // SVG zone detection
  const getZone = (raw) => {
    if (!raw) return null;
    const l = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s._-]+/g, "");
    if (l.includes("chest") || l.includes("pec") || l.includes("pectoraux")) return "pectoraux";
    if (l.includes("shoulder") || l.includes("epaule") || l.includes("deltoid")) return "epaules";
    if (l.includes("oblique")) return "abdos-lateraux";
    if (l.includes("abs") || l.includes("abdo")) return "abdos-centre";
    if (l.includes("bicep")) return "biceps";
    if (l.includes("tricep")) return "triceps";
    if (l.includes("forearm") || l.includes("avantbras")) return "avant-bras";
    if (l.includes("quad") || l.includes("cuisse")) return "cuisses-externes";
    if (l.includes("hamstring") || l.includes("ischio")) return "cuisses-internes";
    if (l.includes("calf") || l.includes("calves") || l.includes("mollet")) return "mollets";
    if (l.includes("glute") || l.includes("fess")) return "fessiers";
    if (l.includes("trap")) return "dos-superieur";
    if (l.includes("back") || l.includes("dos") || l.includes("lat")) return "dos-inferieur";
    return null;
  };

  // Apply colors to SVG
  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    host.innerHTML = bodySvgMarkup;
    svgRootRef.current = host.querySelector("svg");
    const svg = svgRootRef.current;
    if (!svg) return;

    try { if (!svg.hasAttribute("viewBox")) { const b = svg.getBBox(); if (b?.width && b?.height) svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`); } } catch {}
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const inFill = isDark ? "rgba(80,80,80,0.25)" : "rgba(52,72,94,0.08)";
    const inStroke = isDark ? "rgba(100,100,100,0.4)" : "rgba(38,48,68,0.2)";

    svg.querySelectorAll("[data-elem]").forEach(node => {
      const zone = getZone(node.getAttribute("data-elem") || "");
      if (zone && zoneIntensities[zone]) {
        const { color } = zoneIntensities[zone];
        node.style.setProperty("fill", color.fill, "important");
        node.style.setProperty("stroke", color.stroke, "important");
        node.style.setProperty("stroke-width", "1.5", "important");
      } else {
        node.style.setProperty("fill", inFill, "important");
        node.style.setProperty("stroke", inStroke, "important");
        node.style.setProperty("stroke-width", "0.5", "important");
      }
    });

    return () => { svgRootRef.current = null; host.innerHTML = ""; };
  }, [zoneIntensities, isDark]);

  const hasData = Object.keys(zoneIntensities).length > 0;
  const weekLabel = weeksAgo === 0 ? "Cette semaine" : weeksAgo === 1 ? "Semaine dernière" : `Il y a ${weeksAgo} sem.`;

  return (
    <div className={styles.container}>
      {/* Mode toggle */}
      <div className={styles.segmented}>
        {["effort", "gains"].map(m => (
          <button
            key={m}
            type="button"
            className={`${styles.seg} ${mode === m ? (m === "gains" ? styles.segActiveGains : styles.segActive) : ""}`}
            onClick={() => setMode(m)}
          >
            {m === "gains" ? "Gains" : "Effort"}
          </button>
        ))}
      </div>

      {/* Week navigation */}
      <div className={styles.weekNav}>
        <button type="button" className={styles.weekArrow} onClick={() => setWeeksAgo(w => Math.min(w + 1, 4))}>
          &#8249;
        </button>
        <span className={styles.weekLabel}>{weekLabel}</span>
        <button
          type="button"
          className={`${styles.weekArrow} ${weeksAgo === 0 ? styles.weekArrowHidden : ""}`}
          onClick={() => setWeeksAgo(w => Math.max(w - 1, 0))}
          disabled={weeksAgo === 0}
        >
          &#8250;
        </button>
      </div>

      {/* Body SVG */}
      {isGains && bodyCompLoading ? (
        <div className={styles.loadingArea}>Chargement...</div>
      ) : (
        <div className={styles.bodyWrapper}>
          <div ref={containerRef} className={styles.svgContainer} />
        </div>
      )}

      {/* Session count + top muscles */}
      <div className={styles.meta}>
        <span className={styles.sessionCount}>
          {filteredSessions.length} séance{filteredSessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {hasData ? (
        <div className={styles.topList}>
          {topMuscles.map(muscle => (
            <div key={muscle.zone} className={styles.topRow}>
              <span className={styles.topDot} style={{ background: muscle.color.fill }} />
              <span className={styles.topName}>{ZONE_LABELS[muscle.zone] || muscle.zone}</span>
              <span className={styles.topValue}>
                {isGains
                  ? `+${muscle.gainG || Math.round(muscle.count)}g`
                  : `${muscle.count % 1 === 0 ? muscle.count : muscle.count.toFixed(1)}`
                }
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          {isGains ? "Pas de données de croissance" : "Aucune séance sur cette période"}
        </p>
      )}

      {/* Scale */}
      {hasData && (
        <div className={styles.scaleRow}>
          <span className={styles.scaleLabel}>Peu</span>
          <div className={styles.scaleBar}>
            {colorPalette.map((c, i) => (
              <div key={i} className={styles.scaleStep} style={{ background: c.fill }} />
            ))}
          </div>
          <span className={styles.scaleLabel}>Max</span>
        </div>
      )}
    </div>
  );
}

export default MuscleHeatmap;
