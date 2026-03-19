import { useState, useEffect, useCallback } from 'react';
import { getNutritionGoals, updateNutritionGoals } from '../../../shared/api/nutrition';

export function useNutritionGoals() {
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNutritionGoals();
      setGoals(data.goals);
    } catch (err) {
      console.error('Erreur fetchGoals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const saveGoals = useCallback(async (data) => {
    const result = await updateNutritionGoals(data);
    setGoals(result.goals);
    return result;
  }, []);

  return { goals, loading, saveGoals, refreshGoals: fetchGoals };
}
