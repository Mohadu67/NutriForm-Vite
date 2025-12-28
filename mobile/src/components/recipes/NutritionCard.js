import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { theme } from '../../theme';

const NutritionCard = ({ nutrition }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const items = [
    { label: 'Calories', value: nutrition.calories, unit: 'kcal', color: '#EF4444' },
    { label: 'Protéines', value: nutrition.proteins, unit: 'g', color: '#8B5CF6' },
    { label: 'Glucides', value: nutrition.carbs, unit: 'g', color: '#F59E0B' },
    { label: 'Lipides', value: nutrition.fats, unit: 'g', color: '#06B6D4' },
  ];

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>
        Valeurs nutritionnelles
      </Text>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <View style={[styles.icon, { backgroundColor: `${item.color}20` }]}>
              <View style={[styles.iconInner, { backgroundColor: item.color }]} />
            </View>
            <Text style={[styles.value, isDark && styles.valueDark]}>
              {item.value}{item.unit}
            </Text>
            <Text style={[styles.label, isDark && styles.labelDark]}>
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
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    ...theme.shadows.sm,
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: '#1a1a1a',
    marginBottom: theme.spacing.md,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  value: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#1a1a1a',
  },
  valueDark: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: '#666',
    marginTop: 2,
  },
  labelDark: {
    color: '#888',
  },
});

export default NutritionCard;
