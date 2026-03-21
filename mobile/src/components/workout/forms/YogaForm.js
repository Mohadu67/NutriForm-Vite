import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../theme';

const YOGA_STYLES = [
  { value: 'hatha', label: 'Hatha' },
  { value: 'vinyasa', label: 'Vinyasa' },
  { value: 'yin', label: 'Yin' },
  { value: 'ashtanga', label: 'Ashtanga' },
  { value: 'restauratif', label: 'Restauratif' },
  { value: 'pranayama', label: 'Pranayama' },
  { value: 'autre', label: 'Autre' },
];

export default function YogaForm({ yoga = {}, onPatch, isDark }) {
  const [showStylePicker, setShowStylePicker] = useState(false);
  const selectedStyle = YOGA_STYLES.find(s => s.value === yoga.style);

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
              value={yoga.durationMin ? String(yoga.durationMin) : ''}
              onChangeText={(val) => onPatch({ durationMin: val })}
              keyboardType="numeric"
              placeholder="60"
              placeholderTextColor={isDark ? '#555' : '#CCC'}
            />
            <Text style={[styles.unit, isDark && styles.unitDark]}>min</Text>
          </View>
        </View>

        {/* Style */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="leaf-outline" size={14} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.label, isDark && styles.labelDark]}>Style</Text>
          </View>
          <TouchableOpacity
            style={[styles.inputRow, isDark && styles.inputRowDark, styles.selectRow]}
            onPress={() => setShowStylePicker(true)}
          >
            <Text style={[
              styles.selectText,
              isDark && styles.inputDark,
              !selectedStyle && styles.placeholder,
            ]}>
              {selectedStyle?.label || 'Choisir'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={isDark ? '#666' : '#999'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Focus / Intention */}
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Ionicons name="sparkles-outline" size={14} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.label, isDark && styles.labelDark]}>Focus / Intention</Text>
        </View>
        <TextInput
          style={[styles.textArea, isDark && styles.textAreaDark]}
          value={yoga.focus || ''}
          onChangeText={(val) => onPatch({ focus: val })}
          placeholder="Souplesse, relaxation..."
          placeholderTextColor={isDark ? '#555' : '#CCC'}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Style picker modal */}
      <Modal visible={showStylePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStylePicker(false)}
        >
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>Style de yoga</Text>
            {YOGA_STYLES.map((style) => (
              <TouchableOpacity
                key={style.value}
                style={[
                  styles.modalOption,
                  yoga.style === style.value && styles.modalOptionActive,
                ]}
                onPress={() => {
                  onPatch({ style: style.value });
                  setShowStylePicker(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  isDark && styles.textDark,
                  yoga.style === style.value && styles.modalOptionTextActive,
                ]}>
                  {style.label}
                </Text>
                {yoga.style === style.value && (
                  <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  selectRow: { paddingVertical: 10, justifyContent: 'space-between' },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 10,
  },
  inputDark: { color: '#FFF' },
  selectText: { fontSize: 15, fontWeight: '500', color: '#333' },
  placeholder: { color: '#CCC' },
  unit: { fontSize: 13, color: '#888', marginLeft: 4 },
  unitDark: { color: '#666' },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  textAreaDark: { backgroundColor: '#2A2A2A', color: '#FFF' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalContentDark: { backgroundColor: '#1E1E1E' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#333', marginBottom: 16, textAlign: 'center' },
  textDark: { color: '#FFF' },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalOptionActive: { backgroundColor: `${theme.colors.primary}15` },
  modalOptionText: { fontSize: 15, color: '#333' },
  modalOptionTextActive: { fontWeight: '600', color: theme.colors.primary },
});
