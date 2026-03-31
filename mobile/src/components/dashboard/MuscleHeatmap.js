import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, useColorScheme,
  ActivityIndicator, ScrollView,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FRONT_PATHS, BACK_PATHS, SVG_VIEWBOX_FRONT, SVG_VIEWBOX_BACK } from '../BodyPicker/bodyPaths';
import { ZONE_LABELS, ZONE_IDS } from '../BodyPicker/muscleZones';
import { getBodyCompositionSummary } from '../../api/bodyComposition';
import { getRecoveryStatus } from '../../api/recovery';

// ─── Mapping muscles → zones SVG ────────────────────────────────────
const MUSCLE_TO_ZONE = {
  pectoraux: 'pectoraux', pectoreaux: 'pectoraux', chest: 'pectoraux', pecs: 'pectoraux', poitrine: 'pectoraux',
  epaules: 'epaules', épaules: 'epaules', shoulders: 'epaules', deltoides: 'epaules', deltoïdes: 'epaules', deltoid: 'epaules',
  biceps: 'biceps', triceps: 'triceps', 'avant-bras': 'avant-bras', forearms: 'avant-bras', bras: 'biceps',
  abdos: 'abdos-centre', abs: 'abdos-centre', 'abdos-centre': 'abdos-centre', abdominaux: 'abdos-centre',
  'abdos-lateraux': 'abdos-lateraux', obliques: 'abdos-lateraux', core: 'abdos-centre',
  dos: 'dos-inferieur', dorsaux: 'dos-inferieur', dorseau: 'dos-inferieur', dorseaux: 'dos-inferieur',
  back: 'dos-inferieur', 'dos-superieur': 'dos-superieur',
  'dos-inferieur': 'dos-inferieur', lats: 'dos-inferieur', 'dos-lats': 'dos-inferieur', latissimus: 'dos-inferieur',
  traps: 'dos-superieur', trapeze: 'dos-superieur', trapèzes: 'dos-superieur', rhomboides: 'dos-superieur',
  quadriceps: 'cuisses-externes', quads: 'cuisses-externes', cuisses: 'cuisses-externes', jambes: 'cuisses-externes',
  'cuisses-externes': 'cuisses-externes', 'cuisses-internes': 'cuisses-internes',
  ischio: 'cuisses-internes', ischios: 'cuisses-internes', hamstrings: 'cuisses-internes', 'ischio-jambiers': 'cuisses-internes',
  adducteurs: 'cuisses-internes', adductor: 'cuisses-internes',
  abducteurs: 'cuisses-externes', abductor: 'cuisses-externes',
  fessiers: 'fessiers', glutes: 'fessiers', gluteus: 'fessiers', fesses: 'fessiers',
  mollets: 'mollets', calves: 'mollets',
};

// ─── Palettes ────────────────────────────────────────────────────────
// Palette unifiée Effort + Gains (dégradé peach cohérent avec le thème)
const INTENSITY_COLORS = [
  { fill: '#F5D4BE', stroke: '#F0A47A' },
  { fill: '#F0B896', stroke: '#E89468' },
  { fill: '#F0A47A', stroke: '#D98B5E' },
  { fill: '#E8895A', stroke: '#C67548' },
  { fill: '#D4703E', stroke: '#A55A30' },
];

const RECOVERY_COLORS = [
  { fill: '#FCA5A5', stroke: '#EF4444' },
  { fill: '#FDBA74', stroke: '#F97316' },
  { fill: '#FDE68A', stroke: '#EAB308' },
  { fill: '#BEF264', stroke: '#84CC16' },
  { fill: '#86EFAC', stroke: '#22C55E' },
];

const ELEM_TO_ZONE_MAP = {
  BICEPS: 'biceps', TRICEPS: 'triceps', FOREARMS: 'avant-bras',
  CHEST: 'pectoraux', SHOULDERS: 'epaules', ABDOMINALS: 'abdos-centre',
  OBLIQUES: 'abdos-lateraux', TRAPS: 'dos-superieur', BACK: 'dos-inferieur',
  GLUTES: 'fessiers', QUADRICEPS: 'cuisses-externes', HAMSTRINGS: 'cuisses-internes',
  CALVES: 'mollets',
};

