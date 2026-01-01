/**
 * useHealthData - Hook pour acceder aux donnees de sante
 * Utilise HealthKit (iOS) et Health Connect (Android)
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import healthService from '../services/healthService';

export default function useHealthData() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [bodyMetrics, setBodyMetrics] = useState(null);
  const [error, setError] = useState(null);

  // Initialisation
  useEffect(() => {
    initializeHealth();
  }, []);

  const initializeHealth = async () => {
    try {
      setIsLoading(true);
      const initialized = await healthService.initialize();
      setIsAvailable(initialized);

      if (initialized) {
        const permissions = await healthService.checkPermissions();
        setHasPermission(permissions.length > 0);
      }
    } catch (err) {
      console.error('[useHealthData] Init error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Demande les permissions d'acces aux donnees de sante
   */
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);

      if (Platform.OS === 'android') {
        const permissions = await healthService.requestPermissions();
        const hasPerms = permissions.length > 0;
        setHasPermission(hasPerms);

        if (!hasPerms) {
          Alert.alert(
            'Permissions requises',
            'Pour synchroniser vos donnees de sante, veuillez autoriser l\'acces dans les parametres de Health Connect.',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Ouvrir les parametres',
                onPress: () => {
                  // Ouvrir les parametres Health Connect
                  Linking.openSettings();
                },
              },
            ]
          );
        }

        return hasPerms;
      }

      return false;
    } catch (err) {
      console.error('[useHealthData] Permission error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Rafraichit les donnees du jour
   */
  const refreshTodayData = useCallback(async () => {
    if (!hasPermission) return null;

    try {
      setIsLoading(true);
      const data = await healthService.getTodaySummary();
      setTodayData(data);
      return data;
    } catch (err) {
      console.error('[useHealthData] Refresh today error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission]);

  /**
   * Rafraichit les donnees hebdomadaires
   */
  const refreshWeeklyData = useCallback(async () => {
    if (!hasPermission) return null;

    try {
      setIsLoading(true);
      const data = await healthService.getWeeklySummary();
      setWeeklyData(data);
      return data;
    } catch (err) {
      console.error('[useHealthData] Refresh weekly error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission]);

  /**
   * Rafraichit les metriques corporelles
   */
  const refreshBodyMetrics = useCallback(async () => {
    if (!hasPermission) return null;

    try {
      setIsLoading(true);
      const data = await healthService.getBodyMetrics();
      setBodyMetrics(data);
      return data;
    } catch (err) {
      console.error('[useHealthData] Refresh body metrics error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission]);

  /**
   * Rafraichit toutes les donnees
   */
  const refreshAll = useCallback(async () => {
    if (!hasPermission) return;

    await Promise.all([
      refreshTodayData(),
      refreshWeeklyData(),
      refreshBodyMetrics(),
    ]);
  }, [hasPermission, refreshTodayData, refreshWeeklyData, refreshBodyMetrics]);

  /**
   * Recupere les pas pour une periode personnalisee
   */
  const getSteps = useCallback(async (startDate, endDate) => {
    if (!hasPermission) return null;
    return healthService.getSteps(startDate, endDate);
  }, [hasPermission]);

  /**
   * Recupere les calories pour une periode personnalisee
   */
  const getCalories = useCallback(async (startDate, endDate) => {
    if (!hasPermission) return null;
    return healthService.getCaloriesBurned(startDate, endDate);
  }, [hasPermission]);

  /**
   * Recupere la frequence cardiaque pour une periode personnalisee
   */
  const getHeartRate = useCallback(async (startDate, endDate) => {
    if (!hasPermission) return null;
    return healthService.getHeartRate(startDate, endDate);
  }, [hasPermission]);

  return {
    // Etat
    isAvailable,
    isLoading,
    hasPermission,
    error,

    // Donnees
    todayData,
    weeklyData,
    bodyMetrics,

    // Actions
    requestPermission,
    refreshTodayData,
    refreshWeeklyData,
    refreshBodyMetrics,
    refreshAll,

    // Methodes personnalisees
    getSteps,
    getCalories,
    getHeartRate,
  };
}
