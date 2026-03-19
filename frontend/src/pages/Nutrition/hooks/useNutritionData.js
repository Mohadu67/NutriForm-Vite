import { useState, useEffect, useCallback } from 'react';
import { getDailySummary, getWeeklySummary } from '../../../shared/api/nutrition';

export function useNutritionData(selectedDate, isPremium) {
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const fetchDaily = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDailySummary(selectedDate);
      setDailySummary(data);
    } catch (err) {
      console.error('Erreur fetchDaily:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchWeekly = useCallback(async () => {
    if (!isPremium) return;
    try {
      setWeeklyLoading(true);
      const data = await getWeeklySummary();
      setWeeklySummary(data);
    } catch (err) {
      console.error('Erreur fetchWeekly:', err);
    } finally {
      setWeeklyLoading(false);
    }
  }, [isPremium]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  useEffect(() => {
    fetchWeekly();
  }, [fetchWeekly]);

  const refresh = useCallback(() => {
    fetchDaily();
    if (isPremium) fetchWeekly();
  }, [fetchDaily, fetchWeekly, isPremium]);

  return {
    dailySummary,
    weeklySummary,
    loading,
    weeklyLoading,
    refresh,
  };
}
