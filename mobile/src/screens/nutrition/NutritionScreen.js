import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

import { theme } from '../../theme';
import { getDailySummary, getNutritionGoals, deleteFoodLog, syncBurnedCalories } from '../../api/nutrition';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};
const MEAL_ICONS = {
  breakfast: 'sunny-outline',
  lunch: 'partly-sunny-outline',
  dinner: 'moon-outline',
  snack: 'nutrition-outline',
};

export default function NutritionScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, goalsRes] = await Promise.all([
        getDailySummary(selectedDate),
        getNutritionGoals(),
      ]);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (goalsRes.success) setGoals(goalsRes.data);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  // Re-fetch on screen focus (e.g. coming back from ManualFoodEntry)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    if (next <= today) setSelectedDate(next);
  };

  const [burnedModalVisible, setBurnedModalVisible] = useState(false);
  const [burnedDraft, setBurnedDraft] = useState('');

  const handleBurnedEdit = () => {
    setBurnedDraft(String(burned));
    setBurnedModalVisible(true);
  };

  const handleBurnedSave = async () => {
    const num = Number(burnedDraft);
    setBurnedModalVisible(false);
    if (isNaN(num) || num < 0) return;
    await syncBurnedCalories(selectedDate, num);
    fetchData();
  };

  const handleDelete = (id) => {
    Alert.alert('Supprimer', 'Supprimer cette entrée ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteFoodLog(id);
          fetchData();
        },
      },
    ]);
  };

  const consumed = summary?.consumed?.calories || 0;
  const burned = summary?.burned || 0;
  const goalCal = goals?.dailyCalories || 2000;
  const totalBudget = goalCal + burned;
  const pct = totalBudget > 0 ? Math.min((consumed / totalBudget) * 100, 100) : 0;
  const remaining = Math.max(totalBudget - consumed, 0);
  const balance = consumed - totalBudget;
  const entries = summary?.entries || [];

  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;
  const dateLabel = isToday
    ? "Aujourd'hui"
    : new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Ring
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const ringColor = pct > 100 ? '#EF4444' : pct > 80 ? '#F59E0B' : '#22C55E';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>Nutrition</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NutritionGoals')} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={isDark ? '#FFF' : '#555'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={goBack} style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={22} color={isDark ? '#CCC' : '#555'} />
          </TouchableOpacity>
          <Text style={[styles.dateLabel, isDark && styles.dateLabelDark]}>{dateLabel}</Text>
          <TouchableOpacity onPress={goForward} style={styles.dateArrow} disabled={isToday}>
            <Ionicons name="chevron-forward" size={22} color={isToday ? '#CCC' : isDark ? '#CCC' : '#555'} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Calorie Ring */}
            <View style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.ringRow}>
                <View style={styles.ringContainer}>
                  <Svg width={120} height={120}>
                    <Circle cx={60} cy={60} r={radius} fill="none" stroke={isDark ? '#333' : '#E5E7EB'} strokeWidth={8} />
                    <Circle
                      cx={60} cy={60} r={radius} fill="none"
                      stroke={ringColor}
                      strokeWidth={8}
                      strokeLinecap="round"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={offset}
                      rotation={-90}
                      origin="60,60"
                    />
                  </Svg>
                  <View style={styles.ringTextContainer}>
                    <Text style={[styles.ringValue, isDark && styles.ringValueDark]}>{consumed}</Text>
                    <Text style={styles.ringUnit}>kcal</Text>
                  </View>
                </View>
                <View style={styles.statsColumn}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Objectif</Text>
                    <Text style={[styles.statValue, isDark && styles.statValueDark]}>{goalCal} kcal</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Restant</Text>
                    <Text style={[styles.statValue, isDark && styles.statValueDark]}>{remaining} kcal</Text>
                  </View>
                  <TouchableOpacity style={styles.burnedStat} onPress={handleBurnedEdit} activeOpacity={0.6}>
                    <Text style={styles.statLabel}>Brûlé</Text>
                    <View style={styles.burnedValueRow}>
                      <Text style={[styles.statValue, isDark && styles.statValueDark]}>{burned} kcal</Text>
                      <Ionicons name="pencil-outline" size={12} color="#AAA" />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Balance</Text>
                    <Text style={[styles.statValue, isDark && styles.statValueDark, { color: balance > 0 ? '#EF4444' : '#22C55E' }]}>
                      {balance > 0 ? '+' : ''}{balance} kcal
                    </Text>
                  </View>
                </View>
              </View>

              {/* Macros row */}
              <View style={styles.macroRow}>
                <View style={[styles.macroPill, { borderColor: '#3B82F6' }]}>
                  <Text style={styles.macroLabel}>P</Text>
                  <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>
                    {summary?.consumed?.proteins || 0}g
                  </Text>
                </View>
                <View style={[styles.macroPill, { borderColor: '#F59E0B' }]}>
                  <Text style={styles.macroLabel}>G</Text>
                  <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>
                    {summary?.consumed?.carbs || 0}g
                  </Text>
                </View>
                <View style={[styles.macroPill, { borderColor: '#EF4444' }]}>
                  <Text style={styles.macroLabel}>L</Text>
                  <Text style={[styles.macroValue, isDark && styles.macroValueDark]}>
                    {summary?.consumed?.fats || 0}g
                  </Text>
                </View>
              </View>
            </View>

            {/* Meal Groups */}
            {MEAL_ORDER.map((type) => {
              const items = entries.filter(e => e.mealType === type);
              const total = items.reduce((s, e) => s + (e.nutrition?.calories || 0), 0);

              return (
                <View key={type} style={[styles.mealCard, isDark && styles.cardDark]}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleRow}>
                      <Ionicons name={MEAL_ICONS[type]} size={18} color={theme.colors.primary} />
                      <Text style={[styles.mealTitle, isDark && styles.mealTitleDark]}>
                        {MEAL_LABELS[type]}
                      </Text>
                      {total > 0 && (
                        <Text style={styles.mealCal}>{total} kcal</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ManualFoodEntry', { mealType: type, date: selectedDate })}
                      style={styles.addBtn}
                    >
                      <Ionicons name="add" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {items.map((item) => (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.foodItem}
                      onPress={() => navigation.navigate('ManualFoodEntry', { entry: item, date: selectedDate })}
                      onLongPress={() => handleDelete(item._id)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.foodItemMain}>
                        <Text style={[styles.foodName, isDark && styles.foodNameDark]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.source === 'recipe' && (
                          <View style={styles.recipeBadge}>
                            <Text style={styles.recipeBadgeText}>Recette</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.foodItemRight}>
                        <Text style={[styles.foodCal, isDark && styles.foodCalDark]}>
                          {item.nutrition?.calories || 0} kcal
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color="#CCC" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}

            {/* FAB */}
            <View style={{ height: 80 }} />
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ManualFoodEntry', { date: selectedDate })}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Burned Calories Modal */}
      <Modal visible={burnedModalVisible} transparent animationType="fade" onRequestClose={() => setBurnedModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBurnedModalVisible(false)}>
          <View style={[styles.burnedModal, isDark && styles.cardDark]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.burnedModalTitle, isDark && { color: '#FFF' }]}>Calories brûlées</Text>
            <TextInput
              style={[styles.burnedModalInput, isDark && { backgroundColor: '#333', color: '#FFF', borderColor: '#555' }]}
              value={burnedDraft}
              onChangeText={setBurnedDraft}
              keyboardType="numeric"
              autoFocus
              placeholder="0"
              placeholderTextColor="#999"
            />
            <View style={styles.burnedModalActions}>
              <TouchableOpacity style={styles.burnedModalCancel} onPress={() => setBurnedModalVisible(false)}>
                <Text style={styles.burnedModalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.burnedModalSave} onPress={handleBurnedSave}>
                <Text style={styles.burnedModalSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  backBtn: { padding: 4 },
  settingsBtn: { padding: 4 },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text.primary },
  titleDark: { color: '#FFF' },
  content: { padding: theme.spacing.lg, paddingBottom: 180 },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  dateArrow: { padding: 4 },
  dateLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semiBold, color: '#333', textTransform: 'capitalize' },
  dateLabelDark: { color: '#E0E0E0' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: { backgroundColor: '#2A2A2A' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
  ringContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringTextContainer: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: '#333' },
  ringValueDark: { color: '#FFF' },
  ringUnit: { fontSize: theme.fontSize.xs, color: '#888' },
  statsColumn: { flex: 1, gap: theme.spacing.sm },
  statItem: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: theme.fontSize.sm, color: '#888' },
  statValue: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semiBold, color: '#333' },
  statValueDark: { color: '#E0E0E0' },
  burnedStat: { flexDirection: 'row', justifyContent: 'space-between' },
  burnedValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  macroPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
  },
  macroLabel: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semiBold, color: '#888' },
  macroValue: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semiBold, color: '#333' },
  macroValueDark: { color: '#E0E0E0' },
  mealCard: {
    backgroundColor: '#FFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xs },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  mealTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semiBold, color: '#333' },
  mealTitleDark: { color: '#FFF' },
  mealCal: { fontSize: theme.fontSize.xs, color: '#888', marginLeft: theme.spacing.xs },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    minHeight: 44,
  },
  foodItemMain: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, flex: 1 },
  foodItemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  foodName: { fontSize: theme.fontSize.sm, color: '#333', flex: 1 },
  foodNameDark: { color: '#E0E0E0' },
  recipeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recipeBadgeText: { fontSize: 10, color: '#3B82F6', fontWeight: '500' },
  foodCal: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semiBold, color: '#555' },
  foodCalDark: { color: '#BBB' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  burnedModal: {
    backgroundColor: '#FFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  burnedModalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: '#333',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  burnedModalInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: '#333',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  burnedModalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  burnedModalCancel: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  burnedModalCancelText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: '#666',
  },
  burnedModalSave: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  burnedModalSaveText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
    color: '#FFF',
  },
});
