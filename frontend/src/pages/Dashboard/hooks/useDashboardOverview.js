import { useState, useEffect, useCallback } from 'react';
import client from '../../../shared/api/client';
import endpoints from '../../../shared/api/endpoints';

/**
 * Fetches consolidated dashboard data from backend.
 * All business logic (stats, streaks, badges, nutrition, body) is server-side.
 */
export function useDashboardOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get(endpoints.dashboard.overview);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { overview: data, overviewLoading: loading, refreshOverview: refresh };
}
