import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FRONT_PATHS, BACK_PATHS, SVG_VIEWBOX_FRONT, SVG_VIEWBOX_BACK } from '../BodyPicker/bodyPaths';
import { ZONE_LABELS } from '../BodyPicker/muscleZones';
import { getBodyCompositionSummary } from '../../api/bodyComposition';

// ─── Mapping muscles → zones SVG ────────────────────────────────────
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
  adducteurs: 'cuisses-internes', adductor: 'cuisses-internes',
  abducteurs: 'cuisses-externes', abductor: 'cuisses-externes',
  fessiers: 'fessiers', glutes: 'fessiers', gluteus: 'fessiers',
  mollets: 'mollets', calves: 'mollets',
};

// ─── Palettes ────────────────────────────────────────────────────────
// Mode Effort : vert → rouge
const EFFORT_COLORS = [
  { fill: '#94E8B4', stroke: '#5ED389' },
  { fill: '#7DD3A8', stroke: '#4AC17A' },
  { fill: '#F7B186', stroke: '#F59E0B' },
  { fill: '#FB923C', stroke: '#EA580C' },
  { fill: '#F87171', stroke: '#DC2626' },
];

// Mode Gains : sage green clair → foncé (charte graphique)
const GAINS_COLORS = [
  { fill: '#d1ebe3', stroke: '#b8ddd1' },
  { fill: '#b8ddd1', stroke: '#9fcfbf' },
  { fill: '#9fcfbf', stroke: '#86c1ad' },
  { fill: '#86c1ad', stroke: '#6db39b' },
  { fill: '#6db39b', stroke: '#549589' },
];

// Mapping elem SVG → zone
const ELEM_TO_ZONE_MAP = {
  BICEPS: 'biceps', TRICEPS: 'triceps', FOREARMS: 'avant-bras',
  CHEST: 'pectoraux', SHOULDERS: 'epaules', ABDOMINALS: 'abdos-centre',
  OBLIQUES: 'abdos-lateraux', TRAPS: 'dos-superieur', BACK: 'dos-inferieur',
  GLUTES: 'fessiers', QUADRICEPS: 'cuisses-externes', HAMSTRINGS: 'cuisses-internes',
  CALVES: 'mollets',
};

