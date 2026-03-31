/**
 * HarmoNith - Color Palette v2.0
 * Aligned with web design-tokens.css — warm stone neutrals, refined peach/teal
 */

export const colors = {
  // Primary Colors (warm peach — refined)
  primary: '#f0a47a',
  primaryDark: '#c67548',
  primaryLight: '#f5c4a6',
  primary50: '#fef6f0',
  primary100: '#fdeadb',
  primary200: '#f9d2b7',
  primary300: '#f5b88d',
  primary400: '#f0a47a',
  primary500: '#f0a47a',
  primary600: '#c67548',
  primary700: '#a55a30',
  primary800: '#7a3f1f',
  primary900: '#4d2712',

  // Secondary Colors (sage teal — refined)
  secondary: '#72baa1',
  secondaryDark: '#478571',
  secondaryLight: '#a8d8c8',
  secondary50: '#f0faf6',
  secondary100: '#d4f0e4',
  secondary200: '#a8d8c8',
  secondary300: '#8ecdb5',
  secondary400: '#72baa1',
  secondary500: '#72baa1',
  secondary600: '#478571',
  secondary700: '#326050',
  secondary800: '#234638',
  secondary900: '#152b22',

  // Status Colors (semantic)
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#0ea5e9',
  accent: '#f0a47a',

  // Light Mode — warm stone neutrals
  light: {
    // Backgrounds
    background: '#fcfbf9',
    backgroundSecondary: '#f7f6f3',
    backgroundTertiary: '#efedea',

    // Surfaces
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceOverlay: 'rgba(0, 0, 0, 0.4)',

    // Text
    text: '#1c1917',
    textSecondary: '#57534e',
    textTertiary: '#a8a29e',
    textDisabled: '#d6d3d1',
    textInverse: '#ffffff',

    // Borders
    border: '#e7e5e4',
    borderLight: '#f5f5f4',
    borderDark: '#d6d3d1',

    // Interactive
    interactive: '#f0a47a',
    interactiveHover: '#c67548',
    interactivePressed: '#a55a30',
    interactiveDisabled: '#fef6f0',

    // Status Backgrounds
    statusSuccess: '#f0fdf4',
    statusWarning: '#fffbeb',
    statusError: '#fef2f2',
    statusInfo: '#f0f9ff',
  },

  // Dark Mode — warm dark neutrals
  dark: {
    // Backgrounds
    background: '#0e0e11',
    backgroundSecondary: '#131317',
    backgroundTertiary: '#1f1f26',

    // Surfaces
    surface: '#18181d',
    surfaceElevated: '#1f1f26',
    surfaceOverlay: 'rgba(0, 0, 0, 0.6)',

    // Text
    text: '#f3f3f6',
    textSecondary: '#c1c1cb',
    textTertiary: '#7a7a88',
    textDisabled: '#44444f',
    textInverse: '#1c1917',

    // Borders
    border: '#2a2a33',
    borderLight: '#1f1f26',
    borderDark: '#3a3a45',

    // Interactive
    interactive: '#f0a47a',
    interactiveHover: '#f5c4a6',
    interactivePressed: '#c67548',
    interactiveDisabled: '#2a2018',

    // Status Backgrounds
    statusSuccess: '#0f2a1a',
    statusWarning: '#2a2008',
    statusError: '#2a0f0f',
    statusInfo: '#0a1f2e',
  },

  // Gradients
  gradients: {
    primary: ['#f0a47a', '#c67548'],
    secondary: ['#a8d8c8', '#72baa1'],
    warm: ['#f0a47a', '#ef4444'],
    cool: ['#72baa1', '#0ea5e9'],
    sunset: ['#f5c4a6', '#f0a47a', '#c67548'],
    ocean: ['#a8d8c8', '#72baa1', '#478571'],
  },

  // Semantic Colors (mode-independent)
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Overlay variations
  overlay: {
    light: 'rgba(0, 0, 0, 0.08)',
    medium: 'rgba(0, 0, 0, 0.3)',
    heavy: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },

  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.1)',
    heavy: 'rgba(0, 0, 0, 0.2)',
  },
};

export default colors;
