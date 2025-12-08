import React, { useCallback, useEffect, useMemo, useRef } from "react";
import * as assets from "./figureAssets";
import cls from "./BodyPicker.module.css";
import bodySvgMarkup from "./body.svg?raw";
import logger from '../../../../shared/utils/logger.js';
const FRONT_ZONE_LABELS = assets.FRONT_ZONE_LABELS || {};
const FRONT_ZONE_METADATA = assets.FRONT_ZONE_METADATA || [];
const FRONT_SVG_ZONE_MAP = assets.FRONT_SVG_ZONE_MAP || {};

const EXTRA_ZONES = Object.freeze([]);

const EXTRA_LABELS = Object.freeze({
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  FOREARMS: "Avant-bras",
  QUADRICEPS: "Quadriceps",
  HAMSTRINGS: "Ischios",
  CALVES: "Mollets",
  GLUTES: "Fessiers",
  BACK_UPPER: "Haut du dos",
  BACK_LOWER: "Bas du dos",
});

function BodyPicker({ value, onChange, multiple = false }) {
  const zoneIdToLabel = useMemo(() => {
    const map = new Map();
    Object.entries(FRONT_ZONE_LABELS || {}).forEach(([id, fallback]) => {
      map.set(id, fallback);
    });
    Object.entries(EXTRA_LABELS).forEach(([id, fallback]) => {
      map.set(id, fallback);
    });
    return map;
  }, []);

  const VALID_IDS = useMemo(() => {
    const base = new Set((FRONT_ZONE_METADATA || []).map((z) => z.id));
    EXTRA_ZONES.forEach((id) => base.add(id));
    return base;
  }, []);

  const ORDERED_IDS = useMemo(
    () => [ ...(FRONT_ZONE_METADATA || []).map((z) => z.id), ...EXTRA_ZONES ],
    []
  );

  const containerRef = useRef(null);
  const svgRootRef = useRef(null);
  const svgIdToZoneId = useMemo(
    () => new Map(Object.entries(FRONT_SVG_ZONE_MAP || {})),
    []
  );

  const activeSet = useMemo(() => {
    if (multiple) {
      const arr = Array.isArray(value) ? value : [];
      const filtered = arr.filter((id) => VALID_IDS.has(id));
      return filtered.length ? new Set(filtered) : new Set();
    }
    if (typeof value === "string" && VALID_IDS.has(value)) return new Set([value]);
    return new Set();
  }, [multiple, value, VALID_IDS]);

  const selectedLabels = useMemo(() => {
    if (!activeSet.size) return [];
    return ORDERED_IDS.filter((id) => activeSet.has(id)).map((id) => zoneIdToLabel.get(id) || id);
  }, [activeSet, ORDERED_IDS, zoneIdToLabel]);

  const toggleZone = useCallback(
    (zoneId) => {
      if (!onChange || !VALID_IDS.has(zoneId)) return;

      if (multiple) {
        const arr = Array.isArray(value) ? value.filter((id) => VALID_IDS.has(id)) : [];
        const exists = arr.includes(zoneId);
        const provisional = exists ? arr.filter((x) => x !== zoneId) : [...arr, zoneId];
        const dedup = Array.from(new Set(provisional)).filter((id) => VALID_IDS.has(id));
        const ordered = dedup.sort(
          (a, b) => ORDERED_IDS.indexOf(a) - ORDERED_IDS.indexOf(b)
        );
        onChange(ordered);
        return;
      }

      const next = value === zoneId ? null : zoneId;
      onChange(next);
    },
    [multiple, onChange, ORDERED_IDS, VALID_IDS, value]
  );

  const handleZoneKeyDown = useCallback(
    (event, zoneId) => {
      const isEnter = event.key === "Enter";
      const isSpace = event.key === " " || event.code === "Space" || event.key === "Spacebar";
      if (!isEnter && !isSpace) return;
      event.preventDefault();
      toggleZone(zoneId);
    },
    [toggleZone]
  );

  const unbind = useCallback(() => {
    if (!svgRootRef.current) return;
    const nodes = svgRootRef.current.querySelectorAll("[data-elem], [id]");
    nodes.forEach((node) => {
      const h = node.__nfHandlers;
      if (!h) return;
      node.removeEventListener("click", h.onClick);
      node.removeEventListener("keydown", h.onKey);
      delete node.__nfHandlers;
    });
  }, []);

  const syncActive = useCallback(() => {
    if (!svgRootRef.current) return;
    const nodes = svgRootRef.current.querySelectorAll("[data-elem], [id]");
    nodes.forEach((node) => {
      const zoneId =
        node.__nfHandlers?.zoneId ||
        svgIdToZoneId.get(node.getAttribute("data-elem") || "") ||
        svgIdToZoneId.get(node.getAttribute("id") || "");
      if (!zoneId) return;
      const isActive = activeSet.has(zoneId);
      node.setAttribute("aria-pressed", String(isActive));
      node.classList.toggle(cls.active, isActive);
    });
  }, [activeSet, svgIdToZoneId]);

  const bind = useCallback(() => {
    if (!svgRootRef.current) return;
    const nodes = svgRootRef.current.querySelectorAll("[data-elem], [id]");

    nodes.forEach((node) => {
      const raw = node.getAttribute("data-elem") || node.getAttribute("id");
      if (!raw) return;

      let zoneId = svgIdToZoneId.get(raw) || null;
      const low = raw.toLowerCase();
      const lowNorm = low
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s._-]+/g, "");

      if (
        low.includes("chest") || low.includes("pec") || low.includes("pecs") || low.includes("peck") ||
        low.includes("pector") || low.includes("thorax") || lowNorm.includes("pectoraux")
      ) {
        zoneId = "pectoraux";
      }
      else if (
        low.includes("shoulder") || low.includes("epaule") || low.includes("épaule") ||
        low.includes("deltoid") || low.includes("delto") || lowNorm.includes("epaules")
      ) {
        zoneId = "epaules";
      }
      else if (
        low.includes("oblique") || low.includes("side abs") || lowNorm.includes("obliques")
      ) {
        zoneId = "abdos-lateraux";
      }
      else if (
        low.includes("abs") || low.includes("abdo") || low.includes("rectus") || low.includes("sixpack")
      ) {
        zoneId = "abdos-centre";
      }
      else if (low.includes("bicep")) zoneId = "biceps";
      else if (low.includes("tricep")) zoneId = "triceps";
      else if (
        low.includes("forearm") || low.includes("wrist") ||
        low.includes("avant-bras") || low.includes("avant bras") || low.includes("poignet") || lowNorm.includes("avantbras")
      ) {
        zoneId = "avant-bras";
      }
      else if (low.includes("quad") || low.includes("quadricep") || low.includes("cuisse")) {
        zoneId = "cuisses-externes";
      }
      else if (
        low.includes("hamstring") || low.includes("ischio") ||
        low.includes("arriere-cuisse") || low.includes("arrière-cuisse") || lowNorm.includes("arrierecuisse")
      ) {
        zoneId = "cuisses-internes";
      }
      else if (low.includes("calf") || low.includes("calves") || low.includes("mollet")) {
        zoneId = "mollets";
      }
      else if (low.includes("glute") || low.includes("glutes") || low.includes("fess")) {
        zoneId = "fessiers";
      }
      else if (
        low.includes("upper-back") || low.includes("haut-du-dos") || low.includes("haut du dos") ||
        low.includes("traps") || low.includes("trapeze") || low.includes("trapèze") || lowNorm.includes("hautdos")
      ) {
        zoneId = "dos-superieur";
      }
      else if (
        low.includes("lower-back") || low.includes("bas-du-dos") || low.includes("bas du dos") ||
        low.includes("lombaire") || low.includes("lombaires") || low.includes("lumbar") ||
        low.includes("erector") || low.includes("spinae") || low.includes("spinal") || low.includes("lowback") ||
        low.includes("lats") || low.includes("grand dorsal") || lowNorm.includes("basdos")
      ) {
        zoneId = "dos-inferieur";
      }
      else if ((low.includes("back") || low.includes("dos")) && !low.includes("trap")) {
        zoneId = "dos-inferieur";
      }

      if (!zoneId) {
        const rawUpper = raw.toUpperCase();
        if (VALID_IDS.has(rawUpper)) zoneId = rawUpper;
      }

      if (!zoneId || !VALID_IDS.has(zoneId)) return;

      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.setAttribute("data-zone", zoneId);
      node.setAttribute("aria-label", zoneIdToLabel.get(zoneId) || zoneId);
      node.classList.add(cls.zone);

      const onClick = () => toggleZone(zoneId);
      const onKey = (e) => handleZoneKeyDown(e, zoneId);
      node.__nfHandlers = { zoneId, onClick, onKey };
      node.addEventListener("click", onClick);
      node.addEventListener("keydown", onKey);
    });
  }, [handleZoneKeyDown, svgIdToZoneId, toggleZone, VALID_IDS, zoneIdToLabel]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return undefined;
    host.innerHTML = bodySvgMarkup;
    svgRootRef.current = host.querySelector("svg");

    const svg = svgRootRef.current;
    if (svg) {
      try {
        if (!svg.hasAttribute("viewBox")) {
          const b = svg.getBBox();
          if (b && b.width && b.height) svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
        }
      } catch (e) {
        logger.error("Failed to adjust SVG viewBox:", e);
      }
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }

    bind();
    syncActive();

    return () => {
      unbind();
      svgRootRef.current = null;
      host.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    if (!svgRootRef.current) return;
    unbind();
    bind();
    syncActive();
    return () => unbind();
  }, [bind, syncActive, unbind]);

  useEffect(() => {
    syncActive();
  }, [syncActive]);

  const instructions = multiple
    ? "Clique sur les zones du corps que tu souhaites cibler"
    : "Clique sur une zone du corps pour la sélectionner";


  return (
    <div className={`${cls.wrapper} ${cls.bodyPickerWrapper}`}>
      <div className={cls.figures}>
        <div className={`${cls.figure} ${cls.figureInteractive}`}>
          <div
            ref={containerRef}
            className={cls.svg}
            aria-label="Sélecteur de zones du corps"
          />
        </div>
      </div>
      <p className={cls.legend}>{instructions}</p>
      {selectedLabels.length > 0 && (
        <div className={cls.selectedList}>
          {selectedLabels.map((label) => (
            <span key={label} className={cls.selectedBadge}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default BodyPicker;
