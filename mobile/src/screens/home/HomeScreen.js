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
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_W = SCREEN_WIDTH - 40;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  ReadinessWidget,
  BioRhythmCard,
  CycleCard,
} from '../../components/dashboard';
import { GoalModal } from '../../components/dashboard/GoalModal';

/**
 * HomeScreen - Dashboard principal de l'application
 */

// ─── Full-circle ring gauge + macros bars ───────────────────────────────
const RING_SIZE = 120;
const RING_R = 48;
const RING_CX = RING_SIZE / 2;
const RING_CY = RING_SIZE / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

const MACRO_COLORS = {
  Glucides: '#f0a47a',
  Proteines: '#72baa1',
  Lipides: '#c9a88c',
};

function NutritionGauge({ consumed, burned, goal, macros, macroGoals, isDark }) {
  const effectiveGoal = goal + burned;
  const remaining = Math.max(effectiveGoal - consumed, 0);
  const pct = effectiveGoal > 0 ? Math.min(consumed / effectiveGoal, 1) : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - pct);

  const trackColor = isDark ? 'rgba(255,255,255,0.06)' : '#efedea';

  return (
    <View>
      {/* Ring + remaining center */}
      <View style={nwStyles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          {/* Track */}
          <Circle
            cx={RING_CX}
            cy={RING_CY}
            r={RING_R}
            fill="none"
            stroke={trackColor}
            strokeWidth={8}
          />
          {/* Fill */}
          {pct > 0 && (
            <Circle
              cx={RING_CX}
              cy={RING_CY}
              r={RING_R}
              fill="none"
              stroke="#72baa1"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${RING_CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              rotation={-90}
              origin={`${RING_CX}, ${RING_CY}`}
            />
          )}
        </Svg>
        <View style={nwStyles.ringCenterText}>
          <Text style={[nwStyles.remainingValue, isDark && { color: '#f3f3f6' }]}>
            {remaining}
          </Text>
          <Text style={[nwStyles.remainingLabel, isDark && { color: '#7a7a88' }]}>
            restantes
          </Text>
        </View>
      </View>

      {/* Meta row: Objectif | Consomme | Brule */}
      <View style={[nwStyles.metaRow, isDark && { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
        <View style={nwStyles.metaItem}>
          <Text style={[nwStyles.metaValue, isDark && { color: '#f3f3f6' }]}>{goal}</Text>
          <Text style={[nwStyles.metaLabel, isDark && { color: '#7a7a88' }]}>Objectif</Text>
        </View>
        <View style={[nwStyles.metaDivider, isDark && { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
        <View style={nwStyles.metaItem}>
          <Text style={[nwStyles.metaValue, isDark && { color: '#f3f3f6' }]}>{consumed}</Text>
          <Text style={[nwStyles.metaLabel, isDark && { color: '#7a7a88' }]}>Consomme</Text>
        </View>
        <View style={[nwStyles.metaDivider, isDark && { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
        <View style={nwStyles.metaItem}>
          <Text style={[nwStyles.metaValue, isDark && { color: '#f3f3f6' }]}>{burned}</Text>
          <Text style={[nwStyles.metaLabel, isDark && { color: '#7a7a88' }]}>Brule</Text>
        </View>
      </View>

      {/* Macros bars */}
      {macros && macroGoals && (
        <View style={[nwStyles.macrosRow, isDark && { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
          <MacroBar label="Glucides" current={macros.carbs} goal={macroGoals.carbs} isDark={isDark} />
          <MacroBar label="Proteines" current={macros.proteins} goal={macroGoals.proteins} isDark={isDark} />
          <MacroBar label="Lipides" current={macros.fats} goal={macroGoals.fats} isDark={isDark} />
        </View>
      )}
    </View>
  );
}

function MacroBar({ label, current, goal, isDark }) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const trackColor = isDark ? 'rgba(255,255,255,0.06)' : '#efedea';
  const fillColor = MACRO_COLORS[label] || '#f0a47a';

  return (
    <View style={nwStyles.macro}>
      <View style={nwStyles.macroHeader}>
        <View style={[nwStyles.macroDot, { backgroundColor: fillColor }]} />
        <Text style={[nwStyles.macroLabel, isDark && { color: '#c1c1cb' }]}>{label}</Text>
      </View>
      <View style={[nwStyles.macroTrack, { backgroundColor: trackColor }]}>
        <View style={[nwStyles.macroFill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
      </View>
      <Text style={[nwStyles.macroValue, isDark && { color: '#7a7a88' }]}>
        {current} / {goal} g
      </Text>
    </View>
  );
}

/* ─── Reusable carousel section with title + dots ─── */

function CarouselSection({ title, isDark, children }) {
  const [active, setActive] = useState(0);
  const slides = React.Children.toArray(children).filter(Boolean);

  const onScroll = useCallback((e) => {
    setActive(Math.round(e.nativeEvent.contentOffset.x / (SLIDE_W + 12)));
  }, []);

  if (slides.length === 0) return null;

  return (
    <View style={styles.carouselSection}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_W + 12} decelerationRate="fast" onMomentumScrollEnd={onScroll}
        style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, alignItems: 'stretch' }}>
        {slides}
      </ScrollView>
      {slides.length > 1 && (
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === active && styles.dotActive, isDark && i !== active && styles.dotDark]} />
          ))}
        </View>
      )}
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
    userGender,
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

  // Fetch nutrition data for today — reload each time the screen gains focus
  useFocusEffect(
    useCallback(() => {
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
    }, [])
  );

  const handleSessionsClick = useCallback(() => navigation.navigate('History'), [navigation]);
  const handleBadgesClick = useCallback(() => navigation.navigate('Badges'), [navigation]);

  const sportStats = { run: 0, bike: 0, swim: 0, walk: 0, hasCardio: false };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#72baa1" />
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
            tintColor="#72baa1"
            colors={['#72baa1']}
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
              size={22}
              color={isDark ? '#c1c1cb' : '#1c1917'}
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
            style={[styles.upsellBanner, isDark && styles.upsellBannerDark]}
            onPress={() => navigation.navigate('ProfileTab', { screen: 'Subscription' })}
            activeOpacity={0.8}
          >
            <View style={styles.upsellContent}>
              <View style={[styles.upsellIconWrap, isDark && styles.upsellIconWrapDark]}>
                <Ionicons name="star" size={18} color="#72baa1" />
              </View>
              <View style={styles.upsellTextContainer}>
                <Text style={[styles.upsellTitle, isDark && styles.upsellTitleDark]}>
                  Passez Premium
                </Text>
                <Text style={[styles.upsellSubtitle, isDark && styles.upsellSubtitleDark]}>
                  Historique illimite, heatmap et plus
                </Text>
              </View>
            </View>
            <View style={styles.upsellButton}>
              <Text style={styles.upsellButtonText}>7j gratuits</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Actions rapides */}
        <QuickActions navigation={navigation} />

        {/* Objectif semaine (compact, hors carousel) */}
        <WeeklyGoalSection
          stats={stats}
          weeklyGoal={weeklyGoal}
          weeklyProgress={weeklyProgress}
          weeklyCalories={weeklyCalories}
          onEditGoal={() => setShowGoalModal(true)}
        />

        {/* ━━━ Carousel "Mon résumé" ━━━ */}
        <CarouselSection title="Mon résumé" isDark={isDark}>
          {/* Slide 1: Recap semaine */}
          {stats.totalSessions > 0 && (
            <View style={styles.slide}>
              <WeeklySummary
                weeklySessions={stats.last7Days}
                weeklyCalories={weeklyCalories}
                weeklyDuration={weeklyDuration}
                weeklyTrainingDays={weeklyTrainingDays}
                style={{ flex: 1 }}
              />
            </View>
          )}
          {/* Slide 2: Nutrition du jour */}
          <View style={styles.slide}>
            <View style={[styles.card, isDark && styles.cardDark, { marginBottom: 0, flex: 1 }]}>
              <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                Nutrition du jour
              </Text>
              {nutritionData ? (
                <>
                  <TouchableOpacity onPress={() => navigation.navigate('Nutrition')} activeOpacity={0.8}>
                    <NutritionGauge
                      consumed={nutritionData.consumed}
                      burned={nutritionData.burned}
                      goal={nutritionData.goal}
                      macros={nutritionData.macros}
                      macroGoals={nutritionData.macroGoals}
                      isDark={isDark}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addMealBtn}
                    onPress={() => navigation.navigate('ManualFoodEntry')} activeOpacity={0.7}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addMealBtnText}>Ajouter un repas</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{ fontSize: 13, color: '#a8a29e', textAlign: 'center', paddingVertical: 20 }}>
                  Aucune donnée nutrition
                </Text>
              )}
            </View>
          </View>
        </CarouselSection>

        {/* ━━━ Carousel "Bien-être" ━━━ */}
        <CarouselSection title="Bien-être" isDark={isDark}>
          <View style={{ width: SLIDE_W }}>
            <ReadinessWidget />
          </View>
          {userGender && (
            <View style={{ width: SLIDE_W }}>
              <BioRhythmCard gender={userGender} />
              <CycleCard gender={userGender} />
            </View>
          )}
        </CarouselSection>

        {/* Carousel Activite + Heatmap */}
        <CarouselSection title="Mon activite" isDark={isDark}>
          <View style={styles.slide}>
            <View style={[styles.card, isDark && styles.cardDark, { marginBottom: 0, flex: 1 }]}>
              <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                Activite recente
              </Text>
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
            </View>
          </View>
          {showHeavySections && stats.totalSessions > 0 && (
            <View style={styles.slide}>
              <View style={[styles.card, isDark && styles.cardDark, { marginBottom: 0, flex: 1 }]}>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                  Repartition musculaire
                </Text>
                <MuscleHeatmap sessions={sessionsForHeatmap} />
              </View>
            </View>
          )}
        </CarouselSection>

        {/* Analyse (lazy loaded) */}
        {showHeavySections ? (
          <>
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
            <ActivityIndicator size="small" color="#72baa1" />
            <Text style={[styles.loadingPlaceholderText, isDark && styles.loadingTextDark]}>
              Chargement des statistiques...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {stats.totalSessions === 0 && (
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
            <View style={[styles.emptyIconWrap, isDark && styles.emptyIconWrapDark]}>
              <Ionicons name="barbell-outline" size={36} color={isDark ? '#7a7a88' : '#a8a29e'} />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              Pret a commencer ?
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Lance ta premiere seance pour voir tes progres
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

// ─── Main styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfbf9',
  },
  containerDark: {
    backgroundColor: '#0e0e11',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#78716c',
  },
  loadingTextDark: {
    color: '#7a7a88',
  },
  loadingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingPlaceholderText: {
    fontSize: 13,
    color: '#a8a29e',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 180,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  greetingDark: {
    color: '#f3f3f6',
  },
  subtitle: {
    fontSize: 13,
    color: '#78716c',
    marginTop: 2,
  },
  subtitleDark: {
    color: '#7a7a88',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  /* ── Upsell Banner ── */
  upsellBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  upsellBannerDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  upsellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  upsellIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(114,186,161,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upsellIconWrapDark: {
    backgroundColor: 'rgba(114,186,161,0.15)',
  },
  upsellTextContainer: {
    flex: 1,
  },
  upsellTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  upsellTitleDark: {
    color: '#f3f3f6',
  },
  upsellSubtitle: {
    fontSize: 12,
    color: '#78716c',
    marginTop: 1,
  },
  upsellSubtitleDark: {
    color: '#7a7a88',
  },
  upsellButton: {
    backgroundColor: '#72baa1',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  upsellButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  /* ── Section ── */
  carouselSection: {
    marginBottom: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  slide: { width: SLIDE_W, minHeight: 380 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#d6d3d1' },
  dotActive: { backgroundColor: '#1c1917', width: 8, height: 8 },
  dotDark: { backgroundColor: '#444' },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  sectionTitleDark: {
    color: '#f3f3f6',
  },

  /* ── Generic card ── */
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginBottom: 12,
  },
  cardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  cardTitleDark: {
    color: '#f3f3f6',
  },

  /* ── Add meal button ── */
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 11,
    backgroundColor: '#72baa1',
    borderRadius: 14,
  },
  addMealBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  /* ── Empty State ── */
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 28,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(168,162,158,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconWrapDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  emptyTitleDark: {
    color: '#f3f3f6',
  },
  emptyText: {
    fontSize: 13,
    color: '#a8a29e',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  emptyTextDark: {
    color: '#7a7a88',
  },
  emptyButton: {
    backgroundColor: '#72baa1',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

// ─── Nutrition widget styles ────────────────────────────────────────────
const nwStyles = StyleSheet.create({
  /* Ring */
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  remainingValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  remainingLabel: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 1,
  },

  /* Meta row */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#efedea',
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.3,
  },
  metaLabel: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 2,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#efedea',
  },

  /* Macros */
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#efedea',
  },
  macro: {
    flex: 1,
    gap: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
  },
  macroTrack: {
    width: '100%',
    height: 5,
    borderRadius: 2.5,
  },
  macroFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  macroValue: {
    fontSize: 11,
    color: '#a8a29e',
  },
});