// ─── Composant ───────────────────────────────────────────────────────
export const MuscleHeatmap = ({ sessions = [], muscleStats: externalStats = null }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [view, setView] = useState('front');
  const [filter, setFilter] = useState('week-0');
  const [mode, setMode] = useState('effort'); // "
  // " | "gains"
  const [bodyComp, setBodyComp] = useState(null);
  const [bodyCompLoading, setBodyCompLoading] = useState(false);

  // Fetch body composition en mode gains
  useEffect(() => {
    if (mode !== 'gains') return;
    let cancelled = false;
    const fetchData = async () => {
      setBodyCompLoading(true);
      try {
        const days = filter === 'all' ? 30 : filter === 'week-1' ? 14 : 7;
        const result = await getBodyCompositionSummary(days);
        if (!cancelled && result.success) setBodyComp(result.data);
      } catch {
        // silencieux
      } finally {
        if (!cancelled) setBodyCompLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [mode, filter]);

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

  // Sessions filtrées
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

  // Stats musculaires mode Effort
  const muscleStats = useMemo(() => {
    if (externalStats && filter === 'all' && !sessions.length) return externalStats;
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
      entries.forEach((entry) => {
        if (!entry) return;
        if (entry.primaryMuscle) {
          addMuscle(entry.primaryMuscle, 1);
          const secondaries = entry.secondaryMuscles || [];
          if (Array.isArray(secondaries)) secondaries.forEach((m) => addMuscle(m, 0.3));
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

  // Zone intensities Effort
  const effortZoneIntensities = useMemo(() => {
    const zones = {};
    let maxCount = 0;
    Object.entries(muscleStats).forEach(([muscle, count]) => {
      const zone = MUSCLE_TO_ZONE[muscle.toLowerCase()];
      if (zone) {
        zones[zone] = (zones[zone] || 0) + count;
        maxCount = Math.max(maxCount, zones[zone]);
      }
    });
    const normalized = {};
    Object.entries(zones).forEach(([zone, count]) => {
      const ratio = maxCount > 0 ? count / maxCount : 0;
      const level = Math.min(4, Math.floor(ratio * 5));
      normalized[zone] = { count, level, color: EFFORT_COLORS[level] };
    });
    return normalized;
  }, [muscleStats]);

  // Zone intensities Gains
  const gainsZoneIntensities = useMemo(() => {
    if (!bodyComp?.muscleGain?.byZone) return {};
    const byZone = bodyComp.muscleGain.byZone;
    const zones = {};
    let maxGain = 0;
    Object.entries(byZone).forEach(([zone, data]) => {
      if (data.gainG > 0) {
        zones[zone] = data;
        maxGain = Math.max(maxGain, data.gainG);
      }
    });
    const normalized = {};
    Object.entries(zones).forEach(([zone, data]) => {
      const ratio = maxGain > 0 ? data.gainG / maxGain : 0;
      const level = Math.min(4, Math.floor(ratio * 5));
      normalized[zone] = { count: data.gainG, level, color: GAINS_COLORS[level], gainG: data.gainG };
    });
    return normalized;
  }, [bodyComp]);

  const zoneIntensities = mode === 'gains' ? gainsZoneIntensities : effortZoneIntensities;
  const colorPalette = mode === 'gains' ? GAINS_COLORS : EFFORT_COLORS;

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

  const inactiveFill = isDark ? 'rgba(80, 80, 80, 0.4)' : 'rgba(52, 72, 94, 0.15)';
  const inactiveStroke = isDark ? 'rgba(100, 100, 100, 0.6)' : 'rgba(38, 48, 68, 0.35)';

  // Composition banner data
  const compositionBanner = useMemo(() => {
    if (!bodyComp) return null;
    return {
      muscleG: bodyComp.muscleGain?.totalG || 0,
      fatG: bodyComp.fatChange?.g || 0,
      proteinStatus: bodyComp.nutrition?.proteinStatus || 'insufficient',
      proteinPerKg: bodyComp.nutrition?.proteinPerKg || 0,
      insights: bodyComp.insights || [],
    };
  }, [bodyComp]);

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

  const maxMuscleCount = topMuscles.length > 0 ? topMuscles[0].count : 1;

  const proteinStatusConfig = {
    optimal: { color: '#37b24d', bg: 'rgba(81, 207, 102, 0.12)', darkColor: '#69db7c', darkBg: 'rgba(81, 207, 102, 0.15)' },
    adequate: { color: '#f76707', bg: 'rgba(255, 146, 43, 0.12)', darkColor: '#ffa94d', darkBg: 'rgba(255, 146, 43, 0.15)' },
    insufficient: { color: '#f03e3e', bg: 'rgba(255, 107, 107, 0.12)', darkColor: '#ff8787', darkBg: 'rgba(255, 107, 107, 0.15)' },
  };

  const insightTypeConfig = {
    success: { bg: 'rgba(81, 207, 102, 0.08)', color: '#2b8a3e', darkBg: 'rgba(81, 207, 102, 0.1)', darkColor: '#69db7c' },
    alert: { bg: 'rgba(255, 107, 107, 0.08)', color: '#c92a2a', darkBg: 'rgba(255, 107, 107, 0.1)', darkColor: '#ff8787' },
    warning: { bg: 'rgba(255, 146, 43, 0.08)', color: '#e8590c', darkBg: 'rgba(255, 146, 43, 0.1)', darkColor: '#ffa94d' },
    info: { bg: 'rgba(116, 192, 252, 0.08)', color: '#1971c2', darkBg: 'rgba(116, 192, 252, 0.1)', darkColor: '#74c0fc' },
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Toggle Effort / Gains */}
      <View style={[styles.modeToggle, isDark && styles.modeToggleDark]}>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            mode === 'effort' && styles.modeBtnActive,
            mode === 'effort' && isDark && styles.modeBtnActiveDark,
          ]}
          onPress={() => setMode('effort')}
          activeOpacity={0.7}
        >
          <Ionicons name="flame-outline" size={14} color={mode === 'effort' ? (isDark ? '#F7B186' : theme.colors.primary) : (isDark ? '#666' : '#9CA3AF')} />
          <Text style={[
            styles.modeBtnText,
            isDark && styles.modeBtnTextDark,
            mode === 'effort' && styles.modeBtnTextActive,
            mode === 'effort' && isDark && styles.modeBtnTextActiveDark,
          ]}>Effort</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            mode === 'gains' && styles.modeBtnActiveGains,
            mode === 'gains' && isDark && styles.modeBtnActiveGainsDark,
          ]}
          onPress={() => setMode('gains')}
          activeOpacity={0.7}
        >
          <Ionicons name="trending-up-outline" size={14} color={mode === 'gains' ? (isDark ? '#86c1ad' : '#549589') : (isDark ? '#666' : '#9CA3AF')} />
          <Text style={[
            styles.modeBtnText,
            isDark && styles.modeBtnTextDark,
            mode === 'gains' && styles.modeBtnTextActiveGains,
            mode === 'gains' && isDark && styles.modeBtnTextActiveGainsDark,
          ]}>Gains</Text>
        </TouchableOpacity>
      </View>

      {/* Bandeau composition (mode gains) */}
      {mode === 'gains' && bodyCompLoading && (
        <ActivityIndicator size="small" color={isDark ? '#86c1ad' : '#549589'} style={{ marginVertical: 8 }} />
      )}

      {mode === 'gains' && compositionBanner && !bodyCompLoading && (
        <View style={[styles.compositionBanner, isDark && styles.compositionBannerDark]}>
          <View style={styles.bannerStat}>
            <Text style={[styles.bannerValue, { color: compositionBanner.muscleG > 0 ? '#549589' : (isDark ? '#666' : '#9CA3AF') }]}>
              {compositionBanner.muscleG > 0 ? '+' : ''}{compositionBanner.muscleG}g
            </Text>
            <Text style={[styles.bannerLabel, isDark && styles.bannerLabelDark]}>Muscle</Text>
          </View>
          <View style={[styles.bannerDivider, isDark && styles.bannerDividerDark]} />
          <View style={styles.bannerStat}>
            <Text style={[styles.bannerValue, {
              color: compositionBanner.fatG < 0 ? '#51cf66' : compositionBanner.fatG > 0 ? '#ff6b6b' : (isDark ? '#666' : '#9CA3AF')
            }]}>
              {compositionBanner.fatG > 0 ? '+' : ''}{compositionBanner.fatG}g
            </Text>
            <Text style={[styles.bannerLabel, isDark && styles.bannerLabelDark]}>Gras</Text>
          </View>
          <View style={[styles.bannerDivider, isDark && styles.bannerDividerDark]} />
          <View style={styles.bannerStat}>
            {(() => {
              const cfg = proteinStatusConfig[compositionBanner.proteinStatus] || proteinStatusConfig.insufficient;
              return (
                <View style={[styles.bannerPill, { backgroundColor: isDark ? cfg.darkBg : cfg.bg }]}>
                  <Text style={[styles.bannerPillText, { color: isDark ? cfg.darkColor : cfg.color }]}>
                    {compositionBanner.proteinPerKg}g/kg
                  </Text>
                </View>
              );
            })()}
            <Text style={[styles.bannerLabel, isDark && styles.bannerLabelDark]}>Protéines</Text>
          </View>
        </View>
      )}

      {/* Filtres */}
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

      {/* Corps SVG */}
      <View style={styles.bodySection}>
        <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
          <TouchableOpacity
            style={[styles.toggleButton, view === 'front' && styles.toggleButtonActive, view === 'front' && isDark && styles.toggleButtonActiveDark]}
            onPress={() => setView('front')}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={14} color={view === 'front' ? (isDark ? '#F7B186' : theme.colors.primary) : (isDark ? '#666' : '#999')} />
            <Text style={[styles.toggleText, view === 'front' && styles.toggleTextActive, view === 'front' && isDark && styles.toggleTextActiveDark, isDark && view !== 'front' && styles.toggleTextDark]}>Face</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, view === 'back' && styles.toggleButtonActive, view === 'back' && isDark && styles.toggleButtonActiveDark]}
            onPress={() => setView('back')}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={14} color={view === 'back' ? (isDark ? '#F7B186' : theme.colors.primary) : (isDark ? '#666' : '#999')} style={{ transform: [{ scaleX: -1 }] }} />
            <Text style={[styles.toggleText, view === 'back' && styles.toggleTextActive, view === 'back' && isDark && styles.toggleTextActiveDark, isDark && view !== 'back' && styles.toggleTextDark]}>Dos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bodyWrapper}>
          <View style={[styles.bodyGlow, hasData && styles.bodyGlowActive]} />
          <Svg width="100%" height={260} viewBox={currentViewBox} preserveAspectRatio="xMidYMid meet">
            {currentPaths.DECORATIVE && currentPaths.DECORATIVE.map((pathData, index) => (
              <Path key={`deco-${index}`} d={pathData.d} fill={isDark ? '#3A3A3A' : '#D1D5DB'} stroke={isDark ? '#4A4A4A' : '#9CA3AF'} strokeWidth={0.8} strokeLinejoin="round" />
            ))}
            {Object.entries(currentPaths).map(([elemName, paths]) => renderMuscleGroup(elemName, paths))}
          </Svg>
        </View>
      </View>

      {/* Légende */}
      {hasData ? (
        <View style={styles.legend}>
          <View style={styles.legendHeader}>
            <Text style={[styles.legendTitle, isDark && styles.legendTitleDark]}>
              {mode === 'gains' ? 'Zones de croissance estimées' : 'Top muscles travaillés'}
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
                      {mode === 'gains'
                        ? `+${muscle.gainG || Math.round(muscle.count)}g`
                        : (muscle.count % 1 === 0 ? muscle.count : muscle.count.toFixed(1))
                      }
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, isDark && styles.progressBarBgDark]}>
                    <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: muscle.color.fill }]} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Échelle */}
          <View style={[styles.intensityScale, isDark && styles.intensityScaleDark]}>
            <View style={styles.scaleLabels}>
              <Text style={[styles.scaleLabel, isDark && styles.scaleLabelDark]}>
                {mode === 'gains' ? 'Faible' : 'Léger'}
              </Text>
              <Text style={[styles.scaleLabel, isDark && styles.scaleLabelDark]}>
                {mode === 'gains' ? 'Fort' : 'Intense'}
              </Text>
            </View>
            <View style={styles.scaleBar}>
              {colorPalette.map((color, i) => (
                <View key={i} style={[styles.scaleStep, { backgroundColor: color.fill }]} />
              ))}
            </View>
          </View>
        </View>
      ) : (
        mode === 'effort' && (
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
            <Ionicons name="body-outline" size={40} color={isDark ? '#4A4A4A' : '#D1D5DB'} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              {filter === 'all'
                ? 'Complète des séances pour voir ta répartition'
                : 'Aucune séance sur cette période'
              }
            </Text>
          </View>
        )
      )}

      {/* Insights actionnables (mode gains) — tous affichés */}
      {mode === 'gains' && compositionBanner?.insights?.length > 0 && (
        <View style={styles.insightsList}>
          {compositionBanner.insights.map((insight, i) => (
            <View
              key={insight.key || i}
              style={[
                styles.insightBar,
                {
                  backgroundColor: isDark
                    ? (insightTypeConfig[insight.type]?.darkBg || 'rgba(255,255,255,0.06)')
                    : (insightTypeConfig[insight.type]?.bg || 'rgba(0,0,0,0.03)'),
                },
              ]}
            >
              <Text style={[
                styles.insightText,
                {
                  color: isDark
                    ? (insightTypeConfig[insight.type]?.darkColor || '#e5e7eb')
                    : (insightTypeConfig[insight.type]?.color || '#1f2933'),
                },
              ]}>
                {insight.message}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────
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

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 12,
    padding: 3,
    marginBottom: theme.spacing.md,
  },
  modeToggleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeBtnActiveDark: {
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  modeBtnActiveGains: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#549589',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  modeBtnActiveGainsDark: {
    backgroundColor: 'rgba(184, 221, 209, 0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  modeBtnTextDark: {
    color: '#666',
  },
  modeBtnTextActive: {
    color: theme.colors.primary,
  },
  modeBtnTextActiveDark: {
    color: '#F7B186',
  },
  modeBtnTextActiveGains: {
    color: '#549589',
  },
  modeBtnTextActiveGainsDark: {
    color: '#86c1ad',
  },

  // Composition Banner
  compositionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184, 221, 209, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184, 221, 209, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: theme.spacing.md,
  },
  compositionBannerDark: {
    backgroundColor: 'rgba(184, 221, 209, 0.08)',
    borderColor: 'rgba(184, 221, 209, 0.18)',
  },
  bannerStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bannerValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerLabelDark: {
    color: '#9CA3AF',
  },
  bannerDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  bannerDividerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bannerPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Header & Filters
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

  // Body Section
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

  // Legend
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
    flex: 1,
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

  // Intensity Scale
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

  // Empty State
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

  // Insights
  insightsList: {
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  insightBar: {
    borderRadius: 10,
    padding: 10,
  },
  insightText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});
