/**
 * HarmoNith - Theme System
 * Export centralisé + hook useTheme avec support dark mode
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';

// Import individual exports for backwards compatibility
import { spacing as spacingValues, borderRadius } from './spacing';
import { fontSizes, fontWeights } from './typography';
import { shadows as shadowValues } from './shadows';

// Theme Context
const ThemeContext = createContext({
  isDark: false,
  theme: {},
  toggleTheme: () => {},
  setTheme: () => {},
});

// Storage key for theme preference
const THEME_STORAGE_KEY = '@harmonith_theme_mode';

/**
 * Theme Provider Component
 * Gère le mode dark/light et persiste la préférence
 */
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('auto'); // 'light', 'dark', 'auto'
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine if dark mode is active
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'auto' && systemColorScheme === 'dark');

  // Get theme colors based on mode
  const themeColors = isDark ? colors.dark : colors.light;

  // Build complete theme object for ThemeProvider
  const contextTheme = {
    colors: {
      ...colors,
      ...themeColors,
      primary: colors.primary,
      primaryDark: colors.primaryDark,
      primaryLight: colors.primaryLight,
      secondary: colors.secondary,
      secondaryDark: colors.secondaryDark,
      secondaryLight: colors.secondaryLight,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      accent: colors.accent,
    },
    typography,
    spacing,
    shadows,
    isDark,
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
    saveThemePreference(newMode);
  };

  const setTheme = (mode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  const value = {
    isDark,
    theme: contextTheme,
    themeMode,
    toggleTheme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme Hook
 * Retourne le theme actuel et les utilitaires
 *
 * @returns {Object} { isDark, theme, toggleTheme, setTheme, themeMode, isLoading }
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

/**
 * withTheme HOC
 * Injecte le theme dans un composant
 */
export const withTheme = (Component) => {
  return (props) => {
    const themeContext = useTheme();
    return <Component {...props} themeContext={themeContext} />;
  };
};

// Export all theme modules
export { colors, typography, spacing, shadows };

/**
 * Static theme object for components that don't use ThemeProvider
 * Backwards compatible with old theme.js structure
 */
export const theme = {
  colors: {
    // Primary/Secondary
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    primaryLight: colors.primaryLight,
    secondary: colors.secondary,
    secondaryDark: colors.secondaryDark,
    secondaryLight: colors.secondaryLight,
    // Status colors
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    accent: colors.accent,
    // Nested structures for backwards compatibility
    background: {
      light: colors.light.background,
      dark: colors.dark.background,
    },
    text: {
      primary: colors.light.text,
      secondary: colors.light.textSecondary,
      light: colors.light.textTertiary,
      inverse: colors.light.textInverse,
    },
    border: {
      light: colors.light.border,
      medium: colors.light.borderDark,
      dark: colors.light.borderDark,
    },
    // Also include flat light mode values
    ...colors.light,
  },
  // Spacing (flat access)
  spacing: spacingValues,
  // Border radius (flat access)
  borderRadius,
  // Font sizes (flat access)
  fontSize: fontSizes,
  // Font weights (flat access)
  fontWeight: fontWeights,
  // Shadows (flat access)
  shadows: shadowValues,
  // Full modules for advanced usage
  typography,
  spacingModule: spacing,
  shadowsModule: shadows,
  isDark: false,
};

export default theme;
