/**
 * HarmoNith - Color Palette
 * Palette complète avec support light/dark mode
 */

export const colors = {
  // Primary Colors
  primary: '#F7B186',
  primaryDark: '#E89A6F',
  primaryLight: '#F9C4A3',

  // Secondary Colors
  secondary: '#B8DDD1',
  secondaryDark: '#A0C9BD',
  secondaryLight: '#D0EDE4',

  // Accent Colors
  accent: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  // Light Mode
  light: {
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#F0F2F5',

    // Surfaces
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceOverlay: 'rgba(0, 0, 0, 0.5)',

    // Text
    text: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textTertiary: '#888888',
    textDisabled: '#CCCCCC',
    textInverse: '#FFFFFF',

    // Borders
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    borderDark: '#CCCCCC',

    // Interactive
    interactive: '#F7B186',
    interactiveHover: '#E89A6F',
    interactivePressed: '#D9865E',
    interactiveDisabled: '#F5E6DD',

    // Status
    statusSuccess: '#E8F5E9',
    statusWarning: '#FFF3E0',
    statusError: '#FFEBEE',
    statusInfo: '#E3F2FD',
  },

  // Dark Mode
  dark: {
    // Backgrounds
    background: '#12151A',
    backgroundSecondary: '#1A1D24',
    backgroundTertiary: '#22262E',

    // Surfaces
    surface: '#1A1D24',
    surfaceElevated: '#22262E',
    surfaceOverlay: 'rgba(0, 0, 0, 0.7)',

    // Text
    text: '#E9ECF1',
    textSecondary: '#C5C9D1',
    textTertiary: '#8A8E96',
    textDisabled: '#505460',
    textInverse: '#1A1A1A',

    // Borders
    border: '#2A2E36',
    borderLight: '#22262E',
    borderDark: '#383C44',

    // Interactive
    interactive: '#F7B186',
    interactiveHover: '#F9C4A3',
    interactivePressed: '#E89A6F',
    interactiveDisabled: '#3A3028',

    // Status
    statusSuccess: '#1B3A1E',
    statusWarning: '#3D3420',
    statusError: '#3D1F1E',
    statusInfo: '#1E2A3D',
  },

  // Gradients
  gradients: {
    primary: ['#F7B186', '#E89A6F'],
    secondary: ['#B8DDD1', '#A0C9BD'],
    warm: ['#F7B186', '#FF6B6B'],
    cool: ['#B8DDD1', '#2196F3'],
    sunset: ['#F9C4A3', '#F7B186', '#E89A6F'],
    ocean: ['#D0EDE4', '#B8DDD1', '#A0C9BD'],
  },

  // Semantic Colors (mode-independent)
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Overlay variations
  overlay: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.3)',
    heavy: 'rgba(0, 0, 0, 0.6)',
    dark: 'rgba(0, 0, 0, 0.8)',
  },

  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
    heavy: 'rgba(0, 0, 0, 0.25)',
  },
};

export default colors;
