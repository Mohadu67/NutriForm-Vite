/**
 * Utilitaire pour gérer les images des exercices
 */

// Cache des images d'exercices
let exerciseImagesCache = null;

/**
 * Charge toutes les images d'exercices depuis les fichiers JSON
 * @returns {Promise<Map<string, string>>} Map nom d'exercice -> chemin image
 */
export async function loadExerciseImages() {
  if (exerciseImagesCache) {
    return exerciseImagesCache;
  }

  const imageMap = new Map();

  try {
    // Charger tous les fichiers d'exercices
    const exerciseFiles = [
      '/data/exo/cardio.json',
      '/data/exo/hiit.json',
      '/data/exo/muscu.json',
      '/data/exo/yoga.json',
      '/data/exo/etirement.json',
      '/data/exo/natation.json',
      '/data/exo/meditation.json'
    ];

    const responses = await Promise.all(
      exerciseFiles.map(file =>
        fetch(file)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      )
    );

    // Construire le map
    responses.forEach(data => {
      if (data?.exercises) {
        data.exercises.forEach(exercise => {
          if (exercise.name && exercise.images?.[0]) {
            // Normaliser le nom (minuscules, trim)
            const normalizedName = exercise.name.toLowerCase().trim();
            imageMap.set(normalizedName, exercise.images[0]);
          }
        });
      }
    });

    exerciseImagesCache = imageMap;
    console.log(`📸 ${imageMap.size} images d'exercices chargées`);
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
