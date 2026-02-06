/**
 * Utilitaire pour gérer la sauvegarde/restauration des sessions de programme en cours
 */
import { storage } from '../shared/utils/storage.js';

const SESSION_STORAGE_KEY = 'active_program_session';

/**
 * Sauvegarde l'état actuel de la session
 * @param {Object} sessionState - État de la session
 * @param {Object} sessionState.program - Programme en cours
 * @param {number} sessionState.currentCycleIndex - Index du cycle actuel
 * @param {number} sessionState.timeRemaining - Temps restant en secondes
 * @param {number} sessionState.totalElapsedTime - Temps total écoulé
 * @param {boolean} sessionState.isPaused - Si le programme est en pause
 */
export function saveActiveSession(sessionState) {
  try {
    const dataToSave = {
      ...sessionState,
      savedAt: Date.now()
    };
    storage.set(SESSION_STORAGE_KEY, dataToSave);
    console.log('💾 Session sauvegardée');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la session:', error);
  }
}

/**
 * Récupère la session active sauvegardée
 * @returns {Object|null} Session sauvegardée ou null
 */
export function getActiveSession() {
  try {
    const session = storage.get(SESSION_STORAGE_KEY);
    if (!session) return null;

    // Vérifier que la session n'est pas trop ancienne (max 24h)
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 heures
    if (Date.now() - session.savedAt > MAX_AGE) {
      clearActiveSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return null;
  }
}

/**
 * Supprime la session active
 */
export function clearActiveSession() {
  try {
    storage.remove(SESSION_STORAGE_KEY);
    console.log('🗑️ Session supprimée');
  } catch (error) {
    console.error('Erreur lors de la suppression de la session:', error);
  }
}

/**
 * Vérifie si une session active existe
 * @returns {boolean}
 */
export function hasActiveSession() {
  return getActiveSession() !== null;
}

/**
 * Obtient un résumé de la session pour l'affichage
 * @returns {Object|null} Résumé ou null
 */
export function getSessionSummary() {
  const session = getActiveSession();
  if (!session) return null;

  const cycles = session.program?.cycles || [];
  const currentCycle = cycles[session.currentCycleIndex];
  const progress = ((session.currentCycleIndex + 1) / cycles.length) * 100;

  return {
    programName: session.program?.name,
    currentCycleName: currentCycle?.exerciseName || currentCycle?.type,
    progress: Math.round(progress),
    isPaused: session.isPaused
  };
}
