/**
 * StorageService - Classe utilitaire pour la gestion du stockage local/session
 * Remplace les appels directs à localStorage/sessionStorage
 */

class StorageService {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  /**
   * Enregistre une valeur dans le storage
   * @param {string} key - Clé de stockage
   * @param {*} value - Valeur à stocker (sera sérialisée en JSON)
   * @returns {boolean} - true si succès, false sinon
   */
  set(key, value) {
    try {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupère une valeur du storage
   * @param {string} key - Clé de stockage
   * @param {*} defaultValue - Valeur par défaut si non trouvée
   * @returns {*} - Valeur désérialisée ou defaultValue
   */
  get(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Supprime une clé du storage
   * @param {string} key - Clé à supprimer
   */
  remove(key) {
    this.storage.removeItem(key);
  }

  /**
   * Vide complètement le storage
   */
  clear() {
    this.storage.clear();
  }

  /**
   * Vérifie si une clé existe dans le storage
   * @param {string} key - Clé à vérifier
   * @returns {boolean}
   */
  has(key) {
    return this.storage.getItem(key) !== null;
  }
}

// Instances par défaut pour localStorage et sessionStorage
export const storage = new StorageService(localStorage);
export const sessionStorage = new StorageService(window.sessionStorage);

// Export de la classe pour créer des instances personnalisées si nécessaire
export default StorageService;
