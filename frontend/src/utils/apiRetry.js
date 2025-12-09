/**
 * Utilitaires pour la gestion des erreurs API avec retry logic
 */

/**
 * Exécute une requête avec retry automatique en cas d'échec
 * @param {Function} apiCall - Fonction async qui retourne une Promise
 * @param {Object} options - Options de retry
 * @returns {Promise} Résultat de l'appel API
 */
export async function retryApiCall(apiCall, options = {}) {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry = null,
  } = options;

  let lastError;
  let delay = delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;

      // Si c'est la dernière tentative, on lance l'erreur
      if (attempt === maxRetries) {
        break;
      }

      // Callback pour notifier de la tentative
      if (onRetry) {
        onRetry(attempt + 1, maxRetries, error);
      }

      // Attendre avant de réessayer (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Sauvegarde les données en localStorage en cas d'échec API
 * @param {string} key - Clé de stockage
 * @param {*} data - Données à sauvegarder
 */
export function saveToLocalStorage(key, data) {
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({
      ...data,
      timestamp: new Date().toISOString(),
      synced: false,
    });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale:', error);
  }
}

/**
 * Récupère les données non synchronisées du localStorage
 * @param {string} key - Clé de stockage
 * @returns {Array} Données non synchronisées
 */
export function getUnsyncedData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return data.filter((item) => !item.synced);
  } catch (error) {
    console.error('Erreur lors de la récupération locale:', error);
    return [];
  }
}

/**
 * Marque les données comme synchronisées
 * @param {string} key - Clé de stockage
 * @param {Array} timestamps - Timestamps des items à marquer
 */
export function markAsSynced(key, timestamps) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = data.map((item) => {
      if (timestamps.includes(item.timestamp)) {
        return { ...item, synced: true };
      }
      return item;
    });
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Erreur lors de la mise à jour locale:', error);
  }
}
