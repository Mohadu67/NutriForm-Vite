import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

const NutritionCard = ({ nutrition }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const items = [
    { label: 'Calories', value: nutrition.calories, unit: 'kcal', color: '#1c1917' },
    { label: 'Proteines', value: nutrition.proteins, unit: 'g', color: '#72baa1' },
    { label: 'Glucides', value: nutrition.carbs, unit: 'g', color: '#f0a47a' },
    { label: 'Lipides', value: nutrition.fats, unit: 'g', color: '#c9a88c' },
  ];

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>
        Valeurs nutritionnelles
      </Text>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <View key={index} style={[styles.cell, isDark && styles.cellDark]}>
            <Text style={[styles.value, { color: isDark ? '#f3f3f6' : item.color }]}>
              {item.value}
              <Text style={styles.unit}>{item.unit}</Text>
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
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginVertical: 12,
  },
  containerDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 14,
  },
  titleDark: {
    color: '#f3f3f6',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  cellDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
  },
  unit: {
    fontSize: 11,
    fontWeight: '500',
  },
  label: {
    fontSize: 10,
    color: '#a8a29e',
    marginTop: 4,
  },
  labelDark: {
    color: '#7a7a88',
  },
});

export default NutritionCard;