// ─── Recovery helpers ───────────────────────────────────────────────
const getBarColor = (pct) => {
  if (pct >= 80) return '#22C55E';
  if (pct >= 60) return '#84CC16';
  if (pct >= 40) return '#EAB308';
  if (pct >= 20) return '#F97316';
  return '#EF4444';
};

const getRecoveryLabel = (pct) => {
  if (pct >= 80) return 'Prêt';
  if (pct >= 60) return 'Bientôt';
  if (pct >= 40) return 'Récup';
  if (pct >= 20) return 'Fatigué';
  return 'Épuisé';
};

// ─── Semi-circle gauge SVG ──────────────────────────────────────────
const renderGaugeArc = (size, strokeWidth, percentage, color, isDark) => {
  const radius = (size - strokeWidth) / 2;
  const halfCirc = Math.PI * radius;
  const pct = Math.min(100, Math.max(0, percentage));
  const filled = (pct / 100) * halfCirc;
  const svgH = radius + strokeWidth;
  const cy = radius + strokeWidth / 2;
  const startX = strokeWidth / 2;
  const endX = size - strokeWidth / 2;

  return (
    <Svg width={size} height={svgH}>
      <Path
        d={`M ${startX},${cy} A ${radius},${radius} 0 0,1 ${endX},${cy}`}
        fill="none"
        stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {pct > 0 && (
        <Path
          d={`M ${startX},${cy} A ${radius},${radius} 0 0,1 ${endX},${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={[halfCirc, halfCirc]}
          strokeDashoffset={halfCirc - filled}
        />
      )}
    </Svg>
  );
};

// ─── Composant principal ────────────────────────────────────────────
export const MuscleHeatmap = ({ sessions = [], muscleStats: externalStats = null }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [view, setView] = useState('front');
  const [weeksAgo, setWeeksAgo] = useState(0);
  const [mode, setMode] = useState('effort');
  const [bodyComp, setBodyComp] = useState(null);
  const [bodyCompLoading, setBodyCompLoading] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [recoveryData, setRecoveryData] = useState(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => { setSelectedMuscle(null); }, [mode]);

  // Fetch recovery data from API
  useEffect(() => {
    if (mode !== 'recovery') return;
    let cancelled = false;
    setRecoveryLoading(true);
    getRecoveryStatus()
      .then(res => { if (!cancelled && res?.success) setRecoveryData(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRecoveryLoading(false); });
    return () => { cancelled = true; };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'gains') return;
    let cancelled = false;
    setBodyCompLoading(true);
    getBodyCompositionSummary((weeksAgo + 1) * 7)
      .then(result => { if (!cancelled && result.success) setBodyComp(result.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBodyCompLoading(false); });
    return () => { cancelled = true; };
  }, [mode, weeksAgo]);

  const getWeekBounds = useCallback((ago = 0) => {
    const now = new Date();
    const diff = (now.getDay() || 7) - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diff - ago * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }, []);

  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) =>
      new Date(b?.startedAt || b?.endedAt || b?.createdAt || 0) -
      new Date(a?.startedAt || a?.endedAt || a?.createdAt || 0)
    );
    const { start, end } = getWeekBounds(weeksAgo);
    return sorted.filter(s => {
      const d = new Date(s?.startedAt || s?.endedAt || s?.createdAt || 0);
      return d >= start && d < end;
    });
  }, [sessions, weeksAgo, getWeekBounds]);

  const muscleStats = useMemo(() => {
    if (externalStats && !sessions.length) return externalStats;
    if (!filteredSessions.length) return {};
    const counts = {};
    const add = (m, w = 1) => {
      const k = String(m || '').toLowerCase().trim();
      if (k && k !== 'undefined' && k !== 'null') counts[k] = (counts[k] || 0) + w;
    };
    filteredSessions.forEach(session => {
      (session?.entries || session?.items || session?.exercises || []).forEach(e => {
        if (!e) return;
        if (e.primaryMuscle) {
          add(e.primaryMuscle, 1);
          (e.secondaryMuscles || []).forEach(m => add(m, 0.3));
        } else if (Array.isArray(e.muscles) && e.muscles.length > 1) {
          add(e.muscles[0], 1);
          e.muscles.slice(1).forEach(m => add(m, 0.3));
        } else if (e.muscle) add(e.muscle, 1);
        else if (e.muscleGroup) add(e.muscleGroup, 1);
        else if (Array.isArray(e.muscles) && e.muscles.length) {
          add(e.muscles[0], 1);
        }
      });
    });
    return counts;
  }, [filteredSessions, externalStats, sessions.length]);

  const effortZones = useMemo(() => {
    const zones = {};
    let max = 0;
    Object.entries(muscleStats).forEach(([muscle, count]) => {
      const zone = MUSCLE_TO_ZONE[muscle.toLowerCase()];
      if (zone) { zones[zone] = (zones[zone] || 0) + count; max = Math.max(max, zones[zone]); }
    });
    const out = {};
    Object.entries(zones).forEach(([zone, count]) => {
      const level = Math.min(4, Math.floor((max > 0 ? count / max : 0) * 5));
      out[zone] = { count, level, color: INTENSITY_COLORS[level] };
    });
    return out;
  }, [muscleStats]);

  // Convert API recovery data to zone map
  const recoveryZones = useMemo(() => {
    if (!recoveryData?.zones) return {};
    const out = {};
    recoveryData.zones.forEach(z => {
      const level = Math.min(4, Math.floor(z.percentage / 20));
      out[z.id] = {
        count: z.percentage, level,
        color: RECOVERY_COLORS[level],
        hoursAgo: z.hoursAgo, recoveryHours: z.recoveryHours,
        fatigueScore: z.fatigueScore,
        isReady: z.isReady,
      };
    });
    return out;
  }, [recoveryData]);

  const gainsZones = useMemo(() => {
    if (!bodyComp?.muscleGain?.byZone) return {};
    const byZone = bodyComp.muscleGain.byZone;
    let max = 0;
    const zones = {};
    Object.entries(byZone).forEach(([zone, data]) => {
      if (data.gainG > 0) { zones[zone] = data; max = Math.max(max, data.gainG); }
    });
    const out = {};
    Object.entries(zones).forEach(([zone, data]) => {
      const level = Math.min(4, Math.floor((max > 0 ? data.gainG / max : 0) * 5));
      out[zone] = { count: data.gainG, level, color: INTENSITY_COLORS[level], gainG: data.gainG };
    });
    return out;
  }, [bodyComp]);

  const isRecovery = mode === 'recovery';
  const isGains = mode === 'gains';
  const zoneIntensities = isRecovery ? recoveryZones : isGains ? gainsZones : effortZones;
  const colorPalette = isRecovery ? RECOVERY_COLORS : INTENSITY_COLORS;
  const accent = theme.colors.primary;

  const topMuscles = useMemo(() =>
    Object.entries(zoneIntensities)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([zone, data]) => ({ zone, ...data })),
    [zoneIntensities]
  );

  const recoveryList = useMemo(() => {
    if (!recoveryData?.zones) return [];
    return recoveryData.zones
      .map(z => ({
        id: z.id,
        label: z.label,
        percentage: z.percentage,
        hoursAgo: z.hoursAgo,
        isReady: z.isReady,
        fatigueScore: z.fatigueScore,
        recoveryHours: z.recoveryHours,
      }))
      .sort((a, b) => a.percentage - b.percentage);
  }, [recoveryData]);

  const hasData = Object.keys(zoneIntensities).length > 0;
  const currentPaths = view === 'front' ? FRONT_PATHS : BACK_PATHS;
  const currentViewBox = view === 'front' ? SVG_VIEWBOX_FRONT : SVG_VIEWBOX_BACK;
  const inactiveFill = isDark ? 'rgba(80, 80, 80, 0.25)' : 'rgba(52, 72, 94, 0.08)';
  const inactiveStroke = isDark ? 'rgba(100, 100, 100, 0.4)' : 'rgba(38, 48, 68, 0.2)';
  const weekLabel = weeksAgo === 0 ? 'Cette semaine' : weeksAgo === 1 ? 'Semaine dernière' : `Il y a ${weeksAgo} sem.`;

  const recoverySummary = useMemo(() => {
    if (!isRecovery || !recoveryData?.summary) return null;
    return recoveryData.summary;
  }, [isRecovery, recoveryData]);

  const renderMuscleGroup = (elemName, paths) => {
    if (elemName === 'DECORATIVE') return null;
    const zoneId = ELEM_TO_ZONE_MAP[elemName];
    if (!zoneId) return null;
    const intensity = zoneIntensities[zoneId];
    return (
      <G key={elemName}>
        {paths.map((p, i) => (
          <Path
            key={i}
            d={p.d}
            fill={intensity ? intensity.color.fill : inactiveFill}
            stroke={intensity ? intensity.color.stroke : inactiveStroke}
            strokeWidth={intensity ? 1.5 : 0.6}
            strokeLinejoin="round"
          />
        ))}
      </G>
    );
  };

  const handleGaugePress = useCallback((item) => {
    setSelectedMuscle(prev => prev?.id === item.id ? null : item);
  }, []);

  return (
    <View style={[st.card, isDark && st.cardDark]}>

      {/* ── Mode toggle ── */}
      <View style={[st.modeToggle, isDark && st.modeToggleDark]}>
        {['effort', 'recovery', 'gains'].map(m => {
          const active = mode === m;
          const label = m === 'gains' ? 'Gains' : m === 'recovery' ? 'Récup' : 'Effort';
          return (
            <TouchableOpacity
              key={m}
              style={[st.modeBtn, active && st.modeBtnActive, active && isDark && st.modeBtnActiveDark]}
              onPress={() => setMode(m)}
              activeOpacity={0.7}
            >
              <Text style={[st.modeBtnText, isDark && st.modeBtnTextDark, active && { color: accent }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ═══════════════ RECOVERY MODE ═══════════════ */}
      {isRecovery ? (
        <>
          <View style={st.weekNav}>
            <Text style={[st.weekLabel, isDark && st.weekLabelDark]}>7 derniers jours</Text>
          </View>

          {hasData ? (
            <>
              {/* Summary chips */}
              {recoverySummary && (
                <View style={st.summaryBar}>
                  <View style={[st.summaryChip, isDark && st.summaryChipDark]}>
                    <View style={[st.summaryChipDot, { backgroundColor: '#22C55E' }]} />
                    <Text style={[st.summaryChipText, isDark && st.summaryChipTextDark]}>
                      {recoverySummary.ready} prêt{recoverySummary.ready !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={[st.summaryChip, isDark && st.summaryChipDark]}>
                    <View style={[st.summaryChipDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={[st.summaryChipText, isDark && st.summaryChipTextDark]}>
                      {recoverySummary.recovering} en récup
                    </Text>
                  </View>
                </View>
              )}

              {/* Semi-circle gauges — swipeable */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.gaugeScroll}
              >
                {recoveryList.map(item => {
                  const color = getBarColor(item.percentage);
                  const isSelected = selectedMuscle?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleGaugePress(item)}
                      activeOpacity={0.7}
                      style={[
                        st.gaugeCard,
                        isDark && st.gaugeCardDark,
                        isSelected && [st.gaugeCardSelected, { borderColor: color }],
                      ]}
                    >
                      <View style={st.gaugeArcWrap}>
                        {renderGaugeArc(76, 7, item.percentage, color, isDark)}
                        <Text style={[st.gaugePct, { color }]}>{item.percentage}%</Text>
                      </View>
                      <Text style={[st.gaugeLabel, isDark && st.gaugeLabelDark]} numberOfLines={1}>
                        {item.label}
                      </Text>
                      <Text style={[st.gaugeStatus, { color }]}>
                        {getRecoveryLabel(item.percentage)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Detail card — visible quand on tap un muscle */}
              {selectedMuscle && (() => {
                const detailColor = getBarColor(selectedMuscle.percentage);
                return (
                  <View style={[st.detailCard, isDark && st.detailCardDark]}>
                    <View style={st.detailHeader}>
                      <Text style={[st.detailTitle, isDark && st.detailTitleDark]}>
                        {selectedMuscle.label}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedMuscle(null)} hitSlop={12}>
                        <Ionicons name="close-circle" size={22} color={isDark ? '#555' : '#ccc'} />
                      </TouchableOpacity>
                    </View>

                    <View style={st.detailGaugeWrap}>
                      {renderGaugeArc(140, 10, selectedMuscle.percentage, detailColor, isDark)}
                      <Text style={[st.detailGaugePct, { color: detailColor }]}>
                        {selectedMuscle.percentage}%
                      </Text>
                    </View>

                    <View style={st.detailStatsRow}>
                      <View style={st.detailStatItem}>
                        <Text style={[st.detailStatValue, isDark && st.detailStatValueDark]}>
                          {selectedMuscle.hoursAgo != null
                            ? (selectedMuscle.hoursAgo < 24
                              ? `${selectedMuscle.hoursAgo}h`
                              : `${Math.round(selectedMuscle.hoursAgo / 24)}j`)
                            : '—'}
                        </Text>
                        <Text style={[st.detailStatLabel, isDark && st.detailStatLabelDark]}>
                          Dernière séance
                        </Text>
                      </View>
                      <View style={[st.detailStatDivider, isDark && st.detailStatDividerDark]} />
                      <View style={st.detailStatItem}>
                        <Text style={[st.detailStatValue, isDark && st.detailStatValueDark]}>
                          {selectedMuscle.volumeScore || '—'}
                        </Text>
                        <Text style={[st.detailStatLabel, isDark && st.detailStatLabelDark]}>
                          Volume
                        </Text>
                      </View>
                      <View style={[st.detailStatDivider, isDark && st.detailStatDividerDark]} />
                      <View style={st.detailStatItem}>
                        <Text style={[st.detailStatValue, isDark && st.detailStatValueDark]}>
                          {selectedMuscle.recoveryHours || '—'}h
                        </Text>
                        <Text style={[st.detailStatLabel, isDark && st.detailStatLabelDark]}>
                          Temps récup
                        </Text>
                      </View>
                    </View>

                    <View style={[st.detailStatusBadge, { backgroundColor: `${detailColor}18` }]}>
                      <View style={[st.detailStatusDot, { backgroundColor: detailColor }]} />
                      <Text style={[st.detailStatusText, { color: detailColor }]}>
                        {getRecoveryLabel(selectedMuscle.percentage)}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </>
          ) : (
            <View style={st.emptyContainer}>
              <Ionicons name="fitness-outline" size={36} color={isDark ? '#333' : '#ddd'} />
              <Text style={[st.emptyText, isDark && st.emptyTextDark]}>Aucune séance récente</Text>
            </View>
          )}
        </>

      ) : (
        /* ═══════════════ EFFORT / GAINS MODE ═══════════════ */
        <>
          <View style={st.weekNav}>
            <TouchableOpacity onPress={() => setWeeksAgo(w => Math.min(w + 1, 4))} hitSlop={12}>
              <Ionicons name="chevron-back" size={18} color={isDark ? '#555' : '#bbb'} />
            </TouchableOpacity>
            <Text style={[st.weekLabel, isDark && st.weekLabelDark]}>{weekLabel}</Text>
            <TouchableOpacity
              onPress={() => setWeeksAgo(w => Math.max(w - 1, 0))}
              hitSlop={12}
              disabled={weeksAgo === 0}
            >
              <Ionicons name="chevron-forward" size={18} color={weeksAgo === 0 ? 'transparent' : (isDark ? '#555' : '#bbb')} />
            </TouchableOpacity>
          </View>

          {isGains && bodyCompLoading ? (
            <View style={st.loadingArea}>
              <ActivityIndicator size="small" color={accent} />
            </View>
          ) : (
            <View style={st.bodyArea}>
              <Svg width="100%" height={280} viewBox={currentViewBox} preserveAspectRatio="xMidYMid meet">
                {currentPaths.DECORATIVE?.map((p, i) => (
                  <Path key={`d-${i}`} d={p.d} fill={isDark ? '#222' : '#ddd'} stroke={isDark ? '#333' : '#bbb'} strokeWidth={0.5} strokeLinejoin="round" />
                ))}
                {Object.entries(currentPaths).map(([name, paths]) => renderMuscleGroup(name, paths))}
              </Svg>
            </View>
          )}

          <View style={st.viewRow}>
            <View style={[st.viewToggleContainer, isDark && st.viewToggleContainerDark]}>
              {['front', 'back'].map(v => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setView(v)}
                  activeOpacity={0.7}
                  style={[st.viewToggleBtn, view === v && [st.viewToggleBtnActive, { backgroundColor: accent }]]}
                >
                  <Text style={[st.viewToggleText, view === v && st.viewToggleTextActive, isDark && view !== v && { color: '#555' }]}>
                    {v === 'front' ? 'Face' : 'Dos'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[st.sessionCount, isDark && { color: '#555' }]}>
              {filteredSessions.length} séance{filteredSessions.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {hasData && (
            <View style={st.topList}>
              {topMuscles.map((muscle, i) => (
                <View key={muscle.zone} style={[st.topRow, i < topMuscles.length - 1 && st.topRowBorder, isDark && i < topMuscles.length - 1 && st.topRowBorderDark]}>
                  <View style={[st.topDot, { backgroundColor: muscle.color.fill }]} />
                  <Text style={[st.topName, isDark && st.topNameDark]}>
                    {ZONE_LABELS[muscle.zone] || muscle.zone}
                  </Text>
                  <Text style={[st.topValue, isDark && st.topValueDark]}>
                    {isGains
                      ? `+${muscle.gainG || Math.round(muscle.count)}g`
                      : (muscle.count % 1 === 0 ? muscle.count : muscle.count.toFixed(1))
                    }
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!hasData && (
            <View style={st.emptyContainer}>
              <Ionicons name="barbell-outline" size={36} color={isDark ? '#333' : '#ddd'} />
              <Text style={[st.emptyText, isDark && st.emptyTextDark]}>
                {isGains ? 'Pas de données de croissance' : 'Aucune séance cette semaine'}
              </Text>
            </View>
          )}

          {hasData && (
            <View style={st.scaleRow}>
              <Text style={[st.scaleLabel, isDark && st.scaleLabelDark]}>Peu</Text>
              <View style={st.scaleBar}>
                {colorPalette.map((c, i) => (
                  <View key={i} style={[st.scaleStep, { backgroundColor: c.fill }]} />
                ))}
              </View>
              <Text style={[st.scaleLabel, isDark && st.scaleLabelDark]}>Max</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────
const st = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#18181d',
    shadowOpacity: 0,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  modeToggleDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  modeBtnActiveDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0,
    elevation: 0,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#aaa',
  },
  modeBtnTextDark: {
    color: '#555',
  },

  // Week nav
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
    minWidth: 130,
    textAlign: 'center',
  },
  weekLabelDark: {
    color: '#666',
  },

  // Body SVG
  loadingArea: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyArea: {
    alignItems: 'center',
    marginVertical: 4,
  },

  // View toggle
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
    marginBottom: 16,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 10,
    padding: 3,
  },
  viewToggleContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  viewToggleBtn: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  viewToggleBtnActive: {},
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  viewToggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sessionCount: {
    position: 'absolute',
    right: 0,
    fontSize: 11,
    color: '#ccc',
  },

  // ── Summary chips ──
  summaryBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  summaryChipDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  summaryChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  summaryChipTextDark: {
    color: '#999',
  },

  // ── Recovery gauges ──
  gaugeScroll: {
    paddingHorizontal: 2,
    paddingVertical: 8,
    gap: 10,
  },
  gaugeCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 14,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 10,
    width: 100,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  gaugeCardDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  gaugeCardSelected: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  gaugeArcWrap: {
    width: 76,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  gaugePct: {
    position: 'absolute',
    bottom: 0,
    fontSize: 16,
    fontWeight: '700',
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  gaugeLabelDark: {
    color: '#aaa',
  },
  gaugeStatus: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── Recovery detail card ──
  detailCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  detailCardDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  detailTitleDark: {
    color: '#eee',
  },
  detailGaugeWrap: {
    width: 140,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailGaugePct: {
    position: 'absolute',
    bottom: 2,
    fontSize: 28,
    fontWeight: '700',
  },
  detailStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  detailStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  detailStatValueDark: {
    color: '#eee',
  },
  detailStatLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#999',
  },
  detailStatLabelDark: {
    color: '#666',
  },
  detailStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  detailStatDividerDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  detailStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  detailStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Top muscles (effort/gains)
  topList: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  topRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  topRowBorderDark: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  topName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  topNameDark: {
    color: '#ddd',
  },
  topValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  topValueDark: {
    color: '#777',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#bbb',
  },
  emptyTextDark: {
    color: '#555',
  },

  // Scale
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  scaleLabel: {
    fontSize: 10,
    color: '#bbb',
    fontWeight: '400',
  },
  scaleLabelDark: {
    color: '#555',
  },
  scaleBar: {
    flex: 1,
    flexDirection: 'row',
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  scaleStep: {
    flex: 1,
  },
});
