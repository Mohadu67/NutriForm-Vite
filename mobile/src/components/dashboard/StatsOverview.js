import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * StatsOverview - Affiche les 4 statistiques principales en row
 */
export const StatsOverview = ({
  stats,
  sessionsTrend,
  bestStreak,
  avgSessionDuration,
  badgeCount = 0,
  nextBadge,
  onSessionsClick,
  onBadgesClick,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const primaryColor = theme.colors.primary; // #F7B186

  return (
    <View style={styles.container}>
      {/* Total Sessions */}
      <TouchableOpacity
        style={[styles.statCard, isDark && styles.statCardDark]}
        onPress={() => stats.totalSessions > 0 && onSessionsClick?.()}
        disabled={stats.totalSessions === 0}
        activeOpacity={0.7}
      >
        <View style={[styles.statIcon, { backgroundColor: `${primaryColor}20` }]}>
          <Ionicons name="barbell" size={18} color={primaryColor} />
        </View>
        <Text style={[styles.statValue, isDark && styles.statValueDark]}>
          {stats.totalSessions}
        </Text>
        <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
          Séances
        </Text>
      </TouchableOpacity>

      {/* Streak */}
      <View style={[styles.statCard, isDark && styles.statCardDark]}>
        <View style={[styles.statIcon, { backgroundColor: `${primaryColor}20` }]}>
          <Ionicons name="flame" size={18} color={primaryColor} />
        </View>
        <Text style={[styles.statValue, isDark && styles.statValueDark]}>
          {stats.streak}
        </Text>
        <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
          Série
        </Text>
      </View>

      {/* Duration */}
      <View style={[styles.statCard, isDark && styles.statCardDark]}>
        <View style={[styles.statIcon, { backgroundColor: `${primaryColor}20` }]}>
          <Ionicons name="time" size={18} color={primaryColor} />
        </View>
        <Text style={[styles.statValue, isDark && styles.statValueDark]}>
          {stats.totalHours}h
        </Text>
        <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
          Durée
        </Text>
      </View>

      {/* Badges */}
      <TouchableOpacity
        style={[styles.statCard, isDark && styles.statCardDark]}
        onPress={onBadgesClick}
        activeOpacity={0.7}
      >
        <View style={[styles.statIcon, { backgroundColor: `${primaryColor}20` }]}>
          <Ionicons name="trophy" size={18} color={primaryColor} />
        </View>
        <Text style={[styles.statValue, isDark && styles.statValueDark]}>
          {badgeCount}
        </Text>
        <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
          Badges
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardDark: {
    backgroundColor: '#2A2A2A',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  statValueDark: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statLabelDark: {
    color: '#999999',
  },
});
