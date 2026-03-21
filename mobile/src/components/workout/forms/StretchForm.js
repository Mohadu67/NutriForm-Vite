import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../theme';

export default function StretchForm({ stretch = {}, onPatch, isDark }) {
  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Ionicons name="time-outline" size={14} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.label, isDark && styles.labelDark]}>Duree du maintien</Text>
        </View>
        <View style={[styles.inputRow, isDark && styles.inputRowDark]}>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={stretch.durationSec ? String(stretch.durationSec) : ''}
            onChangeText={(val) => onPatch({ durationSec: val })}
            keyboardType="numeric"
            placeholder="30"
            placeholderTextColor={isDark ? '#555' : '#CCC'}
          />
          <Text style={[styles.unit, isDark && styles.unitDark]}>secondes</Text>
        </View>
      </View>

      <View style={[styles.tip, isDark && styles.tipDark]}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
        <Text style={[styles.tipText, isDark && styles.tipTextDark]}>
          Maintenez l'etirement 20 a 30 secondes sans forcer
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  field: {},
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
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 8,
    padding: 10,
  },
  tipDark: { backgroundColor: `${theme.colors.primary}20` },
  tipText: { flex: 1, fontSize: 12, color: '#666' },
  tipTextDark: { color: '#AAA' },
});
