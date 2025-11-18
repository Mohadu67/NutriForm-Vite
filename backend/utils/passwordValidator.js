/**
 * Valide la force d'un mot de passe
 * Exigences:
 * - Au moins 12 caractères
 * - Au moins une minuscule
 * - Au moins une majuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial (@$!%*?&)
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

  if (password.length < 12) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins 12 caractères.'
    };
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  if (!hasLowercase) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une lettre minuscule.'
    };
  }

  if (!hasUppercase) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins une lettre majuscule.'
    };
  }

  if (!hasNumber) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un chiffre.'
    };
  }

  if (!hasSpecialChar) {
    return {
      valid: false,
      message: 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&).'
    };
  }

  return {
    valid: true,
    message: 'Mot de passe valide.'
  };
}

module.exports = { validatePassword };
