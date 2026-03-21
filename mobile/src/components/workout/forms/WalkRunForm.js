import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../theme';

export default function WalkRunForm({ walkRun = {}, onPatch, isDark }) {
  const durationMin = walkRun.durationMin || '';
  const distanceKm = walkRun.distanceKm || '';
  const pauseMin = walkRun.pauseMin || '';

  // Calcul de l'allure
  const pace = durationMin && distanceKm && parseFloat(distanceKm) > 0
    ? (parseFloat(durationMin) / parseFloat(distanceKm)).toFixed(1)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Durée */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="time-outline" size={14} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.label, isDark && styles.labelDark]}>Duree</Text>
          </View>
          <View style={[styles.inputRow, isDark && styles.inputRowDark]}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={String(durationMin)}
              onChangeText={(val) => onPatch({ durationMin: val })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={isDark ? '#555' : '#CCC'}
            />
            <Text style={[styles.unit, isDark && styles.unitDark]}>min</Text>
          </View>
        </View>

        {/* Distance */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="navigate-outline" size={14} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.label, isDark && styles.labelDark]}>Distance</Text>
          </View>
          <View style={[styles.inputRow, isDark && styles.inputRowDark]}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={String(distanceKm)}
              onChangeText={(val) => onPatch({ distanceKm: val })}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={isDark ? '#555' : '#CCC'}
            />
            <Text style={[styles.unit, isDark && styles.unitDark]}>km</Text>
          </View>
        </View>

        {/* Pause */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="pause-outline" size={14} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.label, isDark && styles.labelDark]}>Pause</Text>
          </View>
          <View style={[styles.inputRow, isDark && styles.inputRowDark]}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={String(pauseMin)}
              onChangeText={(val) => onPatch({ pauseMin: val })}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={isDark ? '#555' : '#CCC'}
            />
            <Text style={[styles.unit, isDark && styles.unitDark]}>min</Text>
          </View>
        </View>
      </View>

      {/* Allure calculée */}
      {pace && (
        <View style={[styles.paceRow, isDark && styles.paceRowDark]}>
          <Ionicons name="speedometer-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.paceText, isDark && styles.paceTextDark]}>
            Allure : <Text style={styles.paceValue}>{pace} min/km</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  label: { fontSize: 12, color: '#666', fontWeight: '500' },
  labelDark: { color: '#888' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputRowDark: { backgroundColor: '#2A2A2A' },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 10,
  },
  inputDark: { color: '#FFF' },
  unit: { fontSize: 12, color: '#888', marginLeft: 2 },
  unitDark: { color: '#666' },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 8,
    padding: 12,
  },
  paceRowDark: { backgroundColor: `${theme.colors.primary}20` },
  paceText: { fontSize: 14, color: '#333' },
  paceTextDark: { color: '#CCC' },
  paceValue: { fontWeight: '700', color: theme.colors.primary },
});
