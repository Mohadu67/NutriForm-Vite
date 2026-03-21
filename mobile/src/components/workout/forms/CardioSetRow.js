import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../theme';

function CardioSet({ set, index, onPatch, onRemove, canRemove, isDark }) {
  return (
    <View style={[styles.setRow, isDark && styles.setRowDark]}>
      <Text style={[styles.setNumber, isDark && styles.textMuted]}>{index + 1}</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={set.durationMin ? String(set.durationMin) : ''}
          onChangeText={(val) => onPatch(index, { durationMin: val })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={isDark ? '#555' : '#CCC'}
        />
        <Text style={[styles.inputLabel, isDark && styles.textMuted]}>min</Text>
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={set.durationSec ? String(set.durationSec) : ''}
          onChangeText={(val) => {
            const num = parseInt(val) || 0;
            onPatch(index, { durationSec: Math.min(num, 59).toString() });
          }}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={isDark ? '#555' : '#CCC'}
        />
        <Text style={[styles.inputLabel, isDark && styles.textMuted]}>sec</Text>
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={set.intensity ? String(set.intensity) : ''}
          onChangeText={(val) => {
            const num = parseInt(val) || 0;
            onPatch(index, { intensity: Math.min(Math.max(num, 0), 20) });
          }}
          keyboardType="numeric"
          placeholder="10"
          placeholderTextColor={isDark ? '#555' : '#CCC'}
        />
        <Text style={[styles.inputLabel, isDark && styles.textMuted]}>/20</Text>
      </View>

      {canRemove && (
        <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(index)}>
          <Ionicons name="close" size={18} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CardioForm({ cardioSets = [], onAdd, onRemove, onPatch, isDark }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerText, isDark && styles.textMuted, { flex: 0.4 }]}>Serie</Text>
        <Text style={[styles.headerText, isDark && styles.textMuted, { flex: 1 }]}>Duree</Text>
        <Text style={[styles.headerText, isDark && styles.textMuted, { flex: 0.6 }]}>Intensite</Text>
        <View style={{ width: 24 }} />
      </View>

      {cardioSets.map((set, index) => (
        <CardioSet
          key={index}
          set={set}
          index={index}
          onPatch={onPatch}
          onRemove={onRemove}
          canRemove={cardioSets.length > 1}
          isDark={isDark}
        />
      ))}

      <TouchableOpacity
        style={[styles.addButton, isDark && styles.addButtonDark]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={20} color={theme.colors.primary} />
        <Text style={styles.addText}>Ajouter une serie</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerText: { fontSize: 11, color: '#999', fontWeight: '500', textTransform: 'uppercase' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  setRowDark: { borderBottomColor: '#333' },
  setNumber: { width: 24, fontSize: 14, fontWeight: '600', color: '#999', textAlign: 'center' },
  textMuted: { color: '#666' },
  inputGroup: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  inputDark: { backgroundColor: '#2A2A2A', color: '#FFF' },
  inputLabel: { fontSize: 11, color: '#999', marginLeft: 3, width: 22 },
  removeButton: { padding: 4 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addButtonDark: { borderColor: `${theme.colors.primary}30` },
  addText: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
});
