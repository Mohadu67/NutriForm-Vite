import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { theme } from '../../theme';

const Card = ({ children, style, shadow = 'md' }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardStyles = [
    styles.card,
    isDark ? styles.cardDark : styles.cardLight,
    shadow && theme.shadows[shadow],
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  cardLight: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cardDark: {
    backgroundColor: theme.colors.background.dark,
    borderWidth: 1,
    borderColor: '#333333',
  },
});

export default Card;
