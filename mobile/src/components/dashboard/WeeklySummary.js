import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * WeeklySummary - Résumé motivant de la semaine
 * Affiche message d'encouragement et stats clés
 */
export const WeeklySummary = ({
  weeklySessions = 0,
  weeklyCalories = 0,
  weeklyDuration = 0,
  userName,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
});
