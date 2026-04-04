/**
 * Nutrition SVG icons for React Native (react-native-svg).
 * Brand palette: teal #72baa1 · peach #f0a47a · stone #c9a88c
 * Stroke-based, 24x24 viewBox.
 */
import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const defaults = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const ProteinIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M15.5 2.5c2 1.5 3.5 4 3.5 7a8 8 0 0 1-8 8c-3 0-5.5-1.5-7-3.5" />
    <Circle cx={9} cy={9} r={3} />
    <Path d="M4 19l3-3" />
    <Path d="M2 21l2-2" />
  </Svg>
);

export const CarbsIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M12 22V2" />
    <Path d="M8 6c0 0 1.5 2 4 2s4-2 4-2" />
    <Path d="M7 10c0 0 2 2.5 5 2.5s5-2.5 5-2.5" />
    <Path d="M8 14c0 0 1.5 2 4 2s4-2 4-2" />
  </Svg>
);

export const FatsIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M12 2c0 0-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z" />
  </Svg>
);

export const FiberIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M11 20A7 7 0 0 1 4 13c0-3.87 3.13-7 7-7" />
    <Path d="M13 4a7 7 0 0 1 7 7c0 3.87-3.13 7-7 7" />
    <Path d="M12 2v20" />
  </Svg>
);

export const SugarIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Rect x={4} y={4} width={16} height={16} rx={3} />
    <Path d="M8 12h8" />
    <Path d="M12 8v8" />
  </Svg>
);

export const SodiumIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M8 2h8l1 6H7l1-6z" />
    <Path d="M7 8h10v2a5 5 0 0 1-10 0V8z" />
    <Path d="M10 15v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4" />
  </Svg>
);

export const SunriseIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M12 2v4" />
    <Path d="M4.93 10.93l2.83 2.83" />
    <Path d="M2 18h4" />
    <Path d="M18 18h4" />
    <Path d="M16.24 13.76l2.83-2.83" />
    <Path d="M18 18a6 6 0 0 0-12 0" />
  </Svg>
);

export const SunFullIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Circle cx={12} cy={12} r={4} />
    <Path d="M12 2v2" />
    <Path d="M12 20v2" />
    <Path d="M4.93 4.93l1.41 1.41" />
    <Path d="M17.66 17.66l1.41 1.41" />
    <Path d="M2 12h2" />
    <Path d="M20 12h2" />
    <Path d="M6.34 17.66l-1.41 1.41" />
    <Path d="M19.07 4.93l-1.41 1.41" />
  </Svg>
);

export const MoonIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);

export const AppleIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M12 3c-1.5 0-3 .5-3 2s1 2.5 3 2.5 3-.5 3-2.5-1.5-2-3-2z" />
    <Path d="M17 8c2.5 1.5 3 5 2 9-1 3-3 5-5 5s-2.5-1-4-1-2.5 1-4 1-4-2-5-5c-1-4-.5-7.5 2-9 1.5-1 3.5-1 5 0l2 1.5 2-1.5c1.5-1 3.5-1 5 0z" />
  </Svg>
);

export const FireIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M12 22c4-2 8-6 8-11a8 8 0 0 0-13-6.2C5.7 6.1 4 8.9 4 11c0 5 4 9 8 11z" />
    <Path d="M12 22c-1.5-1-3-3-3-5.5 0-3 3-5.5 3-5.5s3 2.5 3 5.5c0 2.5-1.5 4.5-3 5.5z" />
  </Svg>
);

export const CameraIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <Circle cx={12} cy={13} r={3} />
  </Svg>
);

export const SearchIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Circle cx={11} cy={11} r={8} />
    <Path d="M21 21l-4.35-4.35" />
  </Svg>
);

export const BarChartIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Rect x={3} y={12} width={4} height={9} rx={1} />
    <Rect x={10} y={7} width={4} height={14} rx={1} />
    <Rect x={17} y={3} width={4} height={18} rx={1} />
  </Svg>
);

export const PlusIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M12 5v14" />
    <Path d="M5 12h14" />
  </Svg>
);

export const PencilIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

export const TrashIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M3 6h18" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

export const CloseIcon = ({ size = 18, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...defaults} stroke={color}>
    <Path d="M18 6L6 18" />
    <Path d="M6 6l12 12" />
  </Svg>
);
