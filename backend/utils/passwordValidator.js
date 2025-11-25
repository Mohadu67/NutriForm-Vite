/**
 * Valide la force d'un mot de passe
 * Exigences:
 * - Au moins 8 caractères
 *
 * @param {string} password - Le mot de passe à valider
 * @returns {{ valid: boolean, message: string }}
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Le mot de passe est requis.'
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins 8 caractères.'
    };
  }

  return {
    valid: true,
    message: 'Mot de passe valide.'
  };
}

module.exports = { validatePassword };
