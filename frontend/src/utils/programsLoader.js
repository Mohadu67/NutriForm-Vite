/**
 * Charger les programmes d'entraînement depuis MongoDB
 * Les programmes sont maintenant stockés uniquement dans MongoDB (migration effectuée)
 * @param {string|string[]} types - Type(s) de programmes à charger ('all' par défaut)
 * @returns {Promise<Array>} Liste des programmes
 */
export async function loadPrograms(types = 'all') {
  try {
    // Charger les programmes MongoDB publics (seule source depuis la migration)
    const mongoPrograms = await loadMongoPrograms(types);
    return mongoPrograms;
  } catch (error) {
    console.error('Erreur lors du chargement des programmes:', error);
    return [];
  }
}

/**
 * Charger les programmes depuis JSON local
 */
async function loadJSONPrograms(types = 'all') {
  const fileMap = {
    all: '/data/programs/programs.json',
  };

  try {
    const res = await fetch(fileMap.all);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const allPrograms = data.programs || [];

    // Si on demande 'all', retourner tous
    if (types === 'all') {
      return allPrograms;
    }

    // Sinon, filtrer par type
    const typeArray = Array.isArray(types) ? types : [types];
    return allPrograms.filter(program => typeArray.includes(program.type));
  } catch {
    return [];
  }
}

/**
 * Charger les programmes depuis MongoDB (API)
 */
async function loadMongoPrograms(types = 'all') {
  try {
    // Utiliser VITE_API_URL pour être compatible dev et prod
    // Supprimer le slash final si présent pour éviter les doubles slashs
    const API_URL = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');

    // Si pas d'URL API configurée, skip les programmes MongoDB
    if (!API_URL) {
      console.warn('[programsLoader] VITE_API_URL non configuré, skip MongoDB');
      return [];
    }

    const queryParams = new URLSearchParams();
    if (types !== 'all') {
      queryParams.append('type', types);
    }

    const url = `${API_URL}/programs/public?${queryParams.toString()}`;

    const res = await fetch(url, {
      credentials: 'include', // Important pour les cookies en production cross-domain
    });

    if (!res.ok) {
      console.error('[programsLoader] HTTP error:', res.status, res.statusText);
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const programs = data.programs || [];

    // Normaliser les programmes MongoDB pour avoir un champ 'id' comme les programmes JSON
    return programs.map(program => ({
      ...program,
      id: program._id || program.id, // Utiliser _id si disponible, sinon id
    }));
  } catch (error) {
    console.error('[programsLoader] Erreur chargement programmes MongoDB:', error);
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
    // Utiliser VITE_API_URL pour être compatible dev et prod
    const API_URL = import.meta.env?.VITE_API_URL || '/api';

    const response = await fetch(`${API_URL}/programs/user/my-programs`, {
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
