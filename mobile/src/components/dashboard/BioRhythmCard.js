import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { getReadinessScore } from '../../api/biorhythm';

// ─── Tips testosterone / cortisol (rotation par jour de la semaine) ──
const TIPS = [
  "Le zinc et la vitamine D soutiennent la production de testostérone",
  "Les bons lipides (avocat, noix, huile d'olive) sont essentiels pour les hormones",
  "7-9h de sommeil profond = pic de testostérone optimal le matin",
  "L'entraînement en force stimule davantage la testostérone que le cardio",
  "Réduire le stress chronique aide à maintenir un bon ratio T/C",
  "Les oméga-3 (poisson gras, graines de lin) réduisent le cortisol",
  "Éviter l'alcool améliore la qualité du sommeil et la récupération hormonale",
];

// ─── Helpers ────────────────────────────────────────────────────────
const getTodayTip = () => TIPS[new Date().getDay() % TIPS.length];

// ─── Main component ─────────────────────────────────────────────────
export const BioRhythmCard = ({ gender }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Only render for male users
  if (gender !== 'male') return null;

  if (loading) {
    return (
      <View style={[st.card, isDark && st.cardDark]}>
        <View style={st.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  // Pas de données ou données estimées (pas de vrai sommeil sync) → ne pas afficher
  if (!data || !data.hasRealData) return null;

  const morningWindow = data.morningWindow || { start: '10:00', end: '12:00' };
  const afternoonWindow = data.afternoonWindow || { start: '16:00', end: '19:00' };
  const optimalWindow = data.optimalWindow;

  // Determine which window is recommended
  const recommendedIsMorning =
    optimalWindow?.start === morningWindow.start &&
    optimalWindow?.end === morningWindow.end;

  // Check if each window is past
  const now = new Date();
  const currentHour = now.getHours();
  const morningEndH = parseInt(morningWindow.end.split(':')[0], 10);
  const afternoonEndH = parseInt(afternoonWindow.end.split(':')[0], 10);
  const morningPast = currentHour >= morningEndH;
  const afternoonPast = currentHour >= afternoonEndH;
  const allPast = morningPast && afternoonPast;

  const tip = getTodayTip();

  return (
    <View style={[st.card, isDark && st.cardDark]}>
      {/* Header */}
      <View style={st.header}>
        <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
        <Text style={[st.title, isDark && st.titleDark]}>
          {allPast ? 'Fenêtre optimale — demain' : 'Fenêtre optimale'}
        </Text>
      </View>

      {/* Time blocks */}
      <View style={st.windowsRow}>
        {/* Matin */}
        <View
          style={[
            st.windowBlock,
            isDark && st.windowBlockDark,
            !morningPast && recommendedIsMorning && st.windowBlockActive,
            !morningPast && recommendedIsMorning && isDark && st.windowBlockActiveDark,
            morningPast && st.windowBlockPast,
          ]}
        >
          {!morningPast && recommendedIsMorning && (
            <View style={st.starBadge}>
              <Ionicons name="star" size={11} color={theme.colors.primary} />
            </View>
          )}
          {morningPast && (
            <View style={st.starBadge}>
              <Ionicons name="checkmark-circle" size={13} color={isDark ? '#444' : '#ccc'} />
            </View>
          )}
          <Text style={[st.windowLabel, isDark && st.windowLabelDark, morningPast && st.windowLabelPast]}>
            Matin
          </Text>
          <Text style={[st.windowTime, isDark && st.windowTimeDark, !morningPast && recommendedIsMorning && st.windowTimeActive, morningPast && st.windowTimePast]}>
            {morningWindow.start}
          </Text>
          <Text style={[st.windowTime, isDark && st.windowTimeDark, !morningPast && recommendedIsMorning && st.windowTimeActive, morningPast && st.windowTimePast]}>
            {morningWindow.end}
          </Text>
        </View>

        {/* Après-midi */}
        <View
          style={[
            st.windowBlock,
            isDark && st.windowBlockDark,
            !afternoonPast && !recommendedIsMorning && st.windowBlockActive,
            !afternoonPast && !recommendedIsMorning && isDark && st.windowBlockActiveDark,
            afternoonPast && st.windowBlockPast,
          ]}
        >
          {!afternoonPast && !recommendedIsMorning && (
            <View style={st.starBadge}>
              <Ionicons name="star" size={11} color={theme.colors.primary} />
            </View>
          )}
          {afternoonPast && (
            <View style={st.starBadge}>
              <Ionicons name="checkmark-circle" size={13} color={isDark ? '#444' : '#ccc'} />
            </View>
          )}
          <Text style={[st.windowLabel, isDark && st.windowLabelDark, afternoonPast && st.windowLabelPast]}>
            Après-midi
          </Text>
          <Text style={[st.windowTime, isDark && st.windowTimeDark, !afternoonPast && !recommendedIsMorning && st.windowTimeActive, afternoonPast && st.windowTimePast]}>
            {afternoonWindow.start}
          </Text>
          <Text style={[st.windowTime, isDark && st.windowTimeDark, !afternoonPast && !recommendedIsMorning && st.windowTimeActive, afternoonPast && st.windowTimePast]}>
            {afternoonWindow.end}
          </Text>
        </View>
      </View>

      {/* Tip section */}
      <View style={[st.tipSection, isDark && st.tipSectionDark]}>
        <Ionicons
          name="bulb-outline"
          size={15}
          color={isDark ? '#f59e0b' : '#d97706'}
        />
        <Text style={[st.tipText, isDark && st.tipTextDark]}>{tip}</Text>
      </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  titleDark: {
    color: '#eee',
  },

  // Windows row
  windowsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  windowBlock: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  windowBlockDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  windowBlockActive: {
    backgroundColor: 'rgba(240,164,122,0.08)',
    borderColor: 'rgba(240,164,122,0.25)',
  },
  windowBlockActiveDark: {
    backgroundColor: 'rgba(240,164,122,0.10)',
    borderColor: 'rgba(240,164,122,0.20)',
  },
  starBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  windowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 2,
  },
  windowLabelDark: {
    color: '#777',
  },
  windowTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555',
    lineHeight: 22,
  },
  windowTimeDark: {
    color: '#aaa',
  },
  windowTimeActive: {
    color: '#f0a47a',
  },
  windowBlockPast: {
    opacity: 0.45,
  },
  windowLabelPast: {
    color: '#bbb',
  },
  windowTimePast: {
    color: '#bbb',
    textDecorationLine: 'line-through',
  },

  // Tip section
  tipSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 12,
    padding: 12,
  },
  tipSectionDark: {
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#78716c',
    lineHeight: 17,
  },
  tipTextDark: {
    color: '#a8a29e',
  },
});
