/**
 * HarmoNith - Shadow System
 * Ombres optimisées pour iOS et Android
 */

import { Platform } from 'react-native';

/**
 * Create shadow styles for both iOS and Android
 * @param {number} elevation - Shadow elevation (0-24)
 * @param {string} color - Shadow color (default: black)
 * @param {number} opacity - Shadow opacity (0-1)
 */
const createShadow = (elevation, color = '#000000', opacity = 0.15) => {
  if (Platform.OS === 'ios') {
    // iOS uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
    const shadowOffset = {
      width: 0,
      height: Math.round(elevation / 2),
    };
    const shadowRadius = Math.round(elevation * 0.8);

    return {
      shadowColor: color,
      shadowOffset,
      shadowOpacity: opacity,
      shadowRadius,
    };
  } else if (Platform.OS === 'android') {
    // Android uses elevation
    return {
      elevation,
    };
  }

  return {};
};

// Shadow Levels
export const shadows = {
  none: createShadow(0),
  xs: createShadow(2, '#000000', 0.1),
  sm: createShadow(4, '#000000', 0.12),
  md: createShadow(8, '#000000', 0.15),
  lg: createShadow(12, '#000000', 0.18),
  xl: createShadow(16, '#000000', 0.2),
  '2xl': createShadow(20, '#000000', 0.22),
  '3xl': createShadow(24, '#000000', 0.25),
};

// Component-specific shadows
export const componentShadows = {
  // Cards
  card: shadows.md,
  cardHovered: shadows.lg,
  cardPressed: shadows.sm,

  // Buttons
  button: shadows.sm,
  buttonHovered: shadows.md,
  buttonPressed: shadows.xs,

  // Floating Action Button
  fab: shadows.lg,
  fabHovered: shadows.xl,
  fabPressed: shadows.md,

  // Modal & Dialogs
  modal: shadows['2xl'],
  dialog: shadows.xl,

  // Bottom Sheet
  bottomSheet: shadows['3xl'],

  // App Bar / Header
  appBar: shadows.sm,

  // Dropdown & Menu
  dropdown: shadows.lg,
  menu: shadows.xl,

  // Tooltip
  tooltip: shadows.md,

  // Tabs
  tabBar: shadows.sm,

  // Input (focused state)
  inputFocused: shadows.sm,

  // Image
  image: shadows.xs,
};

// Colored shadows for special effects
export const coloredShadows = {
  primary: createShadow(8, '#F7B186', 0.3),
  primaryStrong: createShadow(12, '#F7B186', 0.4),

  secondary: createShadow(8, '#B8DDD1', 0.3),
  secondaryStrong: createShadow(12, '#B8DDD1', 0.4),

  success: createShadow(8, '#4CAF50', 0.3),
  warning: createShadow(8, '#FFC107', 0.3),
  error: createShadow(8, '#F44336', 0.3),
  info: createShadow(8, '#2196F3', 0.3),
};

// Inner shadows (using border technique for React Native)
export const innerShadows = {
  sm: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  md: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  lg: {
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
};

// Glow effects
export const glows = {
  primary: Platform.select({
    ios: {
      shadowColor: '#F7B186',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),

  secondary: Platform.select({
    ios: {
      shadowColor: '#B8DDD1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),

  success: Platform.select({
    ios: {
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),

  error: Platform.select({
    ios: {
      shadowColor: '#F44336',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
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
