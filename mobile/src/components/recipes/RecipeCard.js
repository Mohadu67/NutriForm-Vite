import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const RecipeCard = ({ recipe, isFavorite, onPress, onToggleFavorite }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.image || 'https://via.placeholder.com/200' }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Favorite button overlay */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? '#EF4444' : '#FFF'}
          />
        </TouchableOpacity>

        {/* Difficulty badge */}
        <View style={[
          styles.difficultyBadge,
          { backgroundColor: getDifficultyColor(recipe.difficulty) }
        ]}>
          <Text style={styles.difficultyText}>
            {recipe.difficulty?.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, isDark && styles.titleDark]} numberOfLines={2}>
          {recipe.title}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
              {totalTime} min
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="flame-outline" size={14} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
              {recipe.nutrition?.calories || 0} kcal
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

function getDifficultyColor(difficulty) {
  const colors = {
    'easy': '#22C55E',
    'medium': '#F59E0B',
    'hard': '#EF4444',
    // Support legacy French values
    'facile': '#22C55E',
    'moyen': '#F59E0B',
    'difficile': '#EF4444',
  };
  return colors[difficulty] || '#999';
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  info: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  meta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: '#666',
  },
  metaTextDark: {
    color: '#888',
  },
});

export default RecipeCard;
