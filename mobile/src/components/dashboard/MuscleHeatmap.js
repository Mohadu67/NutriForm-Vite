import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FRONT_PATHS, BACK_PATHS, SVG_VIEWBOX_FRONT, SVG_VIEWBOX_BACK, ELEM_TO_ZONE } from '../BodyPicker/bodyPaths';
import { ZONE_LABELS } from '../BodyPicker/muscleZones';

// Mapping des noms de muscles vers les zones du SVG
const MUSCLE_TO_ZONE = {
  pectoraux: 'pectoraux', chest: 'pectoraux', pecs: 'pectoraux',
  epaules: 'epaules', shoulders: 'epaules', deltoides: 'epaules', deltoïdes: 'epaules',
  biceps: 'biceps', triceps: 'triceps', 'avant-bras': 'avant-bras', forearms: 'avant-bras',
  abdos: 'abdos-centre', abs: 'abdos-centre', 'abdos-centre': 'abdos-centre',
  'abdos-lateraux': 'abdos-lateraux', obliques: 'abdos-lateraux', core: 'abdos-centre',
  dos: 'dos-inferieur', back: 'dos-inferieur', 'dos-superieur': 'dos-superieur',
  'dos-inferieur': 'dos-inferieur', lats: 'dos-inferieur', 'dos-lats': 'dos-inferieur',
  traps: 'dos-superieur', trapeze: 'dos-superieur', trapèzes: 'dos-superieur', rhomboides: 'dos-superieur',
  quadriceps: 'cuisses-externes', quads: 'cuisses-externes', cuisses: 'cuisses-externes',
  'cuisses-externes': 'cuisses-externes', 'cuisses-internes': 'cuisses-internes',
  ischio: 'cuisses-internes', ischios: 'cuisses-internes', hamstrings: 'cuisses-internes',
  // Adducteurs et Abducteurs
  adducteurs: 'cuisses-internes', adductor: 'cuisses-internes',
  abducteurs: 'cuisses-externes', abductor: 'cuisses-externes',
  fessiers: 'fessiers', glutes: 'fessiers', gluteus: 'fessiers',
  mollets: 'mollets', calves: 'mollets',
};

// Couleurs d'intensité (du vert clair au rouge)
const INTENSITY_COLORS = [
  { fill: '#b8e6cf', stroke: '#7bc9a3' }, // Faible
  { fill: '#8fd9b6', stroke: '#5cb88a' },
  { fill: '#f7d794', stroke: '#f5b041' }, // Moyen
  { fill: '#f5a962', stroke: '#e67e22' },
  { fill: '#e74c3c', stroke: '#c0392b' }, // Intense
];

// Mapping elem SVG vers zone
const ELEM_TO_ZONE_MAP = {
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  FOREARMS: 'avant-bras',
  CHEST: 'pectoraux',
  SHOULDERS: 'epaules',
  ABDOMINALS: 'abdos-centre',
  OBLIQUES: 'abdos-lateraux',
  TRAPS: 'dos-superieur',
  BACK: 'dos-inferieur',
  GLUTES: 'fessiers',
  QUADRICEPS: 'cuisses-externes',
  HAMSTRINGS: 'cuisses-internes',
  CALVES: 'mollets',
};

/**
 * MuscleHeatmap - Carte du corps avec intensité musculaire
 * Affiche les muscles travaillés avec un dégradé de couleur selon l'intensité
 */
