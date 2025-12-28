/**
 * EXEMPLES D'UTILISATION DU LOGGER
 *
 * Ce fichier montre comment utiliser le logger centralisé
 * pour remplacer les console.log/error dispersés dans le code.
 */

import logger, { createLogger } from './logger';

// ========================================
// EXEMPLE 1: Utiliser les loggers pré-configurés
// ========================================

// AVANT (avec console.log)
// console.log('[AUTH] User logged in:', user);

// APRÈS (avec logger)
logger.auth.info('User logged in', { userId: user.id, email: user.email });

// ========================================
// EXEMPLE 2: Différents niveaux de log
// ========================================

// Debug (développement uniquement)
logger.api.debug('Request sent', { url: '/api/users', method: 'GET' });

// Info (événements importants)
logger.workout.info('Workout session started', { workoutId: '123' });

// Warning (situations non critiques)
logger.matching.warn('No matches found for user', { userId: '456' });

// Error (erreurs critiques)
try {
  // Code qui peut échouer
} catch (error) {
  logger.api.error('Failed to fetch data', error);
}

// ========================================
// EXEMPLE 3: Créer un logger personnalisé
// ========================================

// Pour un composant spécifique
const screenLogger = createLogger('MatchingScreen');
screenLogger.info('Screen mounted');
screenLogger.debug('Rendering card', { index: 0 });

// ========================================
// EXEMPLE 4: Logger enfant (sous-catégorie)
// ========================================

const apiLogger = logger.api;
const exercisesApiLogger = apiLogger.child('exercises');

exercisesApiLogger.info('Fetching exercises');
// Affichera: [INFO] [API:exercises] Fetching exercises

// ========================================
// EXEMPLE 5: Remplacer les logs existants
// ========================================

// AVANT
/*
console.log('[MATCHING] Loaded', matches.length, 'suggestions');
console.log('[MATCHING] Filter check -', user.username, ': hasLiked=', hasLiked);
console.error('[MATCHING] Error:', error.message);
*/

// APRÈS
logger.matching.info('Loaded suggestions', { count: matches.length });
logger.matching.debug('Filter check', { username: user.username, hasLiked });
logger.matching.error('Failed to load matches', error);

// ========================================
// EXEMPLE 6: Logger dans les hooks
// ========================================

function useSwipeGesture() {
  const hookLogger = createLogger('useSwipeGesture');

  const swipeRight = () => {
    hookLogger.debug('Swipe right detected');
    // ...
  };

  const swipeLeft = () => {
    hookLogger.debug('Swipe left detected');
    // ...
  };

  return { swipeRight, swipeLeft };
}

// ========================================
// EXEMPLE 7: Logger dans les contextes
// ========================================

function AuthContext() {
  const login = async (email, password) => {
    logger.auth.info('Login attempt', { email });

    try {
      const result = await apiClient.post('/auth/login', { email, password });
      logger.auth.info('Login successful', { userId: result.data.user.id });
      return result;
    } catch (error) {
      logger.auth.error('Login failed', error);
      throw error;
    }
  };

  return { login };
}

// ========================================
// CONFIGURATION (dans App.js ou index.js)
// ========================================

import { configureLogger } from './services/logger';

// Désactiver complètement les logs en production
if (!__DEV__) {
  configureLogger({
    enabled: false,
  });
}

// Ou changer le niveau minimum en production
if (!__DEV__) {
  configureLogger({
    minLevel: 'ERROR', // Ne logger que les erreurs
  });
}
