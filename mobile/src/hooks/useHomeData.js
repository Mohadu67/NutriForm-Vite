import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import { endpoints } from '../api/endpoints';
import logger from '../services/logger';

const GOAL_STORAGE_KEY = '@weekly_goal';
const CALCULATOR_STORAGE_KEY = '@calculator_data';

/**
 * Transforme les entrées brutes de GET /history en calculatorData
 * compatible avec le format attendu par useHomeData (imc/calories/rm/cardio)
 */
function buildCalculatorDataFromHistory(historyItems) {
  const result = { imc: { history: [] }, calories: { history: [] }, rm: { history: [] }, cardio: { history: [] } };

  if (!Array.isArray(historyItems)) return result;

  historyItems.forEach((r) => {
    const m = r?.meta || {};
    const date = r?.createdAt || m?.date || new Date().toISOString();

    if (r?.action === 'IMC_CALC' || m?.type === 'imc') {
      if (m?.imc != null) {
        result.imc.history.push({
          imc: m.imc,
          poids: m.poids,
          taille: m.taille,
          categorie: m.categorie,
          poidsIdealMin: m.poidsIdealMin,
          poidsIdealMax: m.poidsIdealMax,
          date,
        });
      }
    } else if (r?.action === 'CALORIE_CALC' || r?.action === 'CALORIES_CALC' || m?.type === 'calories') {
      const calories = m?.calories ?? m?.caloriesDaily ?? m?.dailyCalories ?? m?.calorie;
      if (calories != null) {
        result.calories.history.push({
          maintenance: m.maintenance,
          objectif: m.objectif,
          calories,
          macros: m.macros,
          tmb: m.tmb,
          date,
        });
      }
    } else if (r?.action === 'RM_CALC' || m?.type === 'rm') {
      if (m?.rm != null) {
        result.rm.history.push({
          rm: m.rm,
          exercice: m.exercice,
          poidsSouleve: m.poidsSouleve ?? m.poids,
          reps: m.reps,
          percentages: m.percentages,
          date,
        });
      }
    } else if (r?.action === 'FC_MAX_CALC' || m?.type === 'cardio') {
      if (m?.fcMax != null) {
        result.cardio.history.push({
          fcMax: m.fcMax,
          fcMaxTanaka: m.fcMaxTanaka,
          age: m.age,
          zones: m.zones,
          date,
        });
      }
    }
  });

  // Tri du plus récent au plus ancien
  ['imc', 'calories', 'rm', 'cardio'].forEach((type) => {
    result[type].history.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  return result;
}

/**
 * Hook centralisant toute la logique de données du HomeScreen.
 * Gère le chargement API, la fusion des sessions, les calculs dérivés.
 */
export function useHomeData() {
  const { user } = useAuth();

  // États de chargement
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHeavySections, setShowHeavySections] = useState(false);

  // Données
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [calculatorData, setCalculatorData] = useState(null);

  // --- Helpers ---

  const getHistory = useCallback((type) => {
    if (!calculatorData?.[type]) return [];
    if (calculatorData[type].history) return calculatorData[type].history;
    return [calculatorData[type]];
  }, [calculatorData]);

  // --- Valeurs calculées ---

  const stats = useMemo(() => ({
    totalSessions: summary?.totalSessions || 0,
    last7Days: summary?.workoutsCount7d || 0,
    streak: summary?.streakDays || 0,
    totalHours: Math.floor((summary?.avgWorkoutDurationMin || 0) * (summary?.totalSessions || 0) / 60),
    totalMinutes: (summary?.avgWorkoutDurationMin || 0) * (summary?.totalSessions || 0),
    sessionsTrend: 'same',
  }), [summary]);

  const weightData = useMemo(() => {
    const history = getHistory('imc');
    if (history.length > 0) {
      const latest = history[0];
      return {
        bmi: latest.imc?.toFixed(1) || latest.imc,
        interpretation: latest.categorie,
        weight: latest.poids,
        history,
      };
    }
    if (!summary?.imc) return null;
    const imc = summary.imc;
    let interpretation = null;
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
        maintenance,
        deficit: Math.max(maintenance - 500, 1200),
        surplus: maintenance + 500,
        objectif: objectifLabels[data.objectif] || 'Maintien',
        objectifCalories: data.calories,
        macros: data.macros,
        fromCalculator: true,
        history,
      };
    }
    if (!summary?.calories) return null;
    return {
      maintenance: Math.round(summary.calories),
      deficit: Math.max(Math.round(summary.calories) - 500, 0),
      surplus: Math.round(summary.calories) + 500,
      history: [],
    };
  }, [summary, getHistory]);

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

  const weeklyDuration = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return sessions
      .filter(s => new Date(s.date) >= sevenDaysAgo)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  }, [sessions]);

  const weeklyTrainingDays = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const days = new Set();
    sessions.forEach(s => {
      const d = new Date(s.date);
      if (d >= sevenDaysAgo) days.add(d.toISOString().slice(0, 10));
    });
    return days.size;
  }, [sessions]);

  const recentSessions = useMemo(() => sessions.slice(0, 5), [sessions]);

  const sessionsForHeatmap = useMemo(() => sessions.slice(0, 30), [sessions]);

  const weeklyProgress = useMemo(() => {
    if (weeklyGoal === 0) return 0;
    return Math.min(100, Math.round((stats.last7Days / weeklyGoal) * 100));
  }, [stats.last7Days, weeklyGoal]);

  const displayName = useMemo(() => {
    const name = user?.prenom || user?.pseudo || user?.displayName || 'Utilisateur';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [user]);

  const subtitle = useMemo(() => {
    if (stats.streak >= 7) return 'Tu es en feu ! Continue comme ça';
    if (stats.streak >= 3) return 'Belle série en cours';
    if (stats.totalSessions > 0) return 'Voici ton résumé';
    return 'Prêt à commencer ?';
  }, [stats.streak, stats.totalSessions]);

  const isFreeUser = subscriptionTier === 'free';

  // --- Formatters ---

  const extractSessionCalories = useCallback((session) => {
    return session?.caloriesBurned || session?.calories || 0;
  }, []);

  const formatDate = useCallback((raw) => {
    if (!raw) return '';
    const date = new Date(raw);
    if (isNaN(date)) return '';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }, []);

  // --- Fusion & déduplication des sessions ---

  const mergeSessions = useCallback((localSessions, workoutSessionsData, programSessionsArray) => {
    const apiSessions = Array.isArray(workoutSessionsData)
      ? workoutSessionsData
          .filter(s => s.status === 'finished')
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

    const formattedLocalSessions = localSessions
      .filter(s => !s.backendId && s.synced !== true)
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

    // Déduplication
    const combined = [...formattedLocalSessions, ...apiSessions, ...programSessions];
    const deduplicated = [];
    const seenKeys = new Set();

    for (const session of combined) {
      const dateKey = new Date(session.date).getTime();
      const roundedDate = Math.floor(dateKey / 60000) * 60000;
      const exerciseNames = (session.entries || [])
        .map(e => e.name)
        .filter(Boolean)
        .sort()
        .join('|');
      const uniqueKey = `${roundedDate}_${exerciseNames}_${session.durationMinutes || 0}`;

      if (seenKeys.has(uniqueKey)) {
        if (session.source === 'api') {
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
            deduplicated[existingIndex] = session;
          }
        }
      } else {
        seenKeys.add(uniqueKey);
        deduplicated.push(session);
      }
    }

    return deduplicated.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, []);

  // --- Chargement des données ---

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setShowHeavySections(false);

      // Cache local (affichage immédiat pendant que l'API charge)
      const [storedGoal, storedCalculatorData, localHistory] = await Promise.all([
        AsyncStorage.getItem(GOAL_STORAGE_KEY),
        AsyncStorage.getItem(CALCULATOR_STORAGE_KEY),
        AsyncStorage.getItem('@workout_history'),
      ]);

      if (storedGoal) {
        const goalValue = parseInt(storedGoal, 10);
        setWeeklyGoal(goalValue);
      }
      // Affichage immédiat depuis le cache local en attendant l'API
      if (storedCalculatorData) {
        setCalculatorData(JSON.parse(storedCalculatorData));
      }

      const localSessions = localHistory ? JSON.parse(localHistory) : [];

      // Appels API en parallèle — history.list pour synchroniser calculatorData
      const [summaryRes, historyRes, workoutSessionsRes, programHistoryRes, subscriptionRes, notificationsRes] = await Promise.all([
        apiClient.get(endpoints.history.summary).catch(e => {
          logger.app.warn('Summary error', e);
          return { data: null };
        }),
        apiClient.get(endpoints.history.list).catch(() => ({ data: [] })),
        apiClient.get(`${endpoints.workouts.sessions}?limit=50`).catch(() => ({ data: [] })),
        apiClient.get(`${endpoints.programs.history}?limit=50`).catch(() => ({ data: { sessions: [] } })),
        apiClient.get(endpoints.subscription.status).catch(() => ({ data: { tier: 'free' } })),
        apiClient.get(endpoints.notifications.list).catch(() => ({ data: { unreadCount: 0 } })),
      ]);

      // Reconstruire calculatorData depuis la DB et mettre le cache à jour
      const historyItems = Array.isArray(historyRes.data)
        ? historyRes.data
        : Array.isArray(historyRes.data?.history)
        ? historyRes.data.history
        : [];
      const freshCalcData = buildCalculatorDataFromHistory(historyItems);
      setCalculatorData(freshCalcData);
      AsyncStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(freshCalcData)).catch(() => {});

      setUnreadNotifications(notificationsRes.data?.unreadCount || 0);

      // Summary enrichi avec sessions locales + programmes
      const apiSummary = summaryRes.data || {};
      const unsyncedLocalSessions = localSessions.filter(s => !s.backendId && s.synced !== true);
      const programHistoryData = programHistoryRes.data?.sessions || programHistoryRes.data || [];
      const programSessionsArray = Array.isArray(programHistoryData) ? programHistoryData : [];

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const localLast7Days = unsyncedLocalSessions.filter(s => new Date(s.startTime) >= sevenDaysAgo).length;
      const programLast7Days = programSessionsArray.filter(s =>
        new Date(s.completedAt || s.createdAt) >= sevenDaysAgo
      ).length;

      setSummary({
        ...apiSummary,
        totalSessions: (apiSummary.totalSessions || 0) + unsyncedLocalSessions.length + programSessionsArray.length,
        workoutsCount7d: (apiSummary.workoutsCount7d || 0) + localLast7Days + programLast7Days,
      });

      // Fusion des sessions
      const workoutSessionsData = workoutSessionsRes.data?.items || [];
      const allSessions = mergeSessions(localSessions, workoutSessionsData, programSessionsArray);
      setSessions(allSessions);

      // Abonnement
      const subData = subscriptionRes.data || {};
      const isPremium = subData.tier === 'premium' || subData.hasXpPremium;
      setSubscriptionTier(isPremium ? 'premium' : 'free');

      logger.app.debug('Home data loaded', {
        summary: !!summaryRes.data,
        totalSessions: allSessions.length,
        tier: subData.tier,
      });
    } catch (error) {
      logger.app.error('Error loading home data', error);
    } finally {
      setLoading(false);
    }
  }, [mergeSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // --- Effects ---

  useEffect(() => { loadData(); }, [loadData]);

  // Rafraîchir notifications + calculateurs au focus (depuis l'API, pas le cache local)
  useFocusEffect(
    useCallback(() => {
      const refreshOnFocus = async () => {
        try {
          const [notifResponse, historyResponse] = await Promise.all([
            apiClient.get(endpoints.notifications.list),
            apiClient.get(endpoints.history.list).catch(() => ({ data: [] })),
          ]);
          setUnreadNotifications(notifResponse.data?.unreadCount || 0);

          const items = Array.isArray(historyResponse.data)
            ? historyResponse.data
            : Array.isArray(historyResponse.data?.history)
            ? historyResponse.data.history
            : [];
          if (items.length > 0) {
            const fresh = buildCalculatorDataFromHistory(items);
            setCalculatorData(fresh);
            AsyncStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(fresh)).catch(() => {});
          }
        } catch {
          // Non-critique, on ignore silencieusement
        }
      };
      refreshOnFocus();
    }, [])
  );

  // Lazy loading des sections lourdes
  useEffect(() => {
    if (!loading && !showHeavySections) {
      const timer = setTimeout(() => setShowHeavySections(true), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, showHeavySections]);

  // --- Actions sur les sessions ---

  const deleteSession = useCallback((sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const saveSessionName = useCallback((sessionId, newName) => {
    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, name: newName } : s))
    );
  }, []);

  // --- Objectif hebdomadaire ---

  const saveWeeklyGoal = useCallback(async (newGoal) => {
    try {
      await AsyncStorage.setItem(GOAL_STORAGE_KEY, String(newGoal));
      setWeeklyGoal(newGoal);
    } catch (error) {
      logger.app.error('Error saving goal', error);
    }
  }, []);

  return {
    // État
    loading,
    refreshing,
    showHeavySections,
    isFreeUser,
    subscriptionTier,
    unreadNotifications,

    // Données
    stats,
    sessions,
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

    // UI
    displayName,
    subtitle,

    // Actions
    onRefresh,
    deleteSession,
    saveSessionName,
    saveWeeklyGoal,

    // Formatters
    formatDate,
    extractSessionCalories,
  };
}
