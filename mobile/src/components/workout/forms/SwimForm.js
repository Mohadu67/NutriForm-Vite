import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../theme';

export default function SwimForm({ swim = {}, onPatch, isDark }) {
  const poolLength = swim.poolLength || '';
  const lapCount = swim.lapCount || '';
  const totalDistance = poolLength && lapCount
    ? (parseFloat(poolLength) || 0) * (parseInt(lapCount) || 0) * 2
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="resize-outline" size={14} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.label, isDark && styles.labelDark]}>Longueur bassin</Text>
          </View>
          <View style={[styles.inputRow, isDark && styles.inputRowDark]}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={String(poolLength)}
              onChangeText={(val) => onPatch({ poolLength: val })}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor={isDark ? '#555' : '#CCC'}
            />
            <Text style={[styles.unit, isDark && styles.unitDark]}>m</Text>
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="repeat-outline" size={14} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.label, isDark && styles.labelDark]}>Aller-retours</Text>
          </View>
          <View style={[styles.inputRow, isDark && styles.inputRowDark]}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={String(lapCount)}
              onChangeText={(val) => onPatch({ lapCount: val })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={isDark ? '#555' : '#CCC'}
            />
          </View>
        </View>
      </View>

      {totalDistance > 0 && (
        <View style={[styles.totalRow, isDark && styles.totalRowDark]}>
          <Ionicons name="analytics-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.totalText, isDark && styles.totalTextDark]}>
            Distance totale : <Text style={styles.totalValue}>{totalDistance} m</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  label: { fontSize: 12, color: '#666', fontWeight: '500' },
  labelDark: { color: '#888' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
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
  unit: { fontSize: 13, color: '#888', marginLeft: 4 },
  unitDark: { color: '#666' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 8,
    padding: 12,
  },
  totalRowDark: { backgroundColor: `${theme.colors.primary}20` },
  totalText: { fontSize: 14, color: '#333' },
  totalTextDark: { color: '#CCC' },
  totalValue: { fontWeight: '700', color: theme.colors.primary },
});
