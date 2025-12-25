import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const Avatar = ({ source, size = 'md', fallback }) => {
  const sizeStyles = styles[size];
  const textSizeStyles = styles[`${size}Text`];

  const renderContent = () => {
    if (source) {
      return (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={[styles.image, sizeStyles]}
          resizeMode="cover"
        />
      );
    }

    if (fallback) {
      return (
        <View style={[styles.fallback, sizeStyles]}>
          <Text style={[styles.fallbackText, textSizeStyles]}>{fallback}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.placeholder, sizeStyles]}>
        <Text style={[styles.placeholderText, textSizeStyles]}>?</Text>
      </View>
    );
  };

  return <View style={[styles.container, sizeStyles]}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  placeholder: {
    backgroundColor: theme.colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: theme.colors.text.light,
    fontWeight: theme.fontWeight.medium,
  },

  // Sizes
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 48,
    height: 48,
  },
  lg: {
    width: 64,
    height: 64,
  },

  // Text sizes
  smText: {
    fontSize: theme.fontSize.xs,
  },
  mdText: {
    fontSize: theme.fontSize.md,
  },
  lgText: {
    fontSize: theme.fontSize.lg,
  },
});

export default Avatar;
