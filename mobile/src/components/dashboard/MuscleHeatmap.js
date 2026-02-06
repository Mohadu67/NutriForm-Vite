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

// Couleurs d'intensité avec gradient moderne (du cyan au orange/rouge)
const INTENSITY_COLORS = [
  { fill: '#94E8B4', stroke: '#5ED389', gradient: ['#94E8B4', '#5ED389'] }, // Léger
  { fill: '#7DD3A8', stroke: '#4AC17A', gradient: ['#7DD3A8', '#4AC17A'] },
  { fill: '#F7B186', stroke: '#F59E0B', gradient: ['#F7B186', '#F59E0B'] }, // Moyen
  { fill: '#FB923C', stroke: '#EA580C', gradient: ['#FB923C', '#EA580C'] },
  { fill: '#F87171', stroke: '#DC2626', gradient: ['#F87171', '#DC2626'] }, // Intense
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

  // Calculer le pourcentage max pour les barres de progression
  const maxMuscleCount = topMuscles.length > 0 ? topMuscles[0].count : 1;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header avec filtres */}
      <View style={styles.headerRow}>
        <View style={styles.filters}>
          {periodOptions.map((option) => {
            const isActive = filter === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterPill,
                  isDark && styles.filterPillDark,
                  isActive && styles.filterPillActive,
                  isActive && isDark && styles.filterPillActiveDark,
                ]}
                onPress={() => setFilter(option.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon}
                  size={14}
                  color={isActive ? (isDark ? '#F7B186' : theme.colors.primary) : (isDark ? '#9CA3AF' : '#6B7280')}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    isDark && styles.filterPillTextDark,
                    isActive && styles.filterPillTextActive,
                    isActive && isDark && styles.filterPillTextActiveDark,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Corps principal avec toggle intégré */}
      <View style={styles.bodySection}>
        {/* Toggle Face/Dos - Design moderne */}
        <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              view === 'front' && styles.toggleButtonActive,
              view === 'front' && isDark && styles.toggleButtonActiveDark,
            ]}
            onPress={() => setView('front')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person"
              size={14}
              color={view === 'front' ? (isDark ? '#F7B186' : theme.colors.primary) : (isDark ? '#666' : '#999')}
            />
            <Text style={[
              styles.toggleText,
              view === 'front' && styles.toggleTextActive,
              view === 'front' && isDark && styles.toggleTextActiveDark,
              isDark && view !== 'front' && styles.toggleTextDark,
            ]}>
              Face
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              view === 'back' && styles.toggleButtonActive,
              view === 'back' && isDark && styles.toggleButtonActiveDark,
            ]}
            onPress={() => setView('back')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person"
              size={14}
              color={view === 'back' ? (isDark ? '#F7B186' : theme.colors.primary) : (isDark ? '#666' : '#999')}
              style={{ transform: [{ scaleX: -1 }] }}
            />
            <Text style={[
              styles.toggleText,
              view === 'back' && styles.toggleTextActive,
              view === 'back' && isDark && styles.toggleTextActiveDark,
              isDark && view !== 'back' && styles.toggleTextDark,
            ]}>
              Dos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Corps SVG avec effet glow */}
        <View style={styles.bodyWrapper}>
          <View style={[styles.bodyGlow, hasData && styles.bodyGlowActive]} />
          <Svg
            width="100%"
            height={260}
            viewBox={currentViewBox}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Éléments décoratifs */}
            {currentPaths.DECORATIVE && currentPaths.DECORATIVE.map((pathData, index) => (
              <Path
                key={`deco-${index}`}
                d={pathData.d}
                fill={isDark ? '#3A3A3A' : '#D1D5DB'}
                stroke={isDark ? '#4A4A4A' : '#9CA3AF'}
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
      </View>

      {/* Légende redessinée */}
      {hasData ? (
        <View style={styles.legend}>
          <View style={styles.legendHeader}>
            <Text style={[styles.legendTitle, isDark && styles.legendTitleDark]}>
              🔥 Top muscles travaillés
            </Text>
            <View style={[styles.sessionsBadge, isDark && styles.sessionsBadgeDark]}>
              <Text style={[styles.sessionsBadgeText, isDark && styles.sessionsBadgeTextDark]}>
                {filteredSessions.length} séance{filteredSessions.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.topMuscles}>
            {topMuscles.map((muscle, index) => {
              const percentage = (muscle.count / maxMuscleCount) * 100;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <View key={muscle.zone} style={styles.muscleItem}>
                  <View style={styles.muscleItemHeader}>
                    <Text style={styles.muscleMedal}>{medals[index]}</Text>
                    <Text style={[styles.muscleName, isDark && styles.muscleNameDark]}>
                      {ZONE_LABELS[muscle.zone] || muscle.zone}
                    </Text>
                    <Text style={[styles.muscleCount, isDark && styles.muscleCountDark]}>
                      {muscle.count % 1 === 0 ? muscle.count : muscle.count.toFixed(1)}
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, isDark && styles.progressBarBgDark]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: muscle.color.fill,
                        }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Échelle d'intensité redessinée */}
          <View style={[styles.intensityScale, isDark && styles.intensityScaleDark]}>
            <View style={styles.scaleLabels}>
              <Text style={[styles.scaleLabel, isDark && styles.scaleLabelDark]}>Léger</Text>
              <Text style={[styles.scaleLabel, isDark && styles.scaleLabelDark]}>Intense</Text>
            </View>
            <View style={styles.scaleBar}>
              {INTENSITY_COLORS.map((color, i) => (
                <View key={i} style={[styles.scaleStep, { backgroundColor: color.fill }]} />
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
          <Ionicons name="body-outline" size={40} color={isDark ? '#4A4A4A' : '#D1D5DB'} />
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            {filter === 'all'
              ? 'Complète des séances pour voir ta répartition'
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
    borderRadius: 20,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  containerDark: {
    backgroundColor: '#1F1F1F',
  },
  headerRow: {
    marginBottom: theme.spacing.md,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterPillDark: {
    backgroundColor: '#1F1F1F',
    borderColor: '#333',
  },
  filterPillActive: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  filterPillActiveDark: {
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    borderColor: '#F7B186',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterPillTextDark: {
    color: '#9CA3AF',
  },
  filterPillTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  filterPillTextActiveDark: {
    color: '#F7B186',
  },
  bodySection: {
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  toggleContainerDark: {
    backgroundColor: '#2A2A2A',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonActiveDark: {
    backgroundColor: '#333',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  toggleTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  toggleTextActiveDark: {
    color: '#F7B186',
  },
  toggleTextDark: {
    color: '#666',
  },
  bodyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  bodyGlow: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    right: '20%',
    bottom: '10%',
    borderRadius: 100,
    opacity: 0,
  },
  bodyGlowActive: {
    opacity: 0.3,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  legend: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  legendTitleDark: {
    color: '#FFFFFF',
  },
  sessionsBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionsBadgeDark: {
    backgroundColor: '#333',
  },
  sessionsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  sessionsBadgeTextDark: {
    color: '#9CA3AF',
  },
  topMuscles: {
    gap: 12,
  },
  muscleItem: {
    gap: 6,
  },
  muscleItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleMedal: {
    fontSize: 16,
  },
  muscleName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  muscleNameDark: {
    color: '#FFFFFF',
  },
  muscleCount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  muscleCountDark: {
    color: '#9CA3AF',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarBgDark: {
    backgroundColor: '#333',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  intensityScale: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  intensityScaleDark: {
    backgroundColor: '#2A2A2A',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scaleLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  scaleLabelDark: {
    color: '#6B7280',
  },
  scaleBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  scaleStep: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: 12,
  },
  emptyStateDark: {},
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#6B7280',
  },
});
