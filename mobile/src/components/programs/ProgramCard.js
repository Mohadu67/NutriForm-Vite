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
import { theme } from '../../theme';

// Configuration des types de programme
const PROGRAM_TYPES = {
  hiit: { label: 'HIIT', icon: 'flash', color: '#EF4444' },
  circuit: { label: 'Circuit', icon: 'reload', color: '#F59E0B' },
  tabata: { label: 'Tabata', icon: 'timer', color: '#22C55E' },
  emom: { label: 'EMOM', icon: 'stopwatch', color: '#3B82F6' },
  amrap: { label: 'AMRAP', icon: 'trending-up', color: '#8B5CF6' },
  superset: { label: 'Superset', icon: 'swap-horizontal', color: '#EC4899' },
  custom: { label: 'Custom', icon: 'construct', color: '#6B7280' },
};

// Configuration des difficultés
const DIFFICULTIES = {
  'débutant': { label: 'Débutant', color: '#22C55E' },
  'intermédiaire': { label: 'Intermédiaire', color: '#F59E0B' },
  'avancé': { label: 'Avancé', color: '#EF4444' },
};

export default function ProgramCard({
  program,
  isFavorite = false,
  isOwner = false,
  onPress,
  onToggleFavorite,
  onEdit,
  onPropose,
  style,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const typeConfig = PROGRAM_TYPES[program.type] || PROGRAM_TYPES.custom;
  const difficultyConfig = DIFFICULTIES[program.difficulty] || DIFFICULTIES['intermédiaire'];

  // Calculer la durée réelle en minutes à partir des cycles
  const calculateDuration = () => {
    if (program.cycles && program.cycles.length > 0) {
      let totalSeconds = 0;
      program.cycles.forEach((cycle) => {
        if (cycle.type === 'rest' || cycle.type === 'transition') {
          totalSeconds += cycle.restSec || 0;
        } else {
          const cycleDuration = (cycle.durationSec || 0) + ((cycle.durationMin || 0) * 60);
          if (cycleDuration > 0) {
            totalSeconds += cycleDuration;
          } else if (cycle.reps && cycle.sets) {
            totalSeconds += cycle.reps * cycle.sets * 3 + (cycle.sets - 1) * 60;
          } else if (cycle.reps) {
            totalSeconds += cycle.reps * 3;
          }
          if (cycle.restSec) totalSeconds += cycle.restSec;
        }
      });
      return Math.round(totalSeconds / 60);
    }
    return program.estimatedDuration || Math.round((program.totalDuration || 0) / 60);
  };
  const duration = calculateDuration();

  // Nombre de cycles
  const cyclesCount = program.cycles?.length || program.totalCycles || 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDark && styles.containerDark,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image ou placeholder */}
      <View style={styles.imageContainer}>
        {program.coverImage ? (
          <Image
            source={{ uri: program.coverImage }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: `${typeConfig.color}20` }]}>
            <Ionicons name={typeConfig.icon} size={32} color={typeConfig.color} />
          </View>
        )}

        {/* Badge type */}
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
          <Ionicons name={typeConfig.icon} size={12} color="#FFF" />
          <Text style={styles.typeBadgeText}>{typeConfig.label}</Text>
        </View>

        {/* Bouton favori */}
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite(program._id);
            }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#EF4444' : '#FFF'}
            />
          </TouchableOpacity>
        )}

        {/* Badge difficulté */}
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyConfig.color }]}>
          <Text style={styles.difficultyText}>{difficultyConfig.label}</Text>
        </View>
      </View>

      {/* Infos */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.name, isDark && styles.nameDark]}
          numberOfLines={2}
        >
          {program.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isDark ? '#888' : theme.colors.text.secondary}
            />
            <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
              {duration} min
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons
              name="layers-outline"
              size={14}
              color={isDark ? '#888' : theme.colors.text.secondary}
            />
            <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
              {cyclesCount} cycles
            </Text>
          </View>

          {program.avgRating > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.metaText, isDark && styles.metaTextDark]}>
                {program.avgRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Status badge for owner programs */}
        {isOwner && program.status && (
          <View style={styles.statusRow}>
            {program.status === 'private' && (
              <View style={[styles.statusBadge, styles.statusPrivate]}>
                <Ionicons name="lock-closed" size={10} color="#6B7280" />
                <Text style={styles.statusTextPrivate}>Privé</Text>
              </View>
            )}
            {program.status === 'pending' && (
              <View style={[styles.statusBadge, styles.statusPending]}>
                <Ionicons name="time" size={10} color="#F59E0B" />
                <Text style={styles.statusTextPending}>En attente</Text>
              </View>
            )}
            {program.status === 'public' && (
              <View style={[styles.statusBadge, styles.statusPublic]}>
                <Ionicons name="globe" size={10} color="#22C55E" />
                <Text style={styles.statusTextPublic}>Public</Text>
              </View>
            )}
          </View>
        )}

        {/* Owner action buttons */}
        {isOwner && (
          <View style={styles.ownerActions}>
            {onEdit && (
              <TouchableOpacity
                style={[styles.actionBtn, isDark && styles.actionBtnDark]}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(program);
                }}
              >
                <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.actionBtnText}>Modifier</Text>
              </TouchableOpacity>
            )}
            {onPropose && program.status === 'private' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.proposeBtnBg, isDark && styles.actionBtnDark]}
                onPress={(e) => {
                  e.stopPropagation();
                  onPropose(program._id);
                }}
              >
                <Ionicons name="globe-outline" size={14} color="#3B82F6" />
                <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Proposer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: theme.spacing.md,
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    padding: theme.spacing.sm,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  nameDark: {
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  metaTextDark: {
    color: '#888',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  statusPrivate: {
    backgroundColor: '#F3F4F6',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPublic: {
    backgroundColor: '#D1FAE5',
  },
  statusTextPrivate: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusTextPending: {
    fontSize: 10,
    fontWeight: '500',
    color: '#D97706',
  },
  statusTextPublic: {
    fontSize: 10,
    fontWeight: '500',
    color: '#059669',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: `${theme.colors.primary}15`,
    gap: 4,
  },
  actionBtnDark: {
    backgroundColor: `${theme.colors.primary}25`,
  },
  proposeBtnBg: {
    backgroundColor: '#EFF6FF',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
