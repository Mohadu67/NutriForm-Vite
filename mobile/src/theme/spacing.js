/**
 * HarmoNith - Spacing & Layout System
 * Espacements, radius et dimensions
 */

// Base Spacing Unit (4px)
const BASE_UNIT = 4;

// Spacing Scale
export const spacing = {
  xxs: BASE_UNIT,           // 4px
  xs: BASE_UNIT * 2,        // 8px
  sm: BASE_UNIT * 3,        // 12px
  md: BASE_UNIT * 4,        // 16px
  lg: BASE_UNIT * 5,        // 20px
  xl: BASE_UNIT * 6,        // 24px
  '2xl': BASE_UNIT * 8,     // 32px
  '3xl': BASE_UNIT * 10,    // 40px
  '4xl': BASE_UNIT * 12,    // 48px
  '5xl': BASE_UNIT * 16,    // 64px
  '6xl': BASE_UNIT * 20,    // 80px
  '7xl': BASE_UNIT * 24,    // 96px
};

// Border Radius
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
  round: '50%',
};

// Component-specific radius
export const componentRadius = {
  button: borderRadius.md,
  buttonLarge: borderRadius.lg,
  card: borderRadius.lg,
  input: borderRadius.md,
  modal: borderRadius.xl,
  bottomSheet: borderRadius.xl,
  badge: borderRadius.full,
  chip: borderRadius.full,
  avatar: borderRadius.full,
  image: borderRadius.md,
  imageRound: borderRadius.full,
};

// Layout Dimensions
export const layout = {
  // Container widths
  containerXs: 480,
  containerSm: 640,
  containerMd: 768,
  containerLg: 1024,
  containerXl: 1280,

  // Screen padding
  screenPaddingHorizontal: spacing.md,
  screenPaddingVertical: spacing.lg,

  // Safe area
  safeAreaTop: 44,
  safeAreaBottom: 34,

  // Header
  headerHeight: 56,
  headerHeightLarge: 96,

  // Tab bar
  tabBarHeight: 56,
  tabBarHeightWithSafeArea: 90,

  // Input heights
  inputHeightSmall: 36,
  inputHeightMedium: 44,
  inputHeightLarge: 52,

  // Button heights
  buttonHeightSmall: 36,
  buttonHeightMedium: 44,
  buttonHeightLarge: 52,
  buttonHeightExtraLarge: 56,

  // Icon sizes
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 28,
  iconXl: 32,
  icon2xl: 40,
  icon3xl: 48,

  // Avatar sizes
  avatarXs: 24,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 48,
  avatarXl: 64,
  avatar2xl: 80,
  avatar3xl: 96,

  // Card dimensions
  cardMinHeight: 120,
  cardImageHeight: 200,

  // Modal
  modalMaxWidth: 480,
  modalPadding: spacing.xl,

  // Bottom Sheet
  bottomSheetHandleWidth: 40,
  bottomSheetHandleHeight: 4,
};

// Border Widths
export const borderWidth = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
  extraThick: 4,
};

// Z-index Scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  overlay: 1800,
};

// Opacity Scale
export const opacity = {
  transparent: 0,
  minimal: 0.05,
  light: 0.1,
  medium: 0.3,
  heavy: 0.5,
  strong: 0.7,
  intense: 0.9,
  opaque: 1,
};

// Animation Durations (ms)
export const duration = {
  instant: 0,
  fastest: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  slower: 600,
  slowest: 800,
};

// Animation Easing
export const easing = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

export default {
  spacing,
  borderRadius,
  componentRadius,
  layout,
  borderWidth,
  zIndex,
  opacity,
  duration,
  easing,
};
