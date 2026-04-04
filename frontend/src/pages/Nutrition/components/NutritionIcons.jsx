/**
 * Nutrition-specific SVG icons.
 * Brand palette only: teal #72baa1 · peach #f0a47a · stone #c9a88c
 * Stroke-based, 24x24 viewBox, consistent with GlobalIcons pattern.
 */

export const ProteinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 2.5c2 1.5 3.5 4 3.5 7a8 8 0 0 1-8 8c-3 0-5.5-1.5-7-3.5" />
    <path d="M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <path d="M4 19l3-3" /><path d="M2 21l2-2" />
  </svg>
);

export const CarbsIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V2" /><path d="M8 6c0 0 1.5 2 4 2s4-2 4-2" />
    <path d="M7 10c0 0 2 2.5 5 2.5s5-2.5 5-2.5" />
    <path d="M8 14c0 0 1.5 2 4 2s4-2 4-2" />
  </svg>
);

export const FatsIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c0 0-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z" />
  </svg>
);

export const FiberIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 4 13c0-3.87 3.13-7 7-7" />
    <path d="M13 4a7 7 0 0 1 7 7c0 3.87-3.13 7-7 7" />
    <path d="M12 2v20" />
  </svg>
);

export const SugarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 12h8" /><path d="M12 8v8" />
  </svg>
);

export const SodiumIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2h8l1 6H7l1-6z" /><path d="M7 8h10v2a5 5 0 0 1-10 0V8z" />
    <path d="M10 15v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4" />
  </svg>
);

export const SunriseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" /><path d="M4.93 10.93l2.83 2.83" /><path d="M2 18h4" />
    <path d="M18 18h4" /><path d="M16.24 13.76l2.83-2.83" />
    <path d="M18 18a6 6 0 0 0-12 0" />
  </svg>
);

export const SunFullIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" /><path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

export const MoonIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const AppleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c-1.5 0-3 .5-3 2s1 2.5 3 2.5 3-.5 3-2.5-1.5-2-3-2z" />
    <path d="M17 8c2.5 1.5 3 5 2 9-1 3-3 5-5 5s-2.5-1-4-1-2.5 1-4 1-4-2-5-5c-1-4-.5-7.5 2-9 1.5-1 3.5-1 5 0l2 1.5 2-1.5c1.5-1 3.5-1 5 0z" />
  </svg>
);

export const CameraIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

export const BarChartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" />
    <rect x="17" y="3" width="4" height="18" rx="1" />
  </svg>
);
