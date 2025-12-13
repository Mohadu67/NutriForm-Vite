/**
 * Capitalise la première lettre d'une chaîne
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalise chaque mot d'une chaîne (pour les noms composés)
 * @param {string} str
 * @returns {string}
 */
export function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formate un nom d'affichage (pseudo ou prénom) avec capitalisation
 * @param {object} user - Objet utilisateur avec pseudo, prenom, email
 * @param {string} fallback - Valeur par défaut
 * @returns {string}
 */
export function formatDisplayName(user, fallback = 'Utilisateur') {
  if (!user) return fallback;

  const name = user.pseudo || user.prenom || user.email?.split('@')[0];
  if (!name) return fallback;

  return capitalizeWords(name);
}
