import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
            color={isFavorite ? '#ef4444' : '#d6d3d1'}
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
        {/* Title Row with Rating Badge */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, isDark && styles.titleDark]} numberOfLines={2}>
            {recipe.title}
          </Text>
          {recipe.avgRating > 0 && (
            <View style={[styles.ratingBadge, isDark && styles.ratingBadgeDark]}>
              <Ionicons name="star" size={12} color="#d4a96a" />
              <Text style={styles.ratingText}>
                {recipe.avgRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, isDark && styles.tagDark]}>
                <Text style={[styles.tagText, isDark && styles.tagTextDark]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Meta Row */}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={isDark ? '#7a7a88' : '#a8a29e'} />
            <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
              {totalTime} min
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="flame-outline" size={14} color={isDark ? '#7a7a88' : '#a8a29e'} />
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
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efedea',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
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
    padding: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  titleDark: {
    color: '#f3f3f6',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingBadgeDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78716c',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  tag: {
    backgroundColor: '#f5f5f4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tagText: {
    fontSize: 10,
    color: '#78716c',
  },
  tagTextDark: {
    color: '#7a7a88',
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#a8a29e',
  },
  metaTextDark: {
    color: '#7a7a88',
  },
});

export default RecipeCard;
