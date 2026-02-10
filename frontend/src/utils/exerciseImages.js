/**
 * Utilitaire pour gérer les images des exercices
 */

// Cache des images d'exercices
let exerciseImagesCache = null;

/**
 * Charge toutes les images d'exercices depuis l'API
 * @returns {Promise<Map<string, string>>} Map nom d'exercice -> chemin image
 */
export async function loadExerciseImages() {
  if (exerciseImagesCache) {
    return exerciseImagesCache;
  }

  const imageMap = new Map();

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${apiUrl}/exercises?limit=1000`);

    if (!response.ok) {
      console.error(`[exerciseImages] HTTP ${response.status}`);
      return imageMap;
    }

    const data = await response.json();
    const exercises = data.success && data.data ? data.data : (data.exercises || data.data || []);

    // Construire le map
    exercises.forEach(exercise => {
      if (exercise.name && exercise.mainImage) {
        // Normaliser le nom (minuscules, trim)
        const normalizedName = exercise.name.toLowerCase().trim();
        imageMap.set(normalizedName, exercise.mainImage);
      }
    });

    exerciseImagesCache = imageMap;
    console.log(`📸 ${imageMap.size} images d'exercices chargées depuis l'API`);
  } catch (error) {
    console.error('Erreur lors du chargement des images d\'exercices:', error);
  }

  return imageMap;
}

/**
 * Récupère l'image d'un exercice par son nom
 * @param {string} exerciseName - Nom de l'exercice
 * @returns {string|null} Chemin de l'image ou null
 */
export function getExerciseImage(exerciseName) {
  if (!exerciseName || !exerciseImagesCache) {
    return null;
  }

  const normalizedName = exerciseName.toLowerCase().trim();
  return exerciseImagesCache.get(normalizedName) || null;
}

/**
 * Précharge les images pour une meilleure performance
 */
export async function preloadExerciseImages() {
  await loadExerciseImages();
}
