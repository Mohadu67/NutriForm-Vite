import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import { theme } from '../../theme';

// Configuration des types de cycles
const CYCLE_TYPES = {
  exercise: { icon: 'barbell', color: theme.colors.primary },
  rest: { icon: 'bed', color: '#22C55E' },
  transition: { icon: 'swap-horizontal', color: '#3B82F6' },
};

export default function CycleItem({
  cycle,
  index,
  isActive = false,
  isCompleted = false,
  onPress,
  showOrder = true,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const typeConfig = CYCLE_TYPES[cycle.type] || CYCLE_TYPES.exercise;

  // Calculer la durée affichée
  const getDuration = () => {
    if (cycle.type === 'rest' || cycle.type === 'transition') {
      return `${cycle.restSec || 0}s`;
    }

    const totalSec = (cycle.durationSec || 0) + ((cycle.durationMin || 0) * 60);
    if (totalSec > 0) {
      if (totalSec >= 60) {
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
      }
      return `${totalSec}s`;
    }

    // Si pas de durée, afficher reps/sets
    if (cycle.reps) {
      return cycle.sets ? `${cycle.sets}x${cycle.reps}` : `${cycle.reps} reps`;
    }

    return '';
  };

  // Nom à afficher
  const getName = () => {
    if (cycle.type === 'rest') return 'Repos';
    if (cycle.type === 'transition') return 'Transition';
    return cycle.exerciseName || 'Exercice';
  };

  // Verifier si une URL est un SVG
  const isSvgUrl = (url) => {
    if (!url) return false;
    return url.includes('.svg') || url.includes('/svg/') || url.includes('format=svg');
  };

  // State pour gérer l'erreur de chargement d'image
  const [imageError, setImageError] = React.useState(false);

  // Rendre l'image de l'exercice ou l'icône par défaut
  const renderExerciseVisual = (cycle, typeConfig, isDark) => {
    const imageUrl = cycle.exerciseImage;

    // Si pas d'image, erreur de chargement, ou type repos/transition, afficher l'icône
    if (!imageUrl || cycle.type !== 'exercise' || imageError) {
      return (
        <View style={[styles.iconContainer, { backgroundColor: `${typeConfig.color}20` }]}>
          <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
        </View>
      );
    }

    // Si c'est un SVG
    if (isSvgUrl(imageUrl)) {
      return (
        <View style={[styles.imageContainer, isDark && styles.imageContainerDark]}>
          <SvgUri
            width={40}
            height={40}
            uri={imageUrl}
            onError={() => {
              console.log('[CycleItem] SVG load error:', imageUrl);
              setImageError(true);
            }}
          />
        </View>
      );
    }

    // Image normale (PNG, JPG, GIF)
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.exerciseImage}
        resizeMode="contain"
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDark && styles.containerDark,
        isActive && styles.containerActive,
        isCompleted && styles.containerCompleted,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Numéro d'ordre */}
      {showOrder && (
        <View style={[styles.orderBadge, { backgroundColor: typeConfig.color }]}>
          <Text style={styles.orderText}>{index + 1}</Text>
        </View>
      )}

      {/* Image exercice ou icône type */}
      {renderExerciseVisual(cycle, typeConfig, isDark)}

      {/* Infos */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.name, isDark && styles.nameDark, isCompleted && styles.nameCompleted]}
          numberOfLines={1}
        >
          {getName()}
        </Text>

        {cycle.notes && (
          <Text
            style={[styles.notes, isDark && styles.notesDark]}
            numberOfLines={1}
          >
            {cycle.notes}
          </Text>
        )}
      </View>

      {/* Durée/Reps */}
      <View style={styles.durationContainer}>
        <Text style={[styles.duration, isDark && styles.durationDark]}>
          {getDuration()}
        </Text>

        {/* Intensité */}
        {cycle.intensity && cycle.type === 'exercise' && (
          <View style={styles.intensityRow}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.intensityDot,
                  i < Math.round(cycle.intensity / 2) && styles.intensityDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Indicateur de statut */}
      {isCompleted && (
        <View style={styles.checkContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
        </View>
      )}

      {isActive && !isCompleted && (
        <View style={styles.activeIndicator} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  containerActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: `${theme.colors.primary}10`,
  },
  containerCompleted: {
    opacity: 0.7,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  orderText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  imageContainerDark: {
    backgroundColor: '#333',
  },
  exerciseImage: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  nameDark: {
    color: '#FFFFFF',
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
  },
  notes: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  notesDark: {
    color: '#888',
  },
  durationContainer: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.sm,
  },
  duration: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  durationDark: {
    color: '#FFFFFF',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  intensityDotActive: {
    backgroundColor: '#EF4444',
  },
  checkContainer: {
    marginLeft: theme.spacing.sm,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.borderRadius.md,
    borderBottomLeftRadius: theme.borderRadius.md,
  },
});
