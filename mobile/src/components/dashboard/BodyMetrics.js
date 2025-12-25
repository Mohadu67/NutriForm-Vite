import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * BodyMetrics - Métriques corporelles
 * IMC, poids, et objectifs caloriques
 */
export const BodyMetrics = ({ weightData, calorieTargets, weightChange }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Ne pas afficher si pas de données
  if (!weightData && !calorieTargets) {
    return null;
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Corps & Nutrition
      </Text>

      <View style={styles.metricsGrid}>
        {/* IMC / Poids */}
        {weightData && (
          <View style={[styles.metricCard, isDark && styles.metricCardDark]}>
            <View style={[styles.metricIcon, styles.metricIconBmi]}>
              <Ionicons name="scale" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>
                {weightData.bmi}
              </Text>
              <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>
                IMC • {weightData.interpretation}
              </Text>
              {weightData.weight && (
                <Text style={[styles.metricMeta, isDark && styles.metricMetaDark]}>
                  {weightData.weight} kg
                  {weightChange && weightChange.direction !== 'stable' && (
                    <>
                      {' '}• {weightChange.direction === 'down' ? '↓' : '↑'} {weightChange.value} kg
                    </>
                  )}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Calories */}
        {calorieTargets && (
          <View style={[styles.metricCard, isDark && styles.metricCardDark]}>
            <View style={[styles.metricIcon, styles.metricIconCalories]}>
              <Ionicons name="flame" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>
                {calorieTargets.maintenance}
              </Text>
              <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>
                kcal/jour maintien
              </Text>
              <Text style={[styles.metricMeta, isDark && styles.metricMetaDark]}>
                Perte: {calorieTargets.deficit} • Prise: {calorieTargets.surplus}
              </Text>
            </View>
          </View>
        )}
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
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    gap: theme.spacing.md,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  metricCardDark: {
    backgroundColor: '#333333',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconBmi: {
    backgroundColor: '#8B5CF6',
  },
  metricIconCalories: {
    backgroundColor: theme.colors.primary,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  metricValueDark: {
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  metricLabelDark: {
    color: '#999999',
  },
  metricMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  metricMetaDark: {
    color: '#777777',
  },
});
