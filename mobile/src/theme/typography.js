/**
 * HarmoNith - Typography System
 * Tailles de police, weights et styles de texte
 */

import { Platform } from 'react-native';

// Font Families
export const fontFamilies = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
};

// Font Weights
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

// Font Sizes
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 42,
  '7xl': 48,
};

// Line Heights
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

// Letter Spacing
export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 1.5,
};

// Typography Styles
export const typography = {
  // Display Styles
  displayLarge: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['7xl'],
    lineHeight: fontSizes['7xl'] * lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  displayMedium: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['6xl'],
    lineHeight: fontSizes['6xl'] * lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['5xl'],
    lineHeight: fontSizes['5xl'] * lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.normal,
  },

  // Heading Styles
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['4xl'],
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.normal,
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.normal,
  },
  h3: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.normal,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.normal,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacing.normal,
  },

  // Body Styles
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },

  // Label Styles
  labelLarge: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  labelMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  labelSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wider,
  },

  // Button Styles
  buttonLarge: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacing.wide,
  },
  buttonMedium: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.tight,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacing.wide,
  },
  buttonSmall: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.tight,
    fontWeight: fontWeights.semiBold,
    letterSpacing: letterSpacing.wider,
  },

  // Caption Styles
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    fontWeight: fontWeights.regular,
    letterSpacing: letterSpacing.normal,
  },
  captionBold: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },

  // Overline Style
  overline: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
  },
};

export default typography;
