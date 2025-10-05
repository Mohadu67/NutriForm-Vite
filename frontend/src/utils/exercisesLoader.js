/**
 * Charge les exercices depuis les fichiers JSON séparés par type
 * @param {string|string[]} types - Type(s) d'exercice à charger (muscu, cardio, yoga, meditation, natation, etirement, hiit)
 * @returns {Promise<Array>} Liste des exercices
 */
export async function loadExercises(types = 'all') {
  const fileMap = {
    muscu: '/data/exo/muscu.json',
    cardio: '/data/exo/cardio.json',
    yoga: '/data/exo/yoga.json',
    meditation: '/data/exo/meditation.json',
    natation: '/data/exo/natation.json',
    etirement: '/data/exo/etirement.json',
    hiit: '/data/exo/hiit.json',
  };

  // Si 'all', charger tous les types
  if (types === 'all') {
    types = Object.keys(fileMap);
  }

  // Convertir en tableau si c'est une string unique
  const typeArray = Array.isArray(types) ? types : [types];

  // Charger tous les fichiers en parallèle
  const promises = typeArray.map(async (type) => {
    const url = fileMap[type];
    if (!url) {
      console.warn(`Type d'exercice inconnu: ${type}`);
      return [];
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.exercises || [];
    } catch (error) {
      console.error(`Erreur lors du chargement de ${url}:`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);

  // Fusionner tous les résultats
  return results.flat();
}

/**
 * Charge un fichier de données spécifique (pour IMC, articles, etc.)
 * @param {string} dataKey - Clé des données à charger (contenuIMC, contenueArticlesIMC, etc.)
 * @returns {Promise<any>} Les données demandées
 */
export async function loadData(dataKey) {
  try {
    const res = await fetch('/data/db.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[dataKey] || null;
  } catch (error) {
    console.error(`Erreur lors du chargement de ${dataKey}:`, error);
    return null;
  }
}
