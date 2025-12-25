import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

// Composants Dashboard
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

/**
 * HomeScreen - Dashboard principal de l'application
 * Affiche toutes les statistiques et l'activité de l'utilisateur
 */
export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useAuth();

  // États
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [weeklyGoal, setWeeklyGoal] = useState(4);

  // Stats dérivées du summary API
  const stats = useMemo(() => ({
    totalSessions: summary?.totalSessions || 0,
    last7Days: summary?.workoutsCount7d || 0,
    streak: summary?.streakDays || 0,
    totalHours: Math.floor((summary?.avgWorkoutDurationMin || 0) * (summary?.totalSessions || 0) / 60),
    totalMinutes: (summary?.avgWorkoutDurationMin || 0) * (summary?.totalSessions || 0),
    sessionsTrend: 'same',
  }), [summary]);

  const weightData = useMemo(() => {
    if (!summary?.imc) return null;
    let interpretation = null;
    const imc = summary.imc;
    if (imc < 18.5) interpretation = 'Insuffisant';
    else if (imc < 25) interpretation = 'Normal';
    else if (imc < 30) interpretation = 'Surpoids';
    else interpretation = 'Obésité';
    return {
      bmi: imc.toFixed(1),
      interpretation,
      weight: summary.latestWeight || summary.lastWeight,
    };
  }, [summary]);

  const calorieTargets = useMemo(() => {
    if (!summary?.calories) return null;
    return {
      maintenance: Math.round(summary.calories),
      deficit: Math.max(Math.round(summary.calories) - 500, 0),
      surplus: Math.round(summary.calories) + 500,
    };
  }, [summary]);

  const weeklyCalories = summary?.caloriesBurnedWeek || 0;
  const recentSessions = sessions.slice(0, 5);
  const sportStats = { run: 0, bike: 0, swim: 0, walk: 0, hasCardio: false };

  // Calcul du progrès hebdomadaire
  const weeklyProgress = useMemo(() => {
    if (weeklyGoal === 0) return 0;
    return Math.min(100, Math.round((stats.last7Days / weeklyGoal) * 100));
  }, [stats.last7Days, weeklyGoal]);

  // Trend des sessions (comparaison semaine précédente)
  const sessionsTrend = stats.sessionsTrend;

  // Nom d'affichage
  const displayName = useMemo(() => {
    const name = user?.prenom || user?.pseudo || user?.displayName || 'Utilisateur';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [user]);

  // Sous-titre dynamique
  const subtitle = useMemo(() => {
    if (stats.streak >= 7) return 'Tu es en feu ! Continue comme ça';
    if (stats.streak >= 3) return 'Belle série en cours';
    if (stats.totalSessions > 0) return 'Voici ton résumé';
    return 'Prêt à commencer ?';
  }, [stats.streak, stats.totalSessions]);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Appels API en parallèle
      const [summaryResponse, historyResponse, subscriptionResponse] = await Promise.all([
        apiClient.get(endpoints.history.summary).catch((e) => {
          console.log('[HOME] Summary error:', e.message);
          return { data: null };
        }),
        apiClient.get(endpoints.history.list).catch(() => ({ data: [] })),
        apiClient.get(endpoints.subscription.status).catch(() => ({ data: { tier: 'free' } })),
      ]);

      // Summary (stats précalculées)
      setSummary(summaryResponse.data);

      // Sessions pour la liste récente
      const historyData = historyResponse.data || [];
      // Filtrer les sessions workout de l'historique
      const workoutSessions = Array.isArray(historyData)
        ? historyData.filter(h =>
            h.action?.toLowerCase().includes('workout') ||
            h.action?.toLowerCase().includes('session') ||
            h.meta?.entries?.length > 0
          ).map(h => ({
            id: h._id,
            name: h.meta?.sessionName || h.meta?.label || h.action || 'Séance',
            date: h.createdAt,
            endedAt: h.createdAt,
            durationMinutes: h.meta?.duration || h.meta?.durationMinutes,
            caloriesBurned: h.meta?.caloriesBurned || h.meta?.kcal,
            entries: h.meta?.entries || h.meta?.exercises || [],
          }))
        : [];
      setSessions(workoutSessions);

      // Statut abonnement
      const subData = subscriptionResponse.data || {};
      setSubscriptionTier(subData.tier || 'free');

      console.log('[HOME] Loaded:', {
        summary: !!summaryResponse.data,
        totalSessions: summaryResponse.data?.totalSessions,
        streak: summaryResponse.data?.streakDays,
        tier: subData.tier,
      });

    } catch (error) {
      console.error('[HOME] Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Rafraîchir les données
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Charger au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Callbacks pour les actions
  const handleDeleteSession = useCallback((sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    // TODO: Appeler l'API pour supprimer
  }, []);

  const handleSaveSessionName = useCallback((sessionId, newName) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, name: newName } : s))
    );
    // TODO: Appeler l'API pour renommer
  }, []);

  const handleEditGoal = useCallback(() => {
    // TODO: Ouvrir modal pour éditer l'objectif
    console.log('Edit weekly goal');
  }, []);

  const handleSessionsClick = useCallback(() => {
    navigation.navigate('History');
  }, [navigation]);

  const handleBadgesClick = useCallback(() => {
    navigation.navigate('Badges');
  }, [navigation]);

  const isFreeUser = subscriptionTier === 'free';

  // Extraire les calories d'une session
  const extractSessionCalories = useCallback((session) => {
    return session?.caloriesBurned || session?.calories || 0;
  }, []);

  // Formater une date
  const formatDate = useCallback((raw) => {
    if (!raw) return '';
    const date = new Date(raw);
    if (isNaN(date)) return '';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }, []);

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
            onPress={() => navigation.navigate('Notifications')}
            style={styles.notificationButton}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={isDark ? '#FFFFFF' : theme.colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Upsell Banner - Utilisateurs gratuits */}
        {isFreeUser && (
          <TouchableOpacity
            style={[styles.upsellBanner, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Subscription')}
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

        {/* Stats Overview - 4 cartes */}
        <StatsOverview
          stats={stats}
          sessionsTrend={sessionsTrend}
          bestStreak={stats.streak}
          avgSessionDuration={stats.totalSessions > 0 ? Math.round(stats.totalMinutes / stats.totalSessions) : 0}
          badgeCount={3}
          nextBadge={{ emoji: '🔥', name: 'Série 7j' }}
          onSessionsClick={handleSessionsClick}
          onBadgesClick={handleBadgesClick}
        />

        {/* Weekly Goal - Anneau de progression */}
        <WeeklyGoalSection
          stats={stats}
          weeklyGoal={weeklyGoal}
          weeklyProgress={weeklyProgress}
          weeklyCalories={weeklyCalories}
          onEditGoal={handleEditGoal}
        />

        {/* Quick Actions - Boutons */}
        <QuickActions navigation={navigation} subscriptionTier={subscriptionTier} />

        {/* Recent Activity - Séances récentes */}
        <RecentActivity
          recentSessions={recentSessions}
          formatDate={formatDate}
          extractSessionCalories={extractSessionCalories}
          onSaveSessionName={handleSaveSessionName}
          onDeleteSession={handleDeleteSession}
          isFreeUser={isFreeUser}
          totalSessions={stats.totalSessions}
          navigation={navigation}
        />

        {/* Cardio Stats */}
        <CardioStats sportStats={sportStats} />

        {/* Muscle Heatmap */}
        {stats.totalSessions > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Répartition musculaire
            </Text>
            <MuscleHeatmap sessions={sessions} />
          </View>
        )}

        {/* Body Metrics - IMC et calories */}
        <BodyMetrics
          weightData={weightData}
          calorieTargets={calorieTargets}
        />

        {/* Weekly Summary - Résumé motivant */}
        {stats.totalSessions > 0 && (
          <WeeklySummary
            weeklySessions={stats.last7Days}
            weeklyCalories={weeklyCalories}
            userName={displayName}
          />
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
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
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
    fontWeight: theme.fontWeight.semibold,
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
    fontWeight: theme.fontWeight.semibold,
  },
});
