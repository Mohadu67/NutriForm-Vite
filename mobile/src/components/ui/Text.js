import React from 'react';
import { Text as RNText, StyleSheet, useColorScheme } from 'react-native';
import { theme } from '../../theme';

const Text = ({
  children,
  variant = 'body',
  color,
  weight = 'regular',
  style,
  ...rest
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textStyles = [
    styles[variant],
    color && { color },
    !color && (isDark ? styles.textDark : styles.textLight),
    weight && { fontWeight: theme.fontWeight[weight] },
    style,
  ];

  return (
    <RNText style={textStyles} {...rest}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  // Variants
  h1: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 48,
  },
  h2: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 40,
  },
  h3: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    lineHeight: 32,
  },
  body: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.regular,
    lineHeight: 24,
  },
  caption: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular,
    lineHeight: 20,
  },

  // Color modes
  textLight: {
    color: theme.colors.text.primary,
  },
  textDark: {
    color: theme.colors.text.inverse,
  },
});

export default Text;
