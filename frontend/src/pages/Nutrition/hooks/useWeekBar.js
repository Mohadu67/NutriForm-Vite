import { useState, useEffect, useCallback } from 'react';
import { getWeekBarData } from '../../../shared/api/nutrition';

/**
 * Fetches week-bar data from the backend (progress per day, N weeks).
 * Fetches once on mount using today's date, then can be refreshed.
 */
export function useWeekBar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const result = await getWeekBarData(today);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { weekBarData: data, weekBarLoading: loading, refreshWeekBar: refresh };
}
