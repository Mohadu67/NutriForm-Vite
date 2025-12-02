/**
 * Charger les programmes d'entraînement depuis les fichiers JSON
 * @param {string|string[]} types - Type(s) de programmes à charger ('all' par défaut)
 * @returns {Promise<Array>} Liste des programmes
 */
export async function loadPrograms(types = 'all') {
  const fileMap = {
    all: '/data/programs/programs.json',
  };

  // Si on demande 'all', charger tous les programmes
  if (types === 'all') {
    try {
      const res = await fetch(fileMap.all);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.programs || [];
    } catch {
      return [];
    }
  }

  // Sinon, filtrer par type
  try {
    const res = await fetch(fileMap.all);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const allPrograms = data.programs || [];

    // Convertir en tableau si nécessaire
    const typeArray = Array.isArray(types) ? types : [types];

    // Filtrer par type
    return allPrograms.filter(program => typeArray.includes(program.type));
  } catch {
    return [];
  }
}

/**
 * Charger un programme spécifique par son ID
 * @param {string} programId - ID du programme
 * @returns {Promise<Object|null>} Programme ou null si non trouvé
 */
export async function loadProgramById(programId) {
  try {
    const programs = await loadPrograms('all');
    return programs.find(p => p.id === programId) || null;
  } catch {
    return null;
  }
}

/**
 * Charger les programmes depuis l'API (programmes personnalisés de l'utilisateur)
 * Nécessite authentification Premium
 * @returns {Promise<Array>} Liste des programmes personnalisés
 */
export async function loadUserPrograms() {
  try {
    const response = await fetch('/api/programs/user/my-programs', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.programs || [];
  } catch (error) {
    console.error('Erreur lors du chargement des programmes utilisateur:', error);
    return [];
  }
}

/**
 * Charger tous les programmes (JSON + personnalisés)
 * @returns {Promise<{public: Array, user: Array}>} Programmes publics et personnalisés
 */
export async function loadAllPrograms() {
  try {
    const [publicPrograms, userPrograms] = await Promise.all([
      loadPrograms('all'),
      loadUserPrograms(),
    ]);

    return {
      public: publicPrograms,
      user: userPrograms,
    };
  } catch (error) {
    console.error('Erreur lors du chargement des programmes:', error);
    return {
      public: [],
      user: [],
    };
  }
}
