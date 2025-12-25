import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * CardioStats - Affiche les distances parcourues par sport
 * Course, vélo, natation, marche
 */
export const CardioStats = ({ sportStats }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Ne pas afficher si aucune donnée cardio
  const hasData =
    Number(sportStats?.run) > 0 ||
    Number(sportStats?.bike) > 0 ||
    Number(sportStats?.swim) > 0 ||
    Number(sportStats?.walk) > 0;

  if (!hasData) {
    return null;
  }

  const cardioItems = [
    {
      key: 'run',
      value: sportStats?.run,
      label: 'Course',
      icon: 'walk',
      color: '#EF4444',
    },
    {
      key: 'bike',
      value: sportStats?.bike,
      label: 'Vélo',
      icon: 'bicycle',
      color: '#3B82F6',
    },
    {
      key: 'swim',
      value: sportStats?.swim,
      label: 'Natation',
      icon: 'water',
      color: '#06B6D4',
    },
    {
      key: 'walk',
      value: sportStats?.walk,
      label: 'Marche',
      icon: 'footsteps',
      color: '#22C55E',
    },
  ].filter((item) => Number(item.value) > 0);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
        Distances parcourues
      </Text>

      <View style={styles.cardioGrid}>
        {cardioItems.map((item) => (
          <View
            key={item.key}
            style={[styles.cardioItem, isDark && styles.cardioItemDark]}
          >
            <View style={[styles.cardioIcon, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <Text style={[styles.cardioValue, isDark && styles.cardioValueDark]}>
              {item.value} km
            </Text>
            <Text style={[styles.cardioLabel, isDark && styles.cardioLabelDark]}>
              {item.label}
            </Text>
          </View>
        ))}
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
  cardioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  cardioItem: {
    width: '47%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
  },
  cardioItemDark: {
    backgroundColor: '#333333',
  },
  cardioIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardioValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  cardioValueDark: {
    color: '#FFFFFF',
  },
  cardioLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  cardioLabelDark: {
    color: '#999999',
  },
});
