import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { theme } from '../../theme';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useWorkout } from '../../contexts/WorkoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { detectExerciseMode, getInitialDataForMode } from '../../utils/exerciseTypeDetector';

export default function PastSessionScreen({ navigation }) {
  const { savePastSession } = useWorkout();
  const { user } = useAuth();

  const [date, setDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [durationMin, setDurationMin] = useState('45');
  const [sessionName, setSessionName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);

  const themedStyles = useThemedStyles((isDark) => ({
    bg: isDark ? '#0F0F1A' : '#FAFAFA',
    cardBg: isDark ? 'rgba(30, 30, 45, 0.8)' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    textPrimary: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    inputBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    inputBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    isDark,
  }));

  const formattedDate = useMemo(() => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [date]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleAddExercises = () => {
    // Navigate to exercise picker, passing a callback
    navigation.navigate('ExercicesTab', {
      screen: 'ExercicesScreen',
      params: {
        pastSessionMode: true,
        onSelectExercise: (exercice) => {
          setExercises(prev => {
            if (prev.some(e => e.exercice.id === exercice.id)) return prev;
            const mode = detectExerciseMode(exercice);
            const initialData = getInitialDataForMode(mode);
            return [...prev, { exercice, mode, ...initialData }];
          });
        },
      },
    });
  };

  const handleRemoveExercise = (exerciceId) => {
    setExercises(prev => prev.filter(e => e.exercice.id !== exerciceId));
  };

  const handleUpdateSet = (exerciceId, setIndex, data) => {
    setExercises(prev => prev.map(e => {
      if (e.exercice.id === exerciceId && e.sets) {
        const newSets = [...e.sets];
        newSets[setIndex] = { ...newSets[setIndex], ...data };
        return { ...e, sets: newSets };
      }
      return e;
    }));
  };

  const handleAddSet = (exerciceId) => {
    setExercises(prev => prev.map(e => {
      if (e.exercice.id === exerciceId && e.sets) {
        const lastSet = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [...e.sets, { reps: lastSet?.reps || 0, weight: lastSet?.weight || 0, completed: true }],
        };
      }
      return e;
    }));
  };

  const handleSave = async () => {
    if (exercises.length === 0) {
      Alert.alert('Oops', 'Ajoute au moins un exercice avant de sauvegarder.');
      return;
    }

    setSaving(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      await savePastSession({
        name: sessionName || `Séance du ${formattedDate}`,
        date: dateStr,
        durationMin: parseInt(durationMin, 10) || 45,
        exercises,
      });
      Alert.alert('Séance sauvegardée !', `Ta séance du ${formattedDate} a bien été enregistrée.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la séance.');
    } finally {
      setSaving(false);
    }
  };

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() - 1);

  return (
    <View style={[styles.container, { backgroundColor: themedStyles.bg }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themedStyles.textPrimary }]}>
            Séance passée
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Date picker */}
          <View style={[styles.card, { backgroundColor: themedStyles.cardBg, borderColor: themedStyles.cardBorder }]}>
            <Text style={[styles.cardLabel, { color: themedStyles.textSecondary }]}>DATE</Text>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: themedStyles.inputBg, borderColor: themedStyles.inputBorder }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.dateText, { color: themedStyles.textPrimary }]}>
                {formattedDate}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={maxDate}
                locale="fr"
              />
            )}
          </View>

          {/* Duration & name */}
          <View style={[styles.card, { backgroundColor: themedStyles.cardBg, borderColor: themedStyles.cardBorder }]}>
            <Text style={[styles.cardLabel, { color: themedStyles.textSecondary }]}>DÉTAILS</Text>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: themedStyles.textPrimary }]}>Nom (optionnel)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themedStyles.inputBg, borderColor: themedStyles.inputBorder, color: themedStyles.textPrimary }]}
                value={sessionName}
                onChangeText={setSessionName}
                placeholder="ex: Push day"
                placeholderTextColor={themedStyles.textSecondary}
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: themedStyles.textPrimary }]}>Durée (minutes)</Text>
              <TextInput
                style={[styles.input, styles.inputSmall, { backgroundColor: themedStyles.inputBg, borderColor: themedStyles.inputBorder, color: themedStyles.textPrimary }]}
                value={durationMin}
                onChangeText={setDurationMin}
                keyboardType="numeric"
                placeholder="45"
                placeholderTextColor={themedStyles.textSecondary}
              />
            </View>
          </View>

          {/* Exercises */}
          <View style={[styles.card, { backgroundColor: themedStyles.cardBg, borderColor: themedStyles.cardBorder }]}>
            <Text style={[styles.cardLabel, { color: themedStyles.textSecondary }]}>EXERCICES</Text>

            {exercises.length === 0 ? (
              <Text style={[styles.emptyText, { color: themedStyles.textSecondary }]}>
                Aucun exercice ajouté
              </Text>
            ) : (
              exercises.map((ex, idx) => (
                <View key={ex.exercice.id} style={[styles.exoItem, { borderBottomColor: themedStyles.cardBorder }]}>
                  <View style={styles.exoHeader}>
                    <Text style={[styles.exoName, { color: themedStyles.textPrimary }]}>
                      {ex.exercice.name}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveExercise(ex.exercice.id)}>
                      <Ionicons name="close-circle" size={22} color="#FF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Sets */}
                  {ex.sets && ex.sets.map((set, si) => (
                    <View key={si} style={styles.setRow}>
                      <Text style={[styles.setLabel, { color: themedStyles.textSecondary }]}>Set {si + 1}</Text>
                      <TextInput
                        style={[styles.setInput, { backgroundColor: themedStyles.inputBg, borderColor: themedStyles.inputBorder, color: themedStyles.textPrimary }]}
                        value={String(set.reps || '')}
                        onChangeText={(v) => handleUpdateSet(ex.exercice.id, si, { reps: parseInt(v, 10) || 0 })}
                        keyboardType="numeric"
                        placeholder="Reps"
                        placeholderTextColor={themedStyles.textSecondary}
                      />
                      {ex.mode !== 'pdc' && (
                        <TextInput
                          style={[styles.setInput, { backgroundColor: themedStyles.inputBg, borderColor: themedStyles.inputBorder, color: themedStyles.textPrimary }]}
                          value={String(set.weight || '')}
                          onChangeText={(v) => handleUpdateSet(ex.exercice.id, si, { weight: parseFloat(v) || 0 })}
                          keyboardType="numeric"
                          placeholder="Kg"
                          placeholderTextColor={themedStyles.textSecondary}
                        />
                      )}
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addSetBtn}
                    onPress={() => handleAddSet(ex.exercice.id)}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                    <Text style={[styles.addSetText, { color: theme.colors.primary }]}>Ajouter une série</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.addExoBtn} onPress={handleAddExercises}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.addExoBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addExoBtnText}>Ajouter des exercices</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, exercises.length === 0 && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || exercises.length === 0}
          >
            <LinearGradient
              colors={exercises.length > 0 ? [theme.colors.primary, theme.colors.primaryDark] : ['#888', '#666']}
              style={styles.saveBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                  <Text style={styles.saveBtnText}>Sauvegarder la séance</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: { fontSize: 15, fontWeight: '500' },

  fieldRow: { marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputSmall: { width: 100 },

  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },

  exoItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  exoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  exoName: { fontSize: 15, fontWeight: '600', flex: 1 },

  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  setLabel: { fontSize: 13, width: 40 },
  setInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
  },

  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, marginTop: 4 },
  addSetText: { fontSize: 13, fontWeight: '500' },

  addExoBtn: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  addExoBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  addExoBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  saveBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
