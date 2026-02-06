import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * Composant réutilisable pour afficher les notes
 * @param {number} avgRating - Note moyenne (0-5)
 * @param {number} ratingsCount - Nombre d'avis
 * @param {string} size - Taille: 'small' (pour cards) ou 'large' (pour détail)
 */
const RatingDisplay = ({ avgRating = 0, ratingsCount = 0, size = 'large' }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (avgRating <= 0) {
    return null;
  }

  const isSmall = size === 'small';
  const starSize = isSmall ? 12 : 20;
  const containerStyle = isSmall ? styles.containerSmall : styles.container;
  const textStyle = isSmall ? styles.textSmall : styles.text;

  return (
    <View style={[containerStyle, isDark && styles.containerDark]}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.round(avgRating) ? 'star' : 'star-outline'}
            size={starSize}
            color="#F59E0B"
          />
        ))}
      </View>
      <Text style={[textStyle, isDark && styles.textDark]}>
        {avgRating.toFixed(1)} ({ratingsCount} avis)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  containerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  containerDark: {},
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  text: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  textSmall: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  textDark: {
    color: '#888',
  },
});

export default RatingDisplay;
