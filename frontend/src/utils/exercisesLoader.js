/**
 * Charge les exercices depuis l'API backend
 * Remplace l'ancien système de fichiers JSON statiques
 */
export async function loadExercises(types = 'all') {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Construire l'URL avec filtres
    let url = `${apiUrl}/api/exercises?limit=1000`;

    // Si types spécifiques demandés, filtrer par catégorie
    if (types !== 'all') {
      const typeArray = Array.isArray(types) ? types : [types];
      const categories = typeArray.join(',');
      url += `&category=${categories}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[exercisesLoader] HTTP ${res.status} from ${url}`);
      return [];
    }

    const response = await res.json();

    // Gérer le nouveau format de réponse de l'API
    if (response.success && response.data) {
      return response.data;
    }

    // Fallback pour ancien format
    return response.exercises || response.data || [];
  } catch (error) {
    console.error('[exercisesLoader] Erreur chargement exercices:', error);
    return [];
  }
}


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
