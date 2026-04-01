/**
 * Limites freemium centralisees
 * Free = limites, Premium = illimite
 */

const FREEMIUM_LIMITS = {
  WORKOUT_SESSIONS_PER_WEEK: 3,
  FOOD_LOGS_PER_DAY: 5,
  RECIPES_MAX_TOTAL: 3,
  PROGRAMS_MAX_TOTAL: 2,
  AI_CHAT_MESSAGES_PER_DAY: 10
};

/**
 * Verifie si l'utilisateur est premium (simple check sur le champ synce)
 */
function isUserPremium(user) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'coach') return true;
  return user.subscriptionTier === 'premium';
}

/**
 * Reponse standardisee pour limite freemium atteinte
 */
function freemiumLimitResponse(res, { limit, current, message, feature }) {
  return res.status(403).json({
    error: 'free_limit_reached',
    message,
    feature,
    limit,
    current,
    upgradeUrl: '/pricing'
  });
}

module.exports = {
  FREEMIUM_LIMITS,
  isUserPremium,
  freemiumLimitResponse
};
