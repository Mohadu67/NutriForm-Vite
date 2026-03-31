import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import healthService from '../../services/healthService';
import { detectCurrentPhase } from '../../services/cycleService';

// ─── Main component ─────────────────────────────────────────────────
export const CycleCard = ({ gender }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [cycleInfo, setCycleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCycleData = useCallback(async () => {
    try {
      setLoading(true);
      const cycleData = await healthService.getLastMenstrualCycle();
      if (cycleData) {
        const info = detectCurrentPhase(cycleData);
        setCycleInfo(info);
      }
    } catch (e) {
      // silently fail — HealthKit may not be available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (gender === 'female') {
      fetchCycleData();
    } else {
      setLoading(false);
    }
  }, [gender, fetchCycleData]);

  // Only render for female users
  if (gender !== 'female') return null;

  if (loading) {
    return (
      <View style={[st.card, isDark && st.cardDark]}>
        <View style={st.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  // No cycle data available
  if (!cycleInfo) {
    return (
      <View style={[st.card, isDark && st.cardDark]}>
        <View style={st.emptyWrap}>
          <Ionicons name="flower-outline" size={28} color={isDark ? '#333' : '#ddd'} />
          <Text style={[st.emptyText, isDark && st.emptyTextDark]}>
            Aucune donnée de cycle disponible. Synchronise tes données de santé.
          </Text>
        </View>
      </View>
    );
  }

  const { phase, dayInCycle, daysUntilNext, recommendations } = cycleInfo;
  const phaseColor = phase.color;

  return (
    <View style={[st.card, isDark && st.cardDark]}>
      {/* Header — Phase + day */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <Text style={st.headerEmoji}>{phase.emoji}</Text>
          <View>
            <Text style={[st.title, isDark && st.titleDark]}>
              {phase.label} — J{dayInCycle}
            </Text>
            <Text style={[st.energyLabel, { color: phaseColor }]}>
              Énergie {phase.energy.toLowerCase()}
            </Text>
          </View>
        </View>
        <View style={[st.phaseDot, { backgroundColor: phaseColor }]} />
      </View>

      {/* Divider */}
      <View style={[st.divider, isDark && st.dividerDark]} />

      {/* Message / recommendation */}
      {recommendations?.message && (
        <Text style={[st.message, isDark && st.messageDark]}>
          {recommendations.message}
        </Text>
      )}

      {/* Training badges */}
      {recommendations?.training?.length > 0 && (
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Ionicons name="barbell-outline" size={15} color={isDark ? '#777' : '#999'} />
            <Text style={[st.sectionLabel, isDark && st.sectionLabelDark]}>
              Entraînement recommandé
            </Text>
          </View>
          <View style={st.chipRow}>
            {recommendations.training.map((item) => (
              <View
                key={item}
                style={[st.chip, isDark && st.chipDark]}
              >
                <Text style={[st.chipText, isDark && st.chipTextDark]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Avoid badges */}
      {recommendations?.avoid?.length > 0 && (
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
            <Text style={[st.sectionLabel, isDark && st.sectionLabelDark]}>
              À éviter
            </Text>
          </View>
          <View style={st.chipRow}>
            {recommendations.avoid.map((item) => (
              <View
                key={item}
                style={[st.chip, st.chipAvoid, isDark && st.chipAvoidDark]}
              >
                <Text style={[st.chipText, st.chipAvoidText]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Nutrition line */}
      {recommendations?.nutrition && (
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Ionicons name="nutrition-outline" size={15} color={isDark ? '#777' : '#999'} />
            <Text style={[st.sectionLabel, isDark && st.sectionLabelDark]}>
              Nutrition
            </Text>
          </View>
          <Text style={[st.nutritionFocus, isDark && st.nutritionFocusDark]}>
            {recommendations.nutrition.focus}
          </Text>
          <Text style={[st.nutritionFoods, isDark && st.nutritionFoodsDark]}>
            {recommendations.nutrition.foods.join(' · ')}
          </Text>
        </View>
      )}

      {/* Supplements */}
      {recommendations?.supplements?.length > 0 && (
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Ionicons name="leaf-outline" size={15} color={isDark ? '#777' : '#999'} />
            <Text style={[st.sectionLabel, isDark && st.sectionLabelDark]}>
              Suppléments
            </Text>
          </View>
          <View style={st.chipRow}>
            {recommendations.supplements.map((item) => (
              <View
                key={item}
                style={[st.chip, st.chipSupplement, isDark && st.chipSupplementDark]}
              >
                <Text style={[st.chipText, st.chipSupplementText, isDark && st.chipSupplementTextDark]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Divider */}
      <View style={[st.divider, isDark && st.dividerDark]} />

      {/* Countdown to next period */}
      <View style={st.footer}>
        <Ionicons name="calendar-outline" size={14} color={isDark ? '#777' : '#999'} />
        <Text style={[st.footerText, isDark && st.footerTextDark]}>
          {daysUntilNext > 0
            ? `Prochaines règles dans ${daysUntilNext} jour${daysUntilNext > 1 ? 's' : ''}`
            : 'Règles prévues aujourd\'hui ou en retard'}
        </Text>
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
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  titleDark: {
    color: '#eee',
  },
  energyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 10,
  },
  dividerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Message
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  messageDark: {
    color: '#aaa',
  },

  // Section
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  sectionLabelDark: {
    color: '#777',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  chipDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
  },
  chipTextDark: {
    color: '#bbb',
  },

  // Avoid chips
  chipAvoid: {
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  chipAvoidDark: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  chipAvoidText: {
    color: '#EF4444',
  },

  // Supplement chips
  chipSupplement: {
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  chipSupplementDark: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  chipSupplementText: {
    color: '#16a34a',
  },
  chipSupplementTextDark: {
    color: '#4ade80',
  },

  // Nutrition
  nutritionFocus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 3,
  },
  nutritionFocusDark: {
    color: '#ccc',
  },
  nutritionFoods: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888',
    lineHeight: 17,
  },
  nutritionFoodsDark: {
    color: '#777',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  footerTextDark: {
    color: '#666',
  },
});
