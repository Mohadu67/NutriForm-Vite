import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : theme.colors.primary}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 40,
  },
  md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 52,
  },
  lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 58,
  },

  // Disabled
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  outlineText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  ghostText: {
    color: theme.colors.primary,
    fontSize: 16,
  },

  // Text sizes
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },

  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
