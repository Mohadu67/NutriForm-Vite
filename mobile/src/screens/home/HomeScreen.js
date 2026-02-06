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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';
import logger from '../../services/logger';

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
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(4);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Optimisation: Lazy loading des sections lourdes
  const [showHeavySections, setShowHeavySections] = useState(false);

  const GOAL_STORAGE_KEY = '@weekly_goal';
  const CALCULATOR_STORAGE_KEY = '@calculator_data';
  const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

  // State pour les données des calculateurs
  const [calculatorData, setCalculatorData] = useState(null);

  // Stats dérivées du summary API
  const stats = useMemo(() => ({
    totalSessions: summary?.totalSessions || 0,
    last7Days: summary?.workoutsCount7d || 0,
    streak: summary?.streakDays || 0,
    totalHours: Math.floor((summary?.avgWorkoutDurationMin || 0) * (summary?.totalSessions || 0) / 60),
    totalMinutes: (summary?.avgWorkoutDurationMin || 0) * (summary?.totalSessions || 0),
    sessionsTrend: 'same',
  }), [summary]);

  // Helper pour extraire l'historique du nouveau format
  const getHistory = useCallback((type) => {
    if (!calculatorData?.[type]) return [];
    // Nouveau format avec history
    if (calculatorData[type].history) {
      return calculatorData[type].history;
    }
    // Ancien format (migration)
    return [calculatorData[type]];
  }, [calculatorData]);

  const weightData = useMemo(() => {
    const history = getHistory('imc');
    if (history.length > 0) {
      const latest = history[0];
      return {
        bmi: latest.imc?.toFixed(1) || latest.imc,
        interpretation: latest.categorie,
        weight: latest.poids,
        history: history,
      };
    }
    // Sinon utiliser les données API
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
      history: [],
    };
  }, [summary, getHistory]);

  const calorieTargets = useMemo(() => {
    const history = getHistory('calories');
    if (history.length > 0) {
      const data = history[0];
      const maintenance = data.maintenance;
      const objectifLabels = {
        perte: 'Perte de poids',
        stabiliser: 'Maintien',
        prise: 'Prise de masse',
      };
      return {
        maintenance: maintenance,
        deficit: Math.max(maintenance - 500, 1200),
        surplus: maintenance + 500,
        objectif: objectifLabels[data.objectif] || 'Maintien',
        objectifCalories: data.calories,
        macros: data.macros,
        fromCalculator: true,
        history: history,
      };
    }
    // Sinon utiliser les données API
    if (!summary?.calories) return null;
    return {
      maintenance: Math.round(summary.calories),
      deficit: Math.max(Math.round(summary.calories) - 500, 0),
      surplus: Math.round(summary.calories) + 500,
      history: [],
    };
  }, [summary, getHistory]);

  // Données 1RM et Cardio avec historique
  const rmDataHistory = useMemo(() => {
    const history = getHistory('rm');
    if (history.length === 0) return null;
    return { ...history[0], history };
  }, [getHistory]);

  const cardioDataHistory = useMemo(() => {
    const history = getHistory('cardio');
    if (history.length === 0) return null;
    return { ...history[0], history };
  }, [getHistory]);

  const weeklyCalories = summary?.caloriesBurnedWeek || 0;
  const recentSessions = sessions.slice(0, 5);

  // Optimisation: Limiter les sessions pour MuscleHeatmap (30 dernières au lieu de toutes)
  const sessionsForHeatmap = useMemo(() => {
    const limited = sessions.slice(0, 30);
    logger.app.debug('MuscleHeatmap data', {
      totalSessions: sessions.length,
      limitedSessions: limited.length,
      firstSession: limited[0]
    });
    return limited;
  }, [sessions]);

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
      setShowHeavySections(false); // Réinitialiser pour le lazy loading

      // Charger l'objectif local
      const storedGoal = await AsyncStorage.getItem(GOAL_STORAGE_KEY);
      if (storedGoal) {
        const goalValue = parseInt(storedGoal, 10);
        setWeeklyGoal(goalValue);
        setTempGoal(goalValue);
      }

      // Charger les données des calculateurs
      const storedCalculatorData = await AsyncStorage.getItem(CALCULATOR_STORAGE_KEY);
      if (storedCalculatorData) {
        setCalculatorData(JSON.parse(storedCalculatorData));
      }

      // Charger les séances locales
      const localHistory = await AsyncStorage.getItem('@workout_history');
      const localSessions = localHistory ? JSON.parse(localHistory) : [];

      // Appels API en parallèle
      // Optimisation: Limiter les sessions à 50 au lieu de toutes
      // Récupérer les vraies WorkoutSession pour avoir les infos de muscles
      const [summaryResponse, workoutSessionsResponse, programHistoryResponse, subscriptionResponse, notificationsResponse] = await Promise.all([
        apiClient.get(endpoints.history.summary).catch((e) => {
          logger.app.warn('Summary error', e);
          return { data: null };
        }),
        apiClient.get(`${endpoints.workouts.sessions}?limit=50`).catch(() => ({ data: [] })),
        apiClient.get(`${endpoints.programs.history}?limit=50`).catch(() => ({ data: { sessions: [] } })),
        apiClient.get(endpoints.subscription.status).catch(() => ({ data: { tier: 'free' } })),
        apiClient.get(endpoints.notifications.list).catch(() => ({ data: { unreadCount: 0 } })),
      ]);

      // Mettre à jour le compteur de notifications non lues
      setUnreadNotifications(notificationsResponse.data?.unreadCount || 0);

      // Summary (stats précalculées) - compléter avec les séances locales et programmes
      const apiSummary = summaryResponse.data || {};

      // Compter SEULEMENT les séances locales non synchronisées
      const unsyncedLocalSessions = localSessions.filter(s => !s.backendId && s.synced !== true);
      const localSessionsCount = unsyncedLocalSessions.length;

      // L'API retourne { sessions: [...] } ou directement un tableau
      const programHistoryData = programHistoryResponse.data?.sessions || programHistoryResponse.data || [];
      const programSessionsArray = Array.isArray(programHistoryData) ? programHistoryData : [];
      const programSessionsCount = programSessionsArray.length;

      // Calculer les séances des 7 derniers jours (SEULEMENT non synchronisées + programmes)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const localLast7Days = unsyncedLocalSessions.filter(s => new Date(s.startTime) >= sevenDaysAgo).length;
      const programLast7Days = programSessionsArray.filter(s =>
        new Date(s.completedAt || s.createdAt) >= sevenDaysAgo
      ).length;

      setSummary({
        ...apiSummary,
        totalSessions: (apiSummary.totalSessions || 0) + localSessionsCount + programSessionsCount,
        workoutsCount7d: (apiSummary.workoutsCount7d || 0) + localLast7Days + programLast7Days,
      });

      // Sessions pour la liste récente - combiner API + local + programmes
      // Utiliser les vraies WorkoutSession au lieu de l'historique
      // pour avoir les infos complètes de muscles (muscleGroup, muscles, etc.)
      // Format: { items: [...], points, nextCursor }
      const workoutSessionsData = workoutSessionsResponse.data?.items || [];

      // 🔍 DEBUG: Voir les sessions reçues
      console.log('📊 [DEBUG] WorkoutSessions data:', {
        total: workoutSessionsData.length,
        sample: workoutSessionsData.slice(0, 3).map(s => ({
          name: s.name,
          hasEntries: !!s.entries?.length,
          firstEntry: s.entries?.[0] ? {
            name: s.entries[0].exerciseName,
            muscleGroup: s.entries[0].muscleGroup,
            muscle: s.entries[0].muscle,
            muscles: s.entries[0].muscles
          } : null
        }))
      });

      const apiSessions = Array.isArray(workoutSessionsData)
        ? workoutSessionsData.filter(s => s.status === 'finished')
          .map(s => ({
            id: s._id,
            name: s.name || 'Séance',
            date: s.endedAt || s.createdAt,
            endedAt: s.endedAt || s.createdAt,
            durationMinutes: Math.round((s.durationSec || 0) / 60),
            caloriesBurned: s.calories || 0,
            entries: (s.entries || []).map(e => ({
              name: e.exerciseName || e.name,
              muscle: e.muscle,
              muscleGroup: e.muscleGroup,
              primaryMuscle: e.primaryMuscle,
              secondaryMuscles: e.secondaryMuscles,
              muscles: e.muscles,
            })),
            source: 'api',
          }))
        : [];

      // Sessions de programme (utiliser programSessionsArray déjà extrait)
      const programSessions = programSessionsArray.map(s => ({
        id: s._id,
        name: s.programName || s.program?.name || 'Programme',
        date: s.completedAt || s.createdAt,
        endedAt: s.completedAt || s.createdAt,
        durationMinutes: Math.round((s.durationSec || 0) / 60),
        caloriesBurned: s.calories || 0,
        cyclesCompleted: s.cyclesCompleted,
        totalCycles: s.totalCycles,
        entries: (s.entries || s.exercises || []).map(e => ({
          name: e.exerciseName || e.name,
          muscle: e.muscle,
          primaryMuscle: e.primaryMuscle,
          secondaryMuscles: e.secondaryMuscles,
          muscles: e.muscles,
        })),
        source: 'program',
        programId: s.programId || s.program?._id,
      }));

      // Formater les séances locales (exclure celles déjà synchronisées)
      const formattedLocalSessions = localSessions
        .filter(s => !s.backendId && s.synced !== true) // Exclure les séances déjà synchronisées
        .map(s => ({
          id: s.id,
          name: s.exercises?.length > 0
            ? `Séance ${s.exercises.map(e => e.exercice?.name).filter(Boolean).slice(0, 2).join(', ')}`
            : 'Séance',
          date: s.startTime,
          endedAt: s.endTime,
          durationMinutes: s.duration,
          caloriesBurned: 0,
          entries: s.exercises?.map(e => ({
            name: e.exercice?.name,
            muscle: e.exercice?.muscle,
            muscleGroup: e.exercice?.muscleGroup,
            primaryMuscle: e.exercice?.primaryMuscle,
            secondaryMuscles: e.exercice?.secondaryMuscles,
            muscles: e.exercice?.muscles,
            sets: e.sets,
          })) || [],
          source: 'local',
        }));

      // Combiner toutes les sessions
      const combinedSessions = [...formattedLocalSessions, ...apiSessions, ...programSessions];

      // Dédupliquer intelligemment
      const deduplicated = [];
      const seenKeys = new Set();

      for (const session of combinedSessions) {
        // Créer une clé unique basée sur plusieurs critères
        const dateKey = new Date(session.date).getTime();
        const roundedDate = Math.floor(dateKey / 60000) * 60000; // Arrondir à la minute
        const exerciseNames = (session.entries || [])
          .map(e => e.name)
          .filter(Boolean)
          .sort()
          .join('|');
        const uniqueKey = `${roundedDate}_${exerciseNames}_${session.durationMinutes || 0}`;

        // Vérifier si c'est un doublon
        if (seenKeys.has(uniqueKey)) {
          // Doublon détecté, on garde seulement si c'est de l'API (source de vérité)
          if (session.source === 'api') {
            // Remplacer le doublon local par la version API
            const existingIndex = deduplicated.findIndex(s => {
              const existingDate = Math.floor(new Date(s.date).getTime() / 60000) * 60000;
              const existingExercises = (s.entries || [])
                .map(e => e.name)
                .filter(Boolean)
                .sort()
                .join('|');
              const existingKey = `${existingDate}_${existingExercises}_${s.durationMinutes || 0}`;
              return existingKey === uniqueKey && s.source === 'local';
            });
            if (existingIndex !== -1) {
              deduplicated[existingIndex] = session; // Remplacer par la version API
            }
          }
          // Sinon ignorer le doublon
        } else {
          // Pas de doublon, ajouter
          seenKeys.add(uniqueKey);
          deduplicated.push(session);
        }
      }

      // Trier par date
      const allSessions = deduplicated.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 🔍 DEBUG: Voir combien de sessions de chaque source
      console.log('📊 [DEBUG] Sessions fusion:', {
        local: formattedLocalSessions.length,
        api: apiSessions.length,
        programs: programSessions.length,
        combined: combinedSessions.length,
        deduplicated: allSessions.length,
        recentSample: allSessions.slice(0, 3).map(s => ({
          name: s.name,
          source: s.source,
          date: s.date
        }))
      });

      setSessions(allSessions);

      // Statut abonnement - utiliser les données de l'API comme source de vérité
      const subData = subscriptionResponse.data || {};
      const isPremiumUser = subData.tier === 'premium' ||
                            subData.hasXpPremium;
      setSubscriptionTier(isPremiumUser ? 'premium' : 'free');

      // DEBUG
      console.log('[HOME SCREEN] Subscription Status:', {
        apiTier: subData.tier,
        hasXpPremium: subData.hasXpPremium,
        userRole: user?.role,
        isPremiumUser,
        isFreeUser: !isPremiumUser,
        fullSubData: subData
      });

      logger.app.debug('Loaded data', {
        summary: !!summaryResponse.data,
        totalSessions: (apiSummary.totalSessions || 0) + localSessionsCount,
        localSessions: localSessionsCount,
        tier: subData.tier,
      });

    } catch (error) {
      logger.app.error('Error loading data', error);
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

  // Rafraîchir les données quand l'écran est focus
  useFocusEffect(
    useCallback(() => {
      const refreshOnFocus = async () => {
        try {
          // Rafraîchir les notifications
          const response = await apiClient.get(endpoints.notifications.list);
          setUnreadNotifications(response.data?.unreadCount || 0);

          // Rafraîchir les données des calculateurs (peut avoir été mis à jour)
          const storedCalculatorData = await AsyncStorage.getItem(CALCULATOR_STORAGE_KEY);
          if (storedCalculatorData) {
            setCalculatorData(JSON.parse(storedCalculatorData));
          }
        } catch (error) {
          // Silently fail
        }
      };
      refreshOnFocus();
    }, [])
  );

  // Optimisation: Activer les sections lourdes après le chargement initial
  // Cela permet d'afficher le contenu principal plus rapidement
  useEffect(() => {
    logger.app.debug('Heavy sections useEffect triggered', { loading, showHeavySections });
    if (!loading && !showHeavySections) {
      logger.app.info('Activating heavy sections in 300ms');
      // Différer le rendu des sections lourdes de 300ms
      const timer = setTimeout(() => {
        logger.app.info('Heavy sections NOW ACTIVATED');
        setShowHeavySections(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, showHeavySections]);

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
    setTempGoal(weeklyGoal);
    setShowGoalModal(true);
  }, [weeklyGoal]);

  const handleSaveGoal = useCallback(async () => {
    try {
      await AsyncStorage.setItem(GOAL_STORAGE_KEY, String(tempGoal));
      setWeeklyGoal(tempGoal);
      setShowGoalModal(false);
    } catch (error) {
      logger.app.error('Error saving goal', error);
    }
  }, [tempGoal]);

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

        {/* Upsell Banner - Utilisateurs gratuits */}
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

        {/* Optimisation: Sections lourdes chargées après le contenu principal */}
        {showHeavySections ? (
          <>
            {/* Cardio Stats */}
            <CardioStats sportStats={sportStats} />

            {/* Muscle Heatmap - Optimisé avec seulement 30 sessions */}
            {stats.totalSessions > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                  Répartition musculaire
                </Text>
                <MuscleHeatmap sessions={sessionsForHeatmap} />
              </View>
            )}

            {/* Body Metrics - IMC, calories, 1RM, FC Max */}
            <BodyMetrics
              weightData={weightData}
              calorieTargets={calorieTargets}
              rmData={rmDataHistory}
              cardioData={cardioDataHistory}
            />

            {/* Weekly Summary - Résumé motivant */}
            {stats.totalSessions > 0 && (
              <WeeklySummary
                weeklySessions={stats.last7Days}
                weeklyCalories={weeklyCalories}
                userName={displayName}
              />
            )}
          </>
        ) : (
          // Placeholder pendant le chargement des sections lourdes
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

      {/* Modal Objectif Semaine */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGoalModal(false)}
        >
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              Objectif hebdomadaire
            </Text>
            <Text style={[styles.modalSubtitle, isDark && styles.modalSubtitleDark]}>
              Combien de séances par semaine ?
            </Text>

            <View style={styles.goalOptions}>
              {GOAL_OPTIONS.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.goalOption,
                    tempGoal === num && styles.goalOptionActive,
                    isDark && tempGoal !== num && styles.goalOptionDark,
                  ]}
                  onPress={() => setTempGoal(num)}
                >
                  <Text
                    style={[
                      styles.goalOptionText,
                      tempGoal === num && styles.goalOptionTextActive,
                      isDark && tempGoal !== num && styles.goalOptionTextDark,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.goalHint, isDark && styles.goalHintDark]}>
              {tempGoal <= 2 && 'Parfait pour débuter doucement'}
              {tempGoal === 3 && 'Un bon équilibre repos/effort'}
              {tempGoal === 4 && 'Idéal pour progresser'}
              {tempGoal === 5 && 'Pour les sportifs réguliers'}
              {tempGoal >= 6 && 'Mode intensif activé !'}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={[styles.modalButtonCancelText, isDark && styles.modalButtonCancelTextDark]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveGoal}
              >
                <Text style={styles.modalButtonSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    color: theme.colors.primary,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  modalContentDark: {
    backgroundColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalSubtitleDark: {
    color: '#888888',
  },
  goalOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  goalOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  goalOptionDark: {
    backgroundColor: '#3A3A3A',
  },
  goalOptionText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  goalOptionTextActive: {
    color: '#FFFFFF',
  },
  goalOptionTextDark: {
    color: '#888888',
  },
  goalHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  goalHintDark: {
    color: '#888888',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonCancelDark: {
    backgroundColor: '#3A3A3A',
  },
  modalButtonCancelText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  modalButtonCancelTextDark: {
    color: '#FFFFFF',
  },
  modalButtonSave: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonSaveText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
