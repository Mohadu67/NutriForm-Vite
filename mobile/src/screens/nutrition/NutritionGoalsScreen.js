import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { getNutritionGoals, updateNutritionGoals } from '../../api/nutrition';

const GOAL_OPTIONS = [
  { value: 'weight_loss', label: 'Perte de poids', icon: 'trending-down' },
  { value: 'maintenance', label: 'Maintien', icon: 'swap-horizontal' },
  { value: 'muscle_gain', label: 'Prise de muscle', icon: 'trending-up' },
];

export default function NutritionGoalsScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

  const [dailyCalories, setDailyCalories] = useState('2000');
  const [proteins, setProteins] = useState('150');
  const [carbs, setCarbs] = useState('250');
  const [fats, setFats] = useState('65');
  const [goal, setGoal] = useState('maintenance');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNutritionGoals().then((res) => {
      if (res.success && res.data) {
        setDailyCalories(String(res.data.dailyCalories || 2000));
        setProteins(String(res.data.macros?.proteins || 150));
        setCarbs(String(res.data.macros?.carbs || 250));
        setFats(String(res.data.macros?.fats || 65));
        setGoal(res.data.goal || 'maintenance');
      }
    });
  }, []);

  const handleSave = async () => {
    const cal = Number(dailyCalories);
    if (!cal || cal < 500 || cal > 10000) {
      Alert.alert('Erreur', 'Les calories doivent être entre 500 et 10000.');
      return;
    }

    setSaving(true);
    const result = await updateNutritionGoals({
      dailyCalories: cal,
      macros: {
        proteins: Number(proteins) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
      },
      goal,
    });
    setSaving(false);

    if (result.success) {
      Alert.alert('Enregistré', 'Vos objectifs ont été mis à jour.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de sauvegarder.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>Objectifs nutritionnels</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Goal type */}
        <Text style={[styles.label, isDark && styles.labelDark]}>Objectif</Text>
        <View style={styles.goalRow}>
          {GOAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.goalBtn,
                isDark && styles.goalBtnDark,
                goal === opt.value && styles.goalBtnActive,
              ]}
              onPress={() => setGoal(opt.value)}
            >
              <Ionicons name={opt.icon} size={20} color={goal === opt.value ? '#FFF' : isDark ? '#AAA' : '#666'} />
              <Text style={[
                styles.goalBtnText,
                goal === opt.value && styles.goalBtnTextActive,
                isDark && goal !== opt.value && { color: '#AAA' },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calories */}
        <View style={styles.field}>
          <Text style={[styles.label, isDark && styles.labelDark]}>Calories journalières (kcal)</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={dailyCalories}
            onChangeText={setDailyCalories}
            keyboardType="numeric"
          />
        </View>

        {/* Macros */}
        <Text style={[styles.sectionTitle, isDark && styles.labelDark]}>Macronutriments</Text>
        <View style={styles.macroRow}>
          <View style={[styles.field, styles.macroField]}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Protéines (g)</Text>
            <TextInput style={[styles.input, isDark && styles.inputDark]} value={proteins} onChangeText={setProteins} keyboardType="numeric" />
          </View>
          <View style={[styles.field, styles.macroField]}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Glucides (g)</Text>
            <TextInput style={[styles.input, isDark && styles.inputDark]} value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, isDark && styles.labelDark]}>Lipides (g)</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} value={fats} onChangeText={setFats} keyboardType="numeric" />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.light },
  containerDark: { backgroundColor: '#1A1A1A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: { padding: 4 },
  title: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semiBold, color: '#000' },
  titleDark: { color: '#FFF' },
  form: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  field: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: '#555', marginBottom: 6 },
  labelDark: { color: '#AAA' },
  sectionTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semiBold, color: '#333', marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: '#333',
  },
  inputDark: { backgroundColor: '#2A2A2A', borderColor: '#444', color: '#E0E0E0' },
  macroRow: { flexDirection: 'row', gap: theme.spacing.sm },
  macroField: { flex: 1 },
  goalRow: { flexDirection: 'column', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  goalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  goalBtnDark: { backgroundColor: '#2A2A2A', borderColor: '#444' },
  goalBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  goalBtnText: { fontSize: theme.fontSize.xs, color: '#666', fontWeight: theme.fontWeight.medium },
  goalBtnTextActive: { color: '#FFF', fontWeight: theme.fontWeight.semiBold },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  saveBtnText: { color: '#FFF', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semiBold },
});
