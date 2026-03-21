import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../theme';

export default function PdcSetRow({ set, index, exerciceId, onUpdate, onToggle, onRemove, canRemove, isDark, isSuggested }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();

    if (!set.completed) {
      Vibration.vibrate(50);
    }
    onToggle(exerciceId, index);
  };

  return (
    <Animated.View style={[
      styles.setRow,
      set.completed && styles.setRowCompleted,
      isDark && styles.setRowDark,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <Text style={[styles.setNumber, isDark && styles.textMuted]}>{index + 1}</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={[
            styles.input,
            isDark && styles.inputDark,
            isSuggested && styles.inputSuggested,
          ]}
          value={set.reps > 0 ? set.reps.toString() : ''}
          onChangeText={(val) => onUpdate(exerciceId, index, { reps: parseInt(val) || 0, isSuggested: false })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={isDark ? '#555' : '#CCC'}
        />
        <Text style={[styles.inputLabel, isDark && styles.textMuted]}>reps</Text>
      </View>

      <TouchableOpacity
        style={[styles.checkButton, set.completed && styles.checkButtonActive]}
        onPress={handleToggle}
      >
        <Ionicons
          name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={set.completed ? '#22C55E' : (isDark ? '#555' : '#CCC')}
        />
      </TouchableOpacity>

      {canRemove && (
        <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(exerciceId, index)}>
          <Ionicons name="close" size={18} color="#EF4444" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  setRowCompleted: { opacity: 0.6 },
  setRowDark: {},
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
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  inputDark: { backgroundColor: '#2A2A2A', color: '#FFF' },
  inputSuggested: { borderWidth: 1, borderColor: '#F59E0B40' },
  inputLabel: { fontSize: 12, color: '#999', marginLeft: 4 },
  checkButton: { padding: 4 },
  checkButtonActive: {},
  removeButton: { padding: 4 },
});
