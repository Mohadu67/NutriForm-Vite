import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import style from "./HistoryCharts.module.css";

export default function SessionChart({ points }) {
  const [tooltip, setTooltip] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [showTooltip, setShowTooltip] = useState(true);
  const containerRef = useRef(null);

  const toDate = useCallback((raw) => {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw) ? null : raw;
    if (typeof raw === "number") {
      const d = new Date(raw);
      return isNaN(d) ? null : d;
    }
    if (typeof raw === "string") {
      const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
      const d = new Date(iso);
      return isNaN(d) ? null : d;
    }
    return null;
  }, []);

  useEffect(() => {
    function handleDocClick(ev) {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setShowTooltip(false);
        setTooltip(null);
        setSelectedIdx(null);
      }
    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const getExercisesCount = useCallback((src) => {
    const o = src || {};
    if (Array.isArray(o.entries)) return o.entries.length;
    if (Array.isArray(o.exercises)) return o.exercises.length;
    if (Array.isArray(o.items)) return o.items.length;
    if (Array.isArray(o.original?.entries)) return o.original.entries.length;
    if (Array.isArray(o.original?.exercises)) return o.original.exercises.length;
    if (Array.isArray(o.original?.items)) return o.original.items.length;
    const n = Number(o.exercisesCount ?? o.nbExercises ?? o.countExercises ?? o.value ?? o.count);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }, []);

  const getExercisesList = useCallback((src) => {
    const o = src || {};
    const tryArrays = [
      o.entries,
      o.exercises,
      o.items,
      o.session?.entries,
      o.session?.exercises,
      o.session?.items,
      o.seance?.entries,
      o.seance?.exercises,
      o.seance?.items,
      o.data?.entries,
      o.data?.exercises,
      o.data?.items,
      o.original?.entries,
      o.original?.exercises,
      o.original?.items,
      o.original?.data?.entries,
      o.original?.data?.exercises,
      o.original?.data?.items,
    ];
    for (const arr of tryArrays) {
      if (Array.isArray(arr) && arr.length) return arr;
    }
    return null;
  }, []);

  const normalized = useMemo(() => {
    return (points || [])
      .map((pt) => {
        const date = toDate(pt?.date ?? pt?.createdAt ?? pt?.day);
        const exercises = getExercisesCount(pt?.original || pt);
        const value = Number(pt?.value ?? pt?.count ?? exercises);
        return { original: (pt?.original || pt), date, value, exercises };
      })
      .filter((p) => p.date && Number.isFinite(p.value))
      .sort((a, b) => a.date - b.date);
  }, [points, toDate, getExercisesCount]);

  if (!normalized || normalized.length === 0) {
    return (
      <div className={`${style.chartCard} ${style.chartContainer}`} ref={containerRef}>
        <h4>Exercices par jour</h4>
        <p className={style.muted}>Aucune donnée disponible.</p>
      </div>
    );
  }

  const weekdayIndex = (d) => {
    const js = d.getDay();
    return js === 0 ? 6 : js - 1;
  };
  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const groups = Array.from({ length: 7 }, () => []);
  for (const p of normalized) {
    const exList = getExercisesList(p.original);
    const inferredCount = getExercisesCount(p.original || p);
    const count = exList ? exList.length : Math.max(0, Math.floor(inferredCount ?? 0));
    const idx = weekdayIndex(p.date);
    for (let i = 0; i < count; i++) {
      const exObj = exList ? exList[i] : null;
      groups[idx].push({
        date: p.date,
        indexInSession: i + 1,
        totalInSession: count,
        original: p.original,
        exObj,
      });
    }
  }

  const width = 560;
  const height = 320;
  const margin = { top: 24, right: 24, bottom: 64, left: 24 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const colW = chartW / 7;
  const lineTop = margin.top;
  const lineBottom = margin.top + chartH - 24;

  const maxDotsPerCol = Math.max(
    1,
    ...groups.map((g) => g.length)
  );
  const dotRadius = 5;

  const handleLeave = () => {
    if (tooltip?.pinned) return;
    setTooltip(null);
  };

  const dateFmt = (d) =>
    d.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <div className={`${style.chartCard} ${style.chartContainer}`} ref={containerRef}>
      <h4>Exercices par jour</h4>
      <svg
        className={style.svgChart}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Chronologie hebdomadaire des exercices"
        onMouseLeave={handleLeave}
        onClick={(e) => { e.stopPropagation?.(); setShowTooltip(true); }}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x="0" y="0" width={width} height={height} fill="transparent" />

        {groups.map((col, i) => {
          const x = margin.left + i * colW + colW / 2;
          const safeCount = col.length;
          const gap = safeCount > 1 ? (lineBottom - lineTop) / (safeCount - 1) : 0;
          const isSelected = i === selectedIdx;
          const colBottom = isSelected ? lineBottom + 16 : lineBottom;
          const strokeW = isSelected ? 3 : 2;
          return (
            <g key={`col-${i}`}> 
              <line
                x1={x}
                x2={x}
                y1={lineTop}
                y2={colBottom}
                stroke="#bfc6d1"
                strokeWidth={strokeW}
                strokeLinecap="round"
              />

              {col.map((d, k) => {
                const cy = safeCount === 1 ? (lineTop + colBottom) / 2 : colBottom - k * gap;
                return (
                  <g key={`dot-${i}-${k}`}>
                    <circle
                      cx={x}
                      cy={cy}
                      r={dotRadius}
                      fill="#2e86de"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      onMouseEnter={() => {}}
                      onClick={(evt) => {
  evt.stopPropagation();
  const bbox = evt.currentTarget.getBoundingClientRect();
  const parent = evt.currentTarget.ownerSVGElement.getBoundingClientRect();

  const o = d.original || {};

  const exIdx = (d.indexInSession || 1) - 1;
  const exObj = d.exObj ?? null;

  const sessionName = (
    o.sessionName || o.seanceName || o.workoutName || o.nameSession || o.session || o.title || null
  );

  const exerciseName = (
    (exObj && (exObj.exerciseName || exObj.exoName || exObj.name || exObj.label)) ||
    o.exerciseName || o.exoName || o.exercise || o.label || o.name || null
  );

  const pickNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const typeStr = String(exObj?.type || o.type || "").toLowerCase();
  const firstSet = Array.isArray(exObj?.sets) && exObj.sets.length ? exObj.sets[0] : null;

  const weight = pickNum(firstSet?.weightKg ?? firstSet?.weight ?? firstSet?.kg ?? null);
  const reps   = pickNum(firstSet?.reps ?? firstSet?.repetitions ?? null);

  const detailParts = [];
  if (weight !== null) detailParts.push(`${weight} kg`);
  if (reps !== null) detailParts.push(`${reps} reps`);
  const detail = detailParts.length ? detailParts.join(" \u00b7 ") : null;

  const svgW = parent.width;
  let posX = bbox.x - parent.x + bbox.width / 2;
  let posY = bbox.y - parent.y - 8;
  posY = Math.max(24, posY);
  const edge = 80;
  let align = 'center';
  if (posX < edge) {
    align = 'left';
    posX = Math.max(10, posX);
  } else if (posX > svgW - edge) {
    align = 'right';
    posX = Math.min(svgW - 10, posX);
  }

  const lines = [
    sessionName ? `${sessionName}` : null,
    exerciseName ? `${exerciseName}` : (exObj ? `Exercice ${exIdx + 1}` : null),
    detail,
  ].filter((v) => typeof v === 'string' && v.trim().length > 0);

  setTooltip({
    x: posX,
    y: posY,
    lines: lines.length ? lines : ["Exercice"],
    pinned: true,
    align,
  });
  setShowTooltip(true);
  setSelectedIdx(i);
}}
                    >
                      <title>{`${dateFmt(d.date)} · 1 exercice`}</title>
                    </circle>
                  </g>
                );
              })}

              <text
                x={x}
                y={height - 28}
                textAnchor="middle"
                fontSize="12"
                fill="#586271"
              >
                {weekdays[i]}
              </text>
            </g>
          );
        })}
      </svg>

      {showTooltip && tooltip && (
        <div
          className={`${style.tooltip} ${tooltip.align === 'left' ? style.tooltipLeft : tooltip.align === 'right' ? style.tooltipRight : style.tooltipCenter}`}
          style={{ left: tooltip.x, top: tooltip.y }}
       >
          {tooltip.lines.map((l, idx) => (
            <div key={idx}>{l}</div>
          ))}
        </div>
      )}

      {showTooltip && tooltip?.pinned && (
        <div className={style.tooltipHint}>
          Cliquez ailleurs pour fermer l’infobulle.
        </div>
      )}
    </div>
  );
}
