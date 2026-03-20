import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { getBodyCompositionSummary } from '../../api/bodyComposition';

/**
 * WeeklySummary - Résumé motivant de la semaine + recap nutrition
 * Affiche message d'encouragement, stats clés et bilan body comp
 */
export const WeeklySummary = ({
  weeklySessions = 0,
  weeklyCalories = 0,
  weeklyDuration = 0,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [bodyComp, setBodyComp] = useState(null);

  useEffect(() => {
    getBodyCompositionSummary(7).then(res => {
      if (res.success && res.data) setBodyComp(res.data);
    }).catch(() => {});
  }, []);

  // Déterminer le message de motivation
  const getMotivation = () => {
    if (weeklySessions === 0) {
      return {
        type: 'encourage',
        title: "C'est pas grave!",
        message: 'Reste focus, faut juste se lancer. Une séance et tu es reparti!',
        icon: 'trending-up',
        colors: { bg: '#FEF3C7', text: '#92400E', icon: '#F59E0B' },
      };
    } else if (weeklySessions <= 2) {
      return {
        type: 'progress',
        title: 'Bon début!',
        message: `${weeklySessions} séance${weeklySessions > 1 ? 's' : ''} cette semaine, c'est un bon début!`,
        icon: 'checkmark-circle',
        colors: { bg: '#DBEAFE', text: '#1E40AF', icon: '#3B82F6' },
      };
    } else if (weeklySessions <= 4) {
      return {
        type: 'good',
        title: 'Belle semaine!',
        message: `${weeklySessions} séances${weeklyCalories > 0 ? ` et ${weeklyCalories} kcal brûlées` : ''}!`,
        icon: 'flame',
        colors: { bg: '#FED7AA', text: '#9A3412', icon: theme.colors.primary },
      };
    } else {
      return {
        type: 'champion',
        title: 'Semaine incroyable!',
        message: `${weeklySessions} séances! Tu es une machine!`,
        icon: 'trophy',
        colors: { bg: '#FEF08A', text: '#854D0E', icon: '#EAB308' },
      };
    }
  };

  const motivation = getMotivation();

  const nutritionRecap = bodyComp ? {
    dailyBalance: bodyComp.nutrition?.dailyBalance || 0,
    avgCalories: bodyComp.nutrition?.daily?.calories || 0,
    avgProteins: bodyComp.nutrition?.daily?.proteins || 0,
    proteinPerKg: bodyComp.nutrition?.proteinPerKg || 0,
    muscleGainG: bodyComp.muscleGain?.totalG || 0,
    fatChangeG: bodyComp.fatChange?.g || 0,
    projectedWeight: bodyComp.projectedWeight || null,
  } : null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#2A2A2A' : motivation.colors.bg },
      ]}
    >
      {/* Icône principale */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isDark ? '#333333' : 'rgba(255,255,255,0.5)' },
        ]}
      >
        <Ionicons
          name={motivation.icon}
          size={32}
          color={isDark ? theme.colors.primary : motivation.colors.icon}
        />
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: isDark ? '#FFFFFF' : motivation.colors.text },
          ]}
        >
          {motivation.title}
        </Text>
        <Text
          style={[
            styles.message,
            { color: isDark ? '#CCCCCC' : motivation.colors.text },
          ]}
        >
          {motivation.message}
        </Text>
      </View>

      {/* Stats rapides */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              { color: isDark ? '#FFFFFF' : motivation.colors.text },
            ]}
          >
            {weeklySessions}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? '#AAAAAA' : motivation.colors.text },
            ]}
          >
            séance{weeklySessions !== 1 ? 's' : ''}
          </Text>
        </View>

        {weeklyCalories > 0 && (
          <View style={styles.stat}>
            <Text
              style={[
                styles.statValue,
                { color: isDark ? '#FFFFFF' : motivation.colors.text },
              ]}
            >
              {weeklyCalories}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: isDark ? '#AAAAAA' : motivation.colors.text },
              ]}
            >
              kcal
            </Text>
          </View>
        )}

        {weeklyDuration > 0 && (
          <View style={styles.stat}>
            <Text
              style={[
                styles.statValue,
                { color: isDark ? '#FFFFFF' : motivation.colors.text },
              ]}
            >
              {weeklyDuration}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: isDark ? '#AAAAAA' : motivation.colors.text },
              ]}
            >
              min
            </Text>
          </View>
        )}
      </View>

      {/* Recap Nutrition */}
      {nutritionRecap && (
        <View style={[styles.nutritionRecap, isDark && styles.nutritionRecapDark]}>
          <Text style={[styles.nutritionRecapTitle, isDark && { color: '#AAA' }]}>
            Bilan nutrition
          </Text>
          <View style={styles.nutritionRecapGrid}>
            <View style={styles.nutritionRecapItem}>
              <Text style={[styles.nutritionRecapValue, isDark && { color: '#FFF' }]}>
                {nutritionRecap.avgCalories}
              </Text>
              <Text style={[styles.nutritionRecapLabel, isDark && { color: '#AAA' }]}>
                kcal/jour
              </Text>
            </View>
            <View style={styles.nutritionRecapItem}>
              <Text style={[styles.nutritionRecapValue, isDark && { color: '#FFF' }]}>
                {nutritionRecap.avgProteins}g
              </Text>
              <Text style={[styles.nutritionRecapLabel, isDark && { color: '#AAA' }]}>
                prot ({nutritionRecap.proteinPerKg}g/kg)
              </Text>
            </View>
            <View style={styles.nutritionRecapItem}>
              <Text style={[
                styles.nutritionRecapValue,
                { color: nutritionRecap.dailyBalance >= 0 ? '#F59E0B' : '#3B82F6' },
              ]}>
                {nutritionRecap.dailyBalance >= 0 ? '+' : ''}{nutritionRecap.dailyBalance}
              </Text>
              <Text style={[styles.nutritionRecapLabel, isDark && { color: '#AAA' }]}>
                {nutritionRecap.dailyBalance >= 0 ? 'surplus' : 'deficit'}
              </Text>
            </View>
          </View>
          <View style={styles.nutritionRecapTags}>
            {nutritionRecap.muscleGainG > 0 && (
              <View style={[styles.tag, isDark && styles.tagDark]}>
                <Text style={[styles.tagText, { color: '#059669' }]}>
                  +{nutritionRecap.muscleGainG}g muscle
                </Text>
              </View>
            )}
            <View style={[styles.tag, isDark && styles.tagDark]}>
              <Text style={[styles.tagText, { color: nutritionRecap.fatChangeG > 0 ? '#EF4444' : '#059669' }]}>
                {nutritionRecap.fatChangeG >= 0 ? '+' : ''}{nutritionRecap.fatChangeG}g gras
              </Text>
            </View>
            {nutritionRecap.projectedWeight && (
              <View style={[styles.tag, isDark && styles.tagDark]}>
                <Text style={[styles.tagText, isDark && { color: '#CCC' }]}>
                  Proj. {nutritionRecap.projectedWeight} kg
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 150,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  message: {
    fontSize: theme.fontSize.sm,
    marginTop: 4,
    opacity: 0.9,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    width: '100%',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    opacity: 0.8,
  },
  nutritionRecap: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  nutritionRecapDark: {
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  nutritionRecapTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionRecapGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionRecapItem: {
    alignItems: 'center',
  },
  nutritionRecapValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  nutritionRecapLabel: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  nutritionRecapTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  tagDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
