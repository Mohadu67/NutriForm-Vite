import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIONS = [
  { label: 'Programmes', icon: 'fitness',       color: '#72baa1', nav: 'Programs' },
  { label: 'Recettes',   icon: 'restaurant',    color: '#f0a47a', nav: 'Recipes' },
  { label: 'Nutrition',  icon: 'nutrition',      color: '#72baa1', nav: 'Nutrition' },
  { label: 'Calculs',    icon: 'calculator',     color: '#c9a88c', nav: 'Calculators' },
  { label: 'Passée',     icon: 'time-outline',   color: '#8b7fc7', nav: 'ExercicesTab', params: { screen: 'PastSession' } },
];

export const QuickActions = ({ navigation }) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={styles.scroll} contentContainerStyle={styles.row}>
      {ACTIONS.map((a) => (
        <TouchableOpacity key={a.label} activeOpacity={0.7}
          style={[styles.chip, isDark && styles.chipDark]}
          onPress={() => navigation?.navigate(a.nav, a.params)}>
          <View style={[styles.iconDot, { backgroundColor: a.color + '18' }]}>
            <Ionicons name={a.icon} size={16} color={a.color} />
          </View>
          <Text style={[styles.label, isDark && styles.labelDark]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { marginBottom: 14, flexGrow: 0 },
  row: { gap: 8, paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#1c1917' },
  labelDark: { color: '#f3f3f6' },
});
