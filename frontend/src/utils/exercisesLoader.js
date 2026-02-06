import client from '../shared/api/client';

/**
 * Load exercises from API backend
 * @param {string|string[]} types - Exercise types to load ('all' or specific types)
 * @returns {Promise<Array>} Array of exercises
 */
export async function loadExercises(types = 'all') {
  try {
    // If types is 'all', don't filter by category
    if (types === 'all') {
      const response = await client.get('/exercises', {
        params: { limit: 1000 }
      });
      return response.data.data || [];
    }

    // Handle specific types/categories
    const typeArray = Array.isArray(types) ? types : [types];

    const promises = typeArray.map(async (type) => {
      try {
        const response = await client.get('/exercises', {
          params: { category: type, limit: 500 }
        });
        return response.data.data || [];
      } catch (error) {
        console.error(`Failed to load exercises for category ${type}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error('Failed to load exercises:', error);
    return [];
  }
}

/**
 * Load generic data from db.json (fallback for other data)
 */
export async function loadData(dataKey) {
  try {
    const res = await fetch('/data/db.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[dataKey] || null;
  } catch {
    return null;
  }
}
