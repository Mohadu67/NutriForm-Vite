import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const Badge = ({ count, color = 'primary', maxCount = 99 }) => {
  if (!count || count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const backgroundColor = color === 'primary' ? theme.colors.primary : color;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  text: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 16,
  },
});

export default Badge;
