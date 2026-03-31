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
const EFFORT_COLORS = [
  { fill: '#94E8B4', stroke: '#5ED389' },
  { fill: '#7DD3A8', stroke: '#4AC17A' },
  { fill: '#F7B186', stroke: '#F59E0B' },
  { fill: '#FB923C', stroke: '#EA580C' },
  { fill: '#F87171', stroke: '#DC2626' },
];

const GAINS_COLORS = [
  { fill: '#d1ebe3', stroke: '#b8ddd1' },
  { fill: '#b8ddd1', stroke: '#9fcfbf' },
  { fill: '#9fcfbf', stroke: '#86c1ad' },
  { fill: '#86c1ad', stroke: '#6db39b' },
  { fill: '#6db39b', stroke: '#549589' },
];

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
  const [weeksAgo, setWeeksAgo] = useState(0);
  const [mode, setMode] = useState('effort');
  const [bodyComp, setBodyComp] = useState(null);
  const [bodyCompLoading, setBodyCompLoading] = useState(false);

  // Fetch body composition en mode gains
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

  // Stats musculaires (effort)
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
        } else if (e.muscle) add(e.muscle, 1);
        else if (e.muscleGroup) add(e.muscleGroup, 1);
        else if (Array.isArray(e.muscles) && e.muscles.length) {
          add(e.muscles[0], 1);
          e.muscles.slice(1).forEach(m => add(m, 0.3));
        }
      });
    });
    return counts;
  }, [filteredSessions, externalStats, sessions.length]);

  // Zone intensities
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
      out[zone] = { count, level, color: EFFORT_COLORS[level] };
    });
    return out;
  }, [muscleStats]);

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
      out[zone] = { count: data.gainG, level, color: GAINS_COLORS[level], gainG: data.gainG };
    });
    return out;
  }, [bodyComp]);

  const zoneIntensities = mode === 'gains' ? gainsZones : effortZones;
  const colorPalette = mode === 'gains' ? GAINS_COLORS : EFFORT_COLORS;

  const topMuscles = useMemo(() =>
    Object.entries(zoneIntensities)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([zone, data]) => ({ zone, ...data })),
    [zoneIntensities]
  );

  const hasData = Object.keys(zoneIntensities).length > 0;
  const currentPaths = view === 'front' ? FRONT_PATHS : BACK_PATHS;
  const currentViewBox = view === 'front' ? SVG_VIEWBOX_FRONT : SVG_VIEWBOX_BACK;
  const inactiveFill = isDark ? 'rgba(80, 80, 80, 0.25)' : 'rgba(52, 72, 94, 0.08)';
  const inactiveStroke = isDark ? 'rgba(100, 100, 100, 0.4)' : 'rgba(38, 48, 68, 0.2)';

  const weekLabel = weeksAgo === 0 ? 'Cette semaine' : weeksAgo === 1 ? 'Semaine dernière' : `Il y a ${weeksAgo} sem.`;
  const isGains = mode === 'gains';
  const accent = isGains ? '#86c1ad' : theme.colors.primary;

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

  return (
    <View style={[s.card, isDark && s.cardDark]}>
      {/* ── Mode toggle ── */}
      <View style={[s.segmented, isDark && s.segmentedDark]}>
        {['effort', 'gains'].map(m => {
          const active = mode === m;
          const isG = m === 'gains';
          return (
            <TouchableOpacity
              key={m}
              style={[s.seg, active && s.segActive, active && isDark && s.segActiveDark]}
              onPress={() => setMode(m)}
              activeOpacity={0.7}
            >
              <Text style={[
                s.segText,
                isDark && s.segTextDark,
                active && { color: isG ? '#86c1ad' : theme.colors.primary },
              ]}>
                {isG ? 'Gains' : 'Effort'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Week navigation ── */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={() => setWeeksAgo(w => Math.min(w + 1, 4))} hitSlop={12}>
          <Ionicons name="chevron-back" size={18} color={isDark ? '#666' : '#bbb'} />
        </TouchableOpacity>
        <Text style={[s.weekLabel, isDark && s.weekLabelDark]}>{weekLabel}</Text>
        <TouchableOpacity
          onPress={() => setWeeksAgo(w => Math.max(w - 1, 0))}
          hitSlop={12}
          disabled={weeksAgo === 0}
        >
          <Ionicons name="chevron-forward" size={18} color={weeksAgo === 0 ? 'transparent' : (isDark ? '#666' : '#bbb')} />
        </TouchableOpacity>
      </View>

      {/* ── Body SVG ── */}
      {isGains && bodyCompLoading ? (
        <View style={s.loadingArea}>
          <ActivityIndicator size="small" color={accent} />
        </View>
      ) : (
        <View style={s.bodyArea}>
          <Svg width="100%" height={280} viewBox={currentViewBox} preserveAspectRatio="xMidYMid meet">
            {currentPaths.DECORATIVE?.map((p, i) => (
              <Path key={`d-${i}`} d={p.d} fill={isDark ? '#2a2a2a' : '#ddd'} stroke={isDark ? '#333' : '#bbb'} strokeWidth={0.5} strokeLinejoin="round" />
            ))}
            {Object.entries(currentPaths).map(([name, paths]) => renderMuscleGroup(name, paths))}
          </Svg>
        </View>
      )}

      {/* ── Face / Dos ── */}
      <View style={s.viewRow}>
        <View style={[s.viewToggleContainer, isDark && s.viewToggleContainerDark]}>
          {['front', 'back'].map(v => (
            <TouchableOpacity
              key={v}
              onPress={() => setView(v)}
              activeOpacity={0.7}
              style={[s.viewToggleBtn, view === v && s.viewToggleBtnActive, view === v && { backgroundColor: accent }]}
            >
              <Text style={[s.viewToggleText, view === v && s.viewToggleTextActive, isDark && view !== v && { color: '#888' }]}>
                {v === 'front' ? 'Face' : 'Dos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[s.sessionCount, isDark && { color: '#888' }]}>
          {filteredSessions.length} séance{filteredSessions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* ── Top muscles ── */}
      {hasData ? (
        <View style={s.topList}>
          {topMuscles.map((muscle, i) => (
            <View key={muscle.zone} style={[s.topRow, i < topMuscles.length - 1 && s.topRowBorder, isDark && i < topMuscles.length - 1 && s.topRowBorderDark]}>
              <View style={[s.topDot, { backgroundColor: muscle.color.fill }]} />
              <Text style={[s.topName, isDark && s.topNameDark]}>
                {ZONE_LABELS[muscle.zone] || muscle.zone}
              </Text>
              <Text style={[s.topValue, isDark && s.topValueDark]}>
                {isGains
                  ? `+${muscle.gainG || Math.round(muscle.count)}g`
                  : (muscle.count % 1 === 0 ? muscle.count : muscle.count.toFixed(1))
                }
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[s.empty, isDark && s.emptyDark]}>
          {isGains ? 'Pas de données de croissance' : 'Aucune séance sur cette période'}
        </Text>
      )}

      {/* ── Scale ── */}
      {hasData && (
        <View style={s.scaleRow}>
          <Text style={[s.scaleLabel, isDark && s.scaleLabelDark]}>Peu</Text>
          <View style={s.scaleBar}>
            {colorPalette.map((c, i) => (
              <View key={i} style={[s.scaleStep, { backgroundColor: c.fill }]} />
            ))}
          </View>
          <Text style={[s.scaleLabel, isDark && s.scaleLabelDark]}>Max</Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
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
    backgroundColor: '#1F1F1F',
  },

  // Segmented toggle
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  segmentedDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  segActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  segActiveDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0,
    elevation: 0,
  },
  segText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#aaa',
  },
  segTextDark: {
    color: '#555',
  },

  // Week navigation
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
    color: '#777',
  },

  // Body
  loadingArea: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyArea: {
    alignItems: 'center',
    marginVertical: 4,
  },

  // View toggle (Face/Dos)
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  viewToggleBtn: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  viewToggleBtnActive: {
    borderRadius: 8,
  },
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
    fontSize: 11,
    color: '#ccc',
  },

  // Top muscles
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
  empty: {
    textAlign: 'center',
    fontSize: 13,
    color: '#bbb',
    paddingVertical: 16,
  },
  emptyDark: {
    color: '#555',
  },

  // Scale
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
