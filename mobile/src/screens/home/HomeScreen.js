import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

import { theme } from '../../theme';
import { useHomeData } from '../../hooks/useHomeData';
import { getDailySummary, getNutritionGoals } from '../../api/nutrition';

import {
  WeeklyGoalSection,
  QuickActions,
  RecentActivity,
  CardioStats,
  BodyMetrics,
  MuscleHeatmap,
  WeeklySummary,
} from '../../components/dashboard';
import { GoalModal } from '../../components/dashboard/GoalModal';

/**
 * HomeScreen - Dashboard principal de l'application
 */
// ─── Arc gauge + macros bars ─────────────────────────────────────────
const ARC_R = 54;
const ARC_CX = 65;
const ARC_CY = 65;
const ARC_START = 135; // degrees
const ARC_SPAN = 270;  // degrees
const ARC_CIRC = 2 * Math.PI * ARC_R;
const ARC_LEN = (ARC_SPAN / 360) * ARC_CIRC;

function NutritionGauge({ consumed, burned, goal, macros, macroGoals, isDark }) {
  const effectiveGoal = goal + burned;
  const remaining = Math.max(effectiveGoal - consumed, 0);
  const pct = effectiveGoal > 0 ? Math.min(consumed / effectiveGoal, 1) : 0;
  const filledLen = pct * ARC_LEN;

  const dotAngle = ARC_START + pct * ARC_SPAN;
  const dotRad = (dotAngle * Math.PI) / 180;
  const dotX = ARC_CX + ARC_R * Math.cos(dotRad);
  const dotY = ARC_CY + ARC_R * Math.sin(dotRad);

  const trackColor = isDark ? '#3a3a3a' : '#e5e7eb';
  const accent = '#6db39b';

  return (
    <View>
      {/* Calories row */}
      <View style={styles.nwCalRow}>
        <View style={styles.nwCalSide}>
          <Text style={[styles.nwCalValue, isDark && { color: '#FFF' }]}>{consumed}</Text>
          <Text style={styles.nwCalLabel}>Mangées</Text>
        </View>

        <View style={styles.nwCalCenter}>
          <Svg width={130} height={130} viewBox="0 0 130 130">
            <Circle
              cx={ARC_CX} cy={ARC_CY} r={ARC_R}
              fill="none" stroke={trackColor} strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={`${ARC_LEN} ${ARC_CIRC}`}
              rotation={ARC_START} origin={`${ARC_CX}, ${ARC_CY}`}
            />
            {pct > 0 && (
              <Circle
                cx={ARC_CX} cy={ARC_CY} r={ARC_R}
                fill="none" stroke={accent} strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={`${filledLen} ${ARC_CIRC}`}
                rotation={ARC_START} origin={`${ARC_CX}, ${ARC_CY}`}
              />
            )}
            <Circle cx={dotX} cy={dotY} r={5} fill={accent} />
          </Svg>
          <View style={styles.nwCenterText}>
            <Text style={[styles.nwRemainingValue, isDark && { color: '#FFF' }]}>{remaining}</Text>
            <Text style={styles.nwRemainingLabel}>Restantes</Text>
          </View>
        </View>

        <View style={styles.nwCalSide}>
          <Text style={[styles.nwCalValue, isDark && { color: '#FFF' }]}>{burned}</Text>
          <Text style={styles.nwCalLabel}>Brûlées</Text>
        </View>
      </View>

      {/* Macros bars */}
      {macros && macroGoals && (
        <View style={[styles.nwMacrosRow, isDark && { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
          <MacroBar label="Glucides" current={macros.carbs} goal={macroGoals.carbs} isDark={isDark} />
          <MacroBar label="Protéines" current={macros.proteins} goal={macroGoals.proteins} isDark={isDark} />
          <MacroBar label="Lipides" current={macros.fats} goal={macroGoals.fats} isDark={isDark} />
        </View>
      )}
    </View>
  );
}

function MacroBar({ label, current, goal, isDark }) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const trackColor = isDark ? '#3a3a3a' : '#e5e7eb';

  return (
    <View style={styles.nwMacro}>
      <Text style={[styles.nwMacroLabel, isDark && { color: '#e0e0e0' }]}>{label}</Text>
      <View style={[styles.nwMacroTrack, { backgroundColor: trackColor }]}>
        <View style={[styles.nwMacroDot, { left: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.nwMacroValue}>{current} / {goal} g</Text>
    </View>
  );
}

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

  const {
    loading,
    refreshing,
    showHeavySections,
    isFreeUser,
    subscriptionTier,
    unreadNotifications,
    stats,
    recentSessions,
    sessionsForHeatmap,
    weightData,
    calorieTargets,
    rmDataHistory,
    cardioDataHistory,
    weeklyCalories,
    weeklyDuration,
    weeklyTrainingDays,
    weeklyGoal,
    weeklyProgress,
    displayName,
    subtitle,
    onRefresh,
    deleteSession,
    saveSessionName,
    saveWeeklyGoal,
    formatDate,
    extractSessionCalories,
  } = useHomeData();

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);

  // Fetch nutrition data for today
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([getDailySummary(today), getNutritionGoals()])
      .then(([summaryRes, goalsRes]) => {
        if (summaryRes.success || goalsRes.success) {
          setNutritionData({
            consumed: summaryRes.data?.consumed?.calories || 0,
            burned: summaryRes.data?.burned || 0,
            goal: goalsRes.data?.dailyCalories || 2000,
            macros: {
              proteins: summaryRes.data?.consumed?.proteins || 0,
              carbs: summaryRes.data?.consumed?.carbs || 0,
              fats: summaryRes.data?.consumed?.fats || 0,
            },
            macroGoals: goalsRes.data?.macros || null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSessionsClick = useCallback(() => navigation.navigate('History'), [navigation]);
  const handleBadgesClick = useCallback(() => navigation.navigate('Badges'), [navigation]);

  const sportStats = { run: 0, bike: 0, swim: 0, walk: 0, hasCardio: false };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, isDark && styles.greetingDark]}>
              Salut, {displayName}
            </Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {subtitle}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('HomeNotifications')}
            style={styles.notificationButton}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={isDark ? '#FFFFFF' : theme.colors.text.primary}
            />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Upsell Banner */}
        {isFreeUser && (
          <TouchableOpacity
            style={[styles.upsellBanner, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('ProfileTab', { screen: 'Subscription' })}
            activeOpacity={0.8}
          >
            <View style={styles.upsellContent}>
              <Text style={styles.upsellIcon}>⭐</Text>
              <View style={styles.upsellTextContainer}>
                <Text style={styles.upsellTitle}>Passez Premium</Text>
                <Text style={styles.upsellSubtitle}>
                  Historique illimité, heatmap et plus
                </Text>
              </View>
            </View>
            <View style={styles.upsellButton}>
              <Text style={[styles.upsellButtonText, { color: theme.colors.primary }]}>7j gratuits</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Bloc 1 : Motivation + Objectif ── */}

        {/* Recap motivant de la semaine */}
        {stats.totalSessions > 0 && (
          <WeeklySummary
            weeklySessions={stats.last7Days}
            weeklyCalories={weeklyCalories}
            weeklyDuration={weeklyDuration}
            weeklyTrainingDays={weeklyTrainingDays}
          />
        )}

        {/* Objectif semaine */}
        <WeeklyGoalSection
          stats={stats}
          weeklyGoal={weeklyGoal}
          weeklyProgress={weeklyProgress}
          weeklyCalories={weeklyCalories}
          onEditGoal={() => setShowGoalModal(true)}
        />

        {/* ── Bloc 2 : Activité récente ── */}
        <RecentActivity
          recentSessions={recentSessions}
          formatDate={formatDate}
          extractSessionCalories={extractSessionCalories}
          onSaveSessionName={saveSessionName}
          onDeleteSession={deleteSession}
          isFreeUser={isFreeUser}
          totalSessions={stats.totalSessions}
          navigation={navigation}
        />

        {/* ── Bloc 3 : Nutrition + Analyse ── */}

        {/* Nutrition du jour */}
        {nutritionData && (
          <TouchableOpacity
            style={[styles.nwCard, isDark && styles.nwCardDark]}
            onPress={() => navigation.navigate('Nutrition')}
            activeOpacity={0.8}
          >
            <NutritionGauge
              consumed={nutritionData.consumed}
              burned={nutritionData.burned}
              goal={nutritionData.goal}
              macros={nutritionData.macros}
              macroGoals={nutritionData.macroGoals}
              isDark={isDark}
            />
          </TouchableOpacity>
        )}

        {/* Analyse (lazy loaded) */}
        {showHeavySections ? (
          <>
            {stats.totalSessions > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                  Répartition musculaire
                </Text>
                <MuscleHeatmap sessions={sessionsForHeatmap} />
              </View>
            )}

            <BodyMetrics
              weightData={weightData}
              calorieTargets={calorieTargets}
              rmData={rmDataHistory}
              cardioData={cardioDataHistory}
            />

            <CardioStats sportStats={sportStats} />
          </>
        ) : (
          <View style={styles.loadingPlaceholder}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingPlaceholderText, isDark && styles.loadingTextDark]}>
              Chargement des statistiques...
            </Text>
          </View>
        )}

        {/* Actions rapides (en bas) */}
        <QuickActions navigation={navigation} subscriptionTier={subscriptionTier} />

        {/* Empty State */}
        {stats.totalSessions === 0 && (
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              Prêt à commencer ?
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Lance ta première séance pour voir tes progrès
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Exercices')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Commencer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Goal Modal */}
      <GoalModal
        visible={showGoalModal}
        currentGoal={weeklyGoal}
        onSave={saveWeeklyGoal}
        onClose={() => setShowGoalModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  loadingTextDark: {
    color: '#888888',
  },
  loadingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  loadingPlaceholderText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  greetingDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  subtitleDark: {
    color: '#888888',
  },
  notificationButton: {
    padding: theme.spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  upsellBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  upsellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  upsellIcon: {
    fontSize: 24,
  },
  upsellTextContainer: {
    flex: 1,
  },
  upsellTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  upsellSubtitle: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
  },
  upsellButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  upsellButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateDark: {
    backgroundColor: '#2A2A2A',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  emptyTextDark: {
    color: '#888888',
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
  },
  /* ── Nutrition Widget (arc gauge + macros) ── */
  nwCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  nwCardDark: {
    backgroundColor: '#2A2A2A',
  },
  nwCalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nwCalSide: {
    alignItems: 'center',
    minWidth: 60,
  },
  nwCalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  nwCalLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  nwCalCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nwCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  nwRemainingValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  nwRemainingLabel: {
    fontSize: 12,
    color: '#888',
  },
  nwMacrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  nwMacro: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  nwMacroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  nwMacroTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  nwMacroDot: {
    position: 'absolute',
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6db39b',
    marginLeft: -5,
  },
  nwMacroValue: {
    fontSize: 11,
    color: '#888',
  },
});
