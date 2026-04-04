import { useState, useEffect, useCallback } from 'react';
import { getCarouselData } from '../../../shared/api/nutrition';

export function useCarousel(selectedDate) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCarouselData(selectedDate);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { carouselData: data, carouselLoading: loading, refreshCarousel: refresh };
}
