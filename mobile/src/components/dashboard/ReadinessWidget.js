import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, useColorScheme,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { getReadinessScore } from '../../api/biorhythm';

// ─── Helpers ────────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 90) return '#22C55E';
  if (score >= 70) return '#84CC16';
  if (score >= 50) return '#EAB308';
  if (score >= 30) return '#F97316';
  return '#EF4444';
};

const getScoreGradient = (score) => {
  if (score >= 90) return { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.20)' };
  if (score >= 70) return { bg: 'rgba(132,204,22,0.10)', border: 'rgba(132,204,22,0.20)' };
  if (score >= 50) return { bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.20)' };
  if (score >= 30) return { bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.20)' };
  return { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.20)' };
};

// ─── Arc gauge renderer ─────────────────────────────────────────────
const renderArc = (size, strokeWidth, percentage, color, isDark) => {
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

// ─── Factor bar ─────────────────────────────────────────────────────
const FactorRow = ({ icon, label, score, isDark }) => {
  const color = getScoreColor(score);
  return (
    <View style={st.factorRow}>
      <Ionicons name={icon} size={16} color={isDark ? '#777' : '#999'} />
      <Text style={[st.factorLabel, isDark && st.factorLabelDark]}>{label}</Text>
      <View style={[st.factorTrack, isDark && st.factorTrackDark]}>
        <View style={[st.factorFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[st.factorScore, { color }]}>{score}</Text>
    </View>
  );
};

// ─── Main widget ────────────────────────────────────────────────────
export const ReadinessWidget = ({ onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchReadiness = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const result = await getReadinessScore(today);
      if (result.success && result.data?.data) {
        setData(result.data.data);
      }
    } catch (e) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReadiness(); }, [fetchReadiness]);

  if (loading) {
    return (
      <View style={[st.card, isDark && st.cardDark]}>
        <View style={st.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[st.card, isDark && st.cardDark]}>
        <View style={st.emptyWrap}>
          <Ionicons name="pulse-outline" size={28} color={isDark ? '#333' : '#ddd'} />
          <Text style={[st.emptyText, isDark && st.emptyTextDark]}>
            Sync tes données de sommeil pour voir ton score
          </Text>
        </View>
      </View>
    );
  }

  const score = data.score || 0;
  const color = getScoreColor(score);
  const gradientStyle = getScoreGradient(score);
  const factors = data.factors || {};
  const window = data.optimalWindow;

  return (
    <View style={[st.card, isDark && st.cardDark]}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Ionicons name="pulse" size={18} color={color} />
          <Text style={[st.title, isDark && st.titleDark]}>Readiness</Text>
        </View>
        <TouchableOpacity onPress={() => setExpanded(e => !e)} hitSlop={12}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={isDark ? '#555' : '#bbb'}
          />
        </TouchableOpacity>
      </View>

      {/* Main content row */}
      <View style={st.mainRow}>
        {/* Score gauge */}
        <View style={st.gaugeWrap}>
          {renderArc(110, 9, score, color, isDark)}
          <View style={st.gaugeCenter}>
            <Text style={[st.scoreValue, { color }]}>{score}</Text>
            <Text style={[st.scoreLabel, isDark && st.scoreLabelDark]}>
              {data.label || '—'}
            </Text>
          </View>
        </View>

        {/* Right side — recommendation + optimal window */}
        <View style={st.infoCol}>
          <Text style={[st.recommendation, isDark && st.recommendationDark]} numberOfLines={3}>
            {data.recommendation || 'Données insuffisantes'}
          </Text>

          {window && (
            <View style={[st.windowBadge, { backgroundColor: gradientStyle.bg, borderColor: gradientStyle.border }]}>
              <Ionicons name="time-outline" size={13} color={color} />
              <Text style={[st.windowText, { color }]}>
                {window.start} — {window.end}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Expanded factors */}
      {expanded && (
        <View style={st.factorsSection}>
          <View style={[st.factorsDivider, isDark && st.factorsDividerDark]} />
          {factors.sleep && (
            <FactorRow icon="moon-outline" label="Sommeil" score={factors.sleep.score} isDark={isDark} />
          )}
          {factors.recovery && (
            <FactorRow icon="fitness-outline" label="Récupération" score={factors.recovery.score} isDark={isDark} />
          )}
          {factors.stress && (
            <FactorRow icon="heart-outline" label="Stress" score={factors.stress.score} isDark={isDark} />
          )}
        </View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────
const st = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
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
  loadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#bbb',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#555',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  titleDark: {
    color: '#eee',
  },

  // Main row
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gaugeWrap: {
    width: 110,
    height: 64,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  gaugeCenter: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginTop: -2,
  },
  scoreLabelDark: {
    color: '#777',
  },

  // Info column
  infoCol: {
    flex: 1,
    gap: 8,
  },
  recommendation: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    lineHeight: 18,
  },
  recommendationDark: {
    color: '#aaa',
  },
  windowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  windowText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Factors
  factorsSection: {
    marginTop: 4,
    gap: 10,
  },
  factorsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 6,
  },
  factorsDividerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    width: 88,
  },
  factorLabelDark: {
    color: '#777',
  },
  factorTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  factorTrackDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  factorFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  factorScore: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'right',
  },
});
