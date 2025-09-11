import React, { useState } from "react";
import style from "../HistoryUser.module.css";

export default function LineChartSVG({
  points,
  color = "#333",
  width = 320,
  height = 140,
  tooltipClassName,
  showTooltip = true,
}) {
  const [hovered, setHovered] = useState(null);

  if (!points || points.length === 0) return null;

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const xScale = (i) => (i / (points.length - 1 || 1)) * (width - 20) + 10;
  const yScale = (val) =>
    height - ((val - minVal) / (maxVal - minVal || 1)) * (height - 20) - 10;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <g stroke="rgba(0,0,0,0.08)" strokeWidth="0.5">
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = 10 + p * (height - 20);
          return <line key={p} x1="0" x2={width} y1={y} y2={y} />;
        })}
      </g>

      <line x1="10" x2={width - 10} y1={height - 10} y2={height - 10} stroke="var(--nf-border)" strokeWidth="1" />
      <line x1="10" x2="10" y1="10" y2={height - 10} stroke="var(--nf-border)" strokeWidth="1" />

      <path
        d={`M ${points
          .map((pt, i) => `${xScale(i).toFixed(1)} ${yScale(pt.value).toFixed(1)}`)
          .join(" L ")}`}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${points
          .map((pt, i) => `${xScale(i).toFixed(1)} ${yScale(pt.value).toFixed(1)}`)
          .join(" L ")} L ${xScale(points.length - 1)} ${height - 10} L 10 ${height - 10} Z`}
        fill="url(#bgGradient)"
        stroke="none"
      />

      {points.map((pt, i) => {
        const cx = xScale(i);
        const cy = yScale(pt.value);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="5"
            fill={color}
            stroke="#fff"
            strokeWidth="1.5"
            onClick={() =>
              setHovered(
                hovered && hovered.cx === cx && hovered.cy === cy ? null : { ...pt, cx, cy }
              )
            }
          />
        );
      })}

      {showTooltip && hovered && (() => {
        const tooltipWidth = 120;
        const tooltipHeight = 40;

        let tooltipX = hovered.cx + 8;
        if (tooltipX + tooltipWidth > width) {
          tooltipX = hovered.cx - tooltipWidth - 8;
        }
        if (tooltipX < 0) tooltipX = 0;

        let tooltipY = hovered.cy - tooltipHeight - 8;
        if (tooltipY < 0) tooltipY = hovered.cy + 8;

        return (
          <foreignObject
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
          >
            <div xmlns="http://www.w3.org/1999/xhtml" className={tooltipClassName || style.chartTooltip}>
              {hovered.value} • {hovered.date.toLocaleDateString("fr-FR")}
            </div>
          </foreignObject>
        );
      })()}
    </svg>
  );
}