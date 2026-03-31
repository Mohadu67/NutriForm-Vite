/**
 * HarmoNith - Shadow System v2.0
 * Aligned with web design-tokens — softer, multi-layer feel
 */

import { Platform } from 'react-native';

const createShadow = (elevation, color = '#000000', opacity = 0.12) => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: Math.round(elevation / 2) },
      shadowOpacity: opacity,
      shadowRadius: Math.round(elevation * 0.8),
    };
  } else if (Platform.OS === 'android') {
    return { elevation };
  }
  return {};
};

// Shadow Levels — softer default opacities
export const shadows = {
  none: createShadow(0),
  xs: createShadow(1, '#000000', 0.06),
  sm: createShadow(3, '#000000', 0.08),
  md: createShadow(6, '#000000', 0.1),
  lg: createShadow(10, '#000000', 0.12),
  xl: createShadow(14, '#000000', 0.15),
  '2xl': createShadow(18, '#000000', 0.18),
  '3xl': createShadow(24, '#000000', 0.2),
};

// Component-specific shadows
export const componentShadows = {
  card: shadows.sm,
  cardHovered: shadows.md,
  cardPressed: shadows.xs,
  button: shadows.xs,
  buttonHovered: shadows.sm,
  buttonPressed: createShadow(0),
  fab: shadows.lg,
  fabHovered: shadows.xl,
  fabPressed: shadows.md,
  modal: shadows['2xl'],
  dialog: shadows.xl,
  bottomSheet: shadows['3xl'],
  appBar: shadows.xs,
  dropdown: shadows.lg,
  menu: shadows.xl,
  tooltip: shadows.md,
  tabBar: shadows.sm,
  inputFocused: shadows.xs,
  image: shadows.xs,
};

// Colored shadows — updated to new palette
export const coloredShadows = {
  primary: createShadow(8, '#f0a47a', 0.25),
  primaryStrong: createShadow(12, '#f0a47a', 0.35),
  secondary: createShadow(8, '#72baa1', 0.25),
  secondaryStrong: createShadow(12, '#72baa1', 0.35),
  success: createShadow(8, '#22c55e', 0.25),
  warning: createShadow(8, '#f59e0b', 0.25),
  error: createShadow(8, '#ef4444', 0.25),
  info: createShadow(8, '#0ea5e9', 0.25),
};

// Inner shadows (border technique)
export const innerShadows = {
  sm: { borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.04)' },
  md: { borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)' },
  lg: { borderWidth: 1.5, borderColor: 'rgba(0, 0, 0, 0.08)' },
};

// Glow effects — updated to new palette
export const glows = {
  primary: Platform.select({
    ios: {
      shadowColor: '#f0a47a',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 14,
    },
    android: { elevation: 8 },
  }),
  secondary: Platform.select({
    ios: {
      shadowColor: '#72baa1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 14,
    },
    android: { elevation: 8 },
  }),
  success: Platform.select({
    ios: {
      shadowColor: '#22c55e',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
  }),
  error: Platform.select({
    ios: {
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
  }),
};

export default {
  shadows,
  componentShadows,
  coloredShadows,
  innerShadows,
  glows,
  createShadow,
};
