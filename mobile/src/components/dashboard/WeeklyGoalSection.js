import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../theme';

/**
 * WeeklyGoalSection - Objectif hebdomadaire avec anneau de progression
 * Affiche la progression vers l'objectif de séances de la semaine
 */
export const WeeklyGoalSection = ({
  stats,
  weeklyGoal = 4,
  weeklyProgress = 0,
  weeklyCalories = 0,
  onEditGoal,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryColor = theme.colors.primary;

  const remaining = Math.max(0, weeklyGoal - stats.last7Days);
  const isCompleted = weeklyProgress >= 100;

  // Calcul pour l'anneau de progression
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (weeklyProgress / 100) * circumference;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Objectif semaine
        </Text>
        {onEditGoal && (
          <TouchableOpacity
            onPress={onEditGoal}
            style={styles.editButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil"
              size={16}
              color={isDark ? '#888' : theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Progress Ring */}
        <View style={styles.progressRingContainer}>
          <Svg width={120} height={120} viewBox="0 0 100 100">
            {/* Background circle */}
            <Circle
              cx="50"
              cy="50"
              r={radius}
              stroke={isDark ? '#3A3A3A' : '#E5E7EB'}
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx="50"
              cy="50"
              r={radius}
              stroke={isCompleted ? '#22C55E' : primaryColor}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            />
          </Svg>
          {/* Center text */}
          <View style={styles.progressTextContainer}>
            <Text style={[styles.progressValue, isDark && styles.progressValueDark]}>
              {stats.last7Days}
            </Text>
            <Text style={[styles.progressGoal, isDark && styles.progressGoalDark]}>
              /{weeklyGoal}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.progressInfo}>
          <Text style={[styles.progressStatus, isDark && styles.progressStatusDark]}>
            {isCompleted
              ? 'Objectif atteint !'
              : `${remaining} séance${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}
          </Text>
          {weeklyCalories > 0 && (
            <Text style={[styles.progressCalories, isDark && styles.progressCaloriesDark]}>
              {weeklyCalories.toLocaleString()} kcal brûlées cette semaine
            </Text>
          )}
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  progressRingContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  progressValue: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  progressValueDark: {
    color: '#FFFFFF',
  },
  progressGoal: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.tertiary,
  },
  progressGoalDark: {
    color: '#777777',
  },
  progressInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  progressStatus: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  progressStatusDark: {
    color: '#FFFFFF',
  },
  progressCalories: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  progressCaloriesDark: {
    color: '#999999',
  },
});