export const MuscleHeatmap = ({ sessions = [], muscleStats: externalStats = null }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [view, setView] = useState('front');
  const [filter, setFilter] = useState('week-0');

  // Obtenir les limites de la semaine
  const getWeekBounds = useCallback((weeksAgo = 0) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - diff - (weeksAgo * 7));
    startOfThisWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfThisWeek);
    endOfWeek.setDate(startOfThisWeek.getDate() + 7);

    return { start: startOfThisWeek, end: endOfWeek };
  }, []);

  // Sessions triées et filtrées
  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      const dateA = new Date(a?.startedAt || a?.endedAt || a?.createdAt || 0);
      const dateB = new Date(b?.startedAt || b?.endedAt || b?.createdAt || 0);
      return dateB - dateA;
    });

    if (filter === 'all') return sorted;

    if (filter.startsWith('week-')) {
      const weeksAgo = parseInt(filter.replace('week-', ''), 10);
      const { start, end } = getWeekBounds(weeksAgo);
      return sorted.filter((s) => {
        const date = new Date(s?.startedAt || s?.endedAt || s?.createdAt || 0);
        return date >= start && date < end;
      });
    }

    return sorted;
  }, [sessions, filter, getWeekBounds]);

  // Calculer les stats musculaires
  const muscleStats = useMemo(() => {
    if (externalStats && filter === 'all' && !sessions.length) {
      return externalStats;
    }

    if (!filteredSessions.length) return {};

    const muscleCount = {};
    const addMuscle = (muscle, weight = 1) => {
      const key = String(muscle || '').toLowerCase().trim();
      if (key && key !== 'undefined' && key !== 'null') {
        muscleCount[key] = (muscleCount[key] || 0) + weight;
      }
    };

    filteredSessions.forEach((session) => {
      const entries = session?.entries || session?.items || session?.exercises || [];
      if (entries.length > 0) {
        console.log('[MuscleHeatmap] Session entries sample:', entries[0]);
      }
      entries.forEach((entry) => {
        if (!entry) return;

        if (entry.primaryMuscle) {
          addMuscle(entry.primaryMuscle, 1);
          const secondaries = entry.secondaryMuscles || [];
          if (Array.isArray(secondaries)) {
            secondaries.forEach((m) => addMuscle(m, 0.3));
          }
          return;
        }

        if (entry.muscle) { addMuscle(entry.muscle, 1); return; }
        if (entry.muscleGroup) { addMuscle(entry.muscleGroup, 1); return; }

        const entryMuscles = entry.muscles;
        if (Array.isArray(entryMuscles) && entryMuscles.length > 0) {
          addMuscle(entryMuscles[0], 1);
          entryMuscles.slice(1).forEach((m) => addMuscle(m, 0.3));
        }
      });
    });

    return muscleCount;
  }, [filteredSessions, externalStats, filter, sessions.length]);

  // Calculer l'intensité pour chaque zone
  const zoneIntensities = useMemo(() => {
    const zones = {};
    let maxCount = 0;

    Object.entries(muscleStats).forEach(([muscle, count]) => {
      const zone = MUSCLE_TO_ZONE[muscle.toLowerCase()];
      if (zone) {
        zones[zone] = (zones[zone] || 0) + count;
        maxCount = Math.max(maxCount, zones[zone]);
      } else {
        console.log('[MuscleHeatmap] Muscle not mapped:', muscle);
      }
    });

    if (Object.keys(zones).length > 0) {
      console.log('[MuscleHeatmap] Zone intensities:', zones);
    }

    const normalized = {};
    Object.entries(zones).forEach(([zone, count]) => {
      const ratio = maxCount > 0 ? count / maxCount : 0;
      const level = Math.min(4, Math.floor(ratio * 5));
      normalized[zone] = { count, level, color: INTENSITY_COLORS[level] };
    });

    return normalized;
  }, [muscleStats]);

  // Top 3 muscles
  const topMuscles = useMemo(() => {
    return Object.entries(zoneIntensities)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([zone, data]) => ({ zone, ...data }));
  }, [zoneIntensities]);

  const hasData = Object.keys(zoneIntensities).length > 0;
  const currentPaths = view === 'front' ? FRONT_PATHS : BACK_PATHS;
  const currentViewBox = view === 'front' ? SVG_VIEWBOX_FRONT : SVG_VIEWBOX_BACK;

  // Couleurs inactives
  const inactiveFill = isDark ? 'rgba(80, 80, 80, 0.4)' : 'rgba(52, 72, 94, 0.15)';
  const inactiveStroke = isDark ? 'rgba(100, 100, 100, 0.6)' : 'rgba(38, 48, 68, 0.35)';

  // Rendu d'un groupe de paths
  const renderMuscleGroup = (elemName, paths) => {
    if (elemName === 'DECORATIVE') return null;

    const zoneId = ELEM_TO_ZONE_MAP[elemName];
    if (!zoneId) return null;

    const intensity = zoneIntensities[zoneId];
    const fillColor = intensity ? intensity.color.fill : inactiveFill;
    const strokeColor = intensity ? intensity.color.stroke : inactiveStroke;

    return (
      <G key={elemName}>
        {paths.map((pathData, index) => (
          <Path
            key={index}
            d={pathData.d}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={intensity ? 1.5 : 0.8}
            strokeLinejoin="round"
          />
        ))}
      </G>
    );
  };

  const periodOptions = [
    { value: 'week-0', label: 'Semaine', icon: 'calendar' },
    { value: 'week-1', label: '-1 sem.', icon: 'time' },
    { value: 'all', label: 'Tout', icon: 'stats-chart' },
  ];

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Filtres période */}
      <View style={styles.filters}>
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterPill,
              filter === option.value && styles.filterPillActive,
              isDark && styles.filterPillDark,
              filter === option.value && isDark && styles.filterPillActiveDark,
            ]}
            onPress={() => setFilter(option.value)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={option.icon}
              size={14}
              color={filter === option.value ? '#FFFFFF' : (isDark ? '#888' : '#666')}
            />
            <Text
              style={[
                styles.filterPillText,
                filter === option.value && styles.filterPillTextActive,
                isDark && styles.filterPillTextDark,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggle Face/Dos */}
      <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            view === 'front' && styles.toggleButtonActive,
          ]}
          onPress={() => setView('front')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.toggleText,
            view === 'front' && styles.toggleTextActive,
            isDark && view !== 'front' && styles.toggleTextDark,
          ]}>
            Face
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            view === 'back' && styles.toggleButtonActive,
          ]}
          onPress={() => setView('back')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.toggleText,
            view === 'back' && styles.toggleTextActive,
            isDark && view !== 'back' && styles.toggleTextDark,
          ]}>
            Dos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Corps SVG */}
      <View style={styles.bodyWrapper}>
        <Svg
          width="100%"
          height={280}
          viewBox={currentViewBox}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Éléments décoratifs */}
          {currentPaths.DECORATIVE && currentPaths.DECORATIVE.map((pathData, index) => (
            <Path
              key={`deco-${index}`}
              d={pathData.d}
              fill={isDark ? '#4A4A4A' : '#B8B8B8'}
              stroke={isDark ? '#5A5A5A' : '#999999'}
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          ))}

          {/* Zones musculaires */}
          {Object.entries(currentPaths).map(([elemName, paths]) =>
            renderMuscleGroup(elemName, paths)
          )}
        </Svg>
      </View>

      {/* Légende */}
      {hasData ? (
        <View style={styles.legend}>
          <Text style={[styles.legendTitle, isDark && styles.legendTitleDark]}>
            Muscles les plus travaillés
          </Text>
          <View style={styles.topMuscles}>
            {topMuscles.map((muscle, index) => (
              <View key={muscle.zone} style={styles.muscleItem}>
                <View style={[styles.muscleRank, { backgroundColor: muscle.color.fill }]}>
                  <Text style={styles.muscleRankText}>{index + 1}</Text>
                </View>
                <Text style={[styles.muscleName, isDark && styles.muscleNameDark]}>
                  {ZONE_LABELS[muscle.zone] || muscle.zone}
                </Text>
                <Text style={[styles.muscleCount, isDark && styles.muscleCountDark]}>
                  {muscle.count % 1 === 0 ? muscle.count : muscle.count.toFixed(1)} pts
                </Text>
              </View>
            ))}
          </View>

          {/* Échelle d'intensité */}
          <View style={styles.intensityScale}>
            <Text style={[styles.scaleLabel, isDark && styles.scaleLabelDark]}>Intensité</Text>
            <View style={styles.scaleBar}>
              {INTENSITY_COLORS.map((color, i) => (
                <View key={i} style={[styles.scaleStep, { backgroundColor: color.fill }]} />
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            {filter === 'all'
              ? 'Complète des séances pour voir ta répartition musculaire'
              : 'Aucune séance sur cette période'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  filters: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.full,
  },
  filterPillDark: {
    backgroundColor: '#333333',
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
  },
  filterPillActiveDark: {
    backgroundColor: theme.colors.primary,
  },
  filterPillText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: '#666666',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextDark: {
    color: '#888888',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: theme.borderRadius.md,
    padding: 3,
    marginBottom: theme.spacing.md,
    alignSelf: 'center',
  },
  toggleContainerDark: {
    backgroundColor: '#333333',
  },
  toggleButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  toggleTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  toggleTextDark: {
    color: '#777777',
  },
  bodyWrapper: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  legend: {
    gap: theme.spacing.md,
  },
  legendTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  legendTitleDark: {
    color: '#FFFFFF',
  },
  topMuscles: {
    gap: theme.spacing.sm,
  },
  muscleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  muscleRank: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleRankText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  muscleName: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  muscleNameDark: {
    color: '#FFFFFF',
  },
  muscleCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  muscleCountDark: {
    color: '#777777',
  },
  intensityScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  scaleLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  scaleLabelDark: {
    color: '#777777',
  },
  scaleBar: {
    flexDirection: 'row',
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scaleStep: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#777777',
  },
});
