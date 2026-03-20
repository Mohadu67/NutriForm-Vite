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

import { theme } from '../../theme';
import { useHomeData } from '../../hooks/useHomeData';
import { getDailySummary, getNutritionGoals } from '../../api/nutrition';

import {
  StatsOverview,
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

        {/* Stats Overview */}
        <StatsOverview
          stats={stats}
          sessionsTrend={stats.sessionsTrend}
          bestStreak={stats.streak}
          avgSessionDuration={stats.totalSessions > 0 ? Math.round(stats.totalMinutes / stats.totalSessions) : 0}
          badgeCount={3}
          nextBadge={{ emoji: '🔥', name: 'Série 7j' }}
          onSessionsClick={handleSessionsClick}
          onBadgesClick={handleBadgesClick}
        />

        {/* Weekly Goal */}
        <WeeklyGoalSection
          stats={stats}
          weeklyGoal={weeklyGoal}
          weeklyProgress={weeklyProgress}
          weeklyCalories={weeklyCalories}
          onEditGoal={() => setShowGoalModal(true)}
        />

        {/* Nutrition Mini Widget */}
        {nutritionData && (
          <TouchableOpacity
            style={[styles.nutritionWidget, isDark && styles.nutritionWidgetDark]}
            onPress={() => navigation.navigate('Nutrition')}
            activeOpacity={0.8}
          >
            <View style={styles.nutritionWidgetHeader}>
              <Text style={[styles.nutritionWidgetTitle, isDark && { color: '#FFF' }]}>
                Nutrition du jour
              </Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#888' : '#999'} />
            </View>
            <View style={styles.nutritionWidgetRow}>
              <View style={styles.nutritionWidgetStat}>
                <Text style={[styles.nutritionWidgetValue, isDark && { color: '#FFF' }]}>
                  {nutritionData.consumed}
                </Text>
                <Text style={styles.nutritionWidgetLabel}>consommé</Text>
              </View>
              <View style={[styles.nutritionWidgetDivider, isDark && { backgroundColor: '#444' }]} />
              <View style={styles.nutritionWidgetStat}>
                <Text style={[styles.nutritionWidgetValue, isDark && { color: '#FFF' }]}>
                  {Math.max(nutritionData.goal + nutritionData.burned - nutritionData.consumed, 0)}
                </Text>
                <Text style={styles.nutritionWidgetLabel}>restant</Text>
              </View>
              <View style={[styles.nutritionWidgetDivider, isDark && { backgroundColor: '#444' }]} />
              <View style={styles.nutritionWidgetStat}>
                <Text style={[styles.nutritionWidgetValue, isDark && { color: '#FFF' }]}>
                  {nutritionData.burned}
                </Text>
                <Text style={styles.nutritionWidgetLabel}>brûlé</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <QuickActions navigation={navigation} subscriptionTier={subscriptionTier} />

        {/* Recent Activity */}
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

        {/* Sections lourdes (lazy loaded) */}
        {showHeavySections ? (
          <>
            <CardioStats sportStats={sportStats} />

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

            {stats.totalSessions > 0 && (
              <WeeklySummary
                weeklySessions={stats.last7Days}
                weeklyCalories={weeklyCalories}
                userName={displayName}
              />
            )}
          </>
        ) : (
          <View style={styles.loadingPlaceholder}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingPlaceholderText, isDark && styles.loadingTextDark]}>
              Chargement des statistiques...
            </Text>
          </View>
        )}

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
  nutritionWidget: {
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
  nutritionWidgetDark: {
    backgroundColor: '#2A2A2A',
  },
  nutritionWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  nutritionWidgetTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  nutritionWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  nutritionWidgetStat: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionWidgetValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  nutritionWidgetLabel: {
    fontSize: theme.fontSize.xs,
    color: '#888',
    marginTop: 2,
  },
  nutritionWidgetDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5E5',
  },
});
