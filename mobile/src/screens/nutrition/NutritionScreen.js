import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

import { theme } from '../../theme';
import { getDailySummary, getNutritionGoals, deleteFoodLog } from '../../api/nutrition';

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

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

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
  const pct = goalCal > 0 ? Math.min((consumed / goalCal) * 100, 100) : 0;
  const remaining = Math.max(goalCal - consumed, 0);
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
                    <Text style={[styles.statValue, isDark && styles.statValueDark]}>{goalCal}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Restant</Text>
                    <Text style={[styles.statValue, isDark && styles.statValueDark]}>{remaining}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Brûlé</Text>
                    <Text style={[styles.statValue, isDark && styles.statValueDark]}>{burned}</Text>
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
                      onLongPress={() => handleDelete(item._id)}
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
                      <Text style={[styles.foodCal, isDark && styles.foodCalDark]}>
                        {item.nutrition?.calories || 0} kcal
                      </Text>
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
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
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
    paddingVertical: theme.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
  },
  foodItemMain: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, flex: 1 },
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
});
