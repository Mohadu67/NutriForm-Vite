/**
 * Service API pour les seances d'entrainement (workouts)
 */
import apiClient from './client';
import { endpoints } from './endpoints';

/**
 * Convertir les donnees du WorkoutContext vers le format attendu par le backend
 */
function transformWorkoutToBackendFormat(workout) {
  const entries = (workout.exercises || []).map((ex, index) => {
    const exercice = ex.exercice || {};

    // Determiner le type
    let type = exercice.type || 'muscu';
    if (type === 'poids_du_corps') type = 'poids_du_corps';
    else if (type === 'cardio' || type === 'etirement') type = type;
    else type = 'muscu';

    // Convertir les sets
    const sets = (ex.sets || []).map(set => ({
      reps: set.reps || 0,
      weightKg: set.weight || 0,
      completed: set.completed || false,
    }));

    return {
      exerciseId: exercice.id || exercice.exoId || null,
      exerciseName: exercice.name || 'Exercice',
      type,
      muscleGroup: exercice.muscle || exercice.primaryMuscle || null,
      muscles: exercice.muscles || (exercice.muscle ? [exercice.muscle] : []),
      sets,
      order: index,
    };
  });

  return {
    name: workout.name || 'Seance mobile',
    startedAt: workout.startTime,
    endedAt: workout.endTime,
    durationMinutes: workout.duration || 0,
    entries,
    summary: {
      plannedExercises: entries.length,
      completedExercises: entries.filter(e =>
        e.sets.some(s => s.completed || s.reps > 0)
      ).length,
    },
  };
}

/**
 * Convertir les donnees du backend vers le format du WorkoutContext
 */
function transformBackendToWorkoutFormat(session) {
  const exercises = (session.entries || []).map(entry => ({
    exercice: {
      id: entry.exerciseId || entry._id,
      name: entry.exerciseName,
      type: entry.type,
      muscle: entry.muscleGroup || (entry.muscles && entry.muscles[0]) || null,
      muscles: entry.muscles || [],
    },
    sets: (entry.sets || []).map(set => ({
      reps: set.reps || 0,
      weight: set.weightKg || 0,
      completed: set.completed || (set.reps > 0),
    })),
  }));

  return {
    id: session._id,
    startTime: session.startedAt,
    endTime: session.endedAt,
    duration: session.durationSec ? Math.round(session.durationSec / 60) : 0,
    calories: session.calories || 0,
    exercises,
    name: session.name || '',
    notes: session.notes || '',
    clientSummary: session.clientSummary || null,
  };
}

/**
 * Sauvegarder une seance terminee
 * @param {Object} workout - Seance du WorkoutContext
 */
export async function saveSession(workout) {
  try {
    const payload = transformWorkoutToBackendFormat(workout);
    const response = await apiClient.post(endpoints.workouts.sessions, payload);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.log('[WORKOUTS API] Save session error:', error.message);
    // 403 = pas premium, mais on ne bloque pas l'app
    if (error.response?.status === 403) {
      return { success: false, error: 'premium_required', data: null };
    }
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Recuperer l'historique des seances
 * @param {Object} params - Parametres
 * @param {string} params.date - Date specifique (YYYY-MM-DD)
 * @param {number} params.limit - Limite
 * @param {string} params.cursor - Curseur pour pagination
 */
export async function getSessions(params = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (params.date) queryParams.append('date', params.date);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);

    const url = `${endpoints.workouts.sessions}?${queryParams.toString()}`;
    const response = await apiClient.get(url);

    const items = (response.data?.items || []).map(transformBackendToWorkoutFormat);

    return {
      success: true,
      data: items,
      nextCursor: response.data?.nextCursor || null,
    };
  } catch (error) {
    console.log('[WORKOUTS API] Get sessions error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recuperer une seance par ID
 */
export async function getSessionById(id) {
  try {
    const response = await apiClient.get(endpoints.workouts.sessionById(id));

    return {
      success: true,
      data: transformBackendToWorkoutFormat(response.data),
    };
  } catch (error) {
    console.log('[WORKOUTS API] Get session error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Mettre a jour une seance
 */
export async function updateSession(id, updates) {
  try {
    const response = await apiClient.patch(endpoints.workouts.sessionById(id), updates);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.log('[WORKOUTS API] Update session error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Supprimer une seance
 */
export async function deleteSession(id) {
  try {
    await apiClient.delete(endpoints.workouts.sessionById(id));

    return { success: true };
  } catch (error) {
    console.log('[WORKOUTS API] Delete session error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Recuperer le resume quotidien
 */
export async function getDailySummary(from, to) {
  try {
    const response = await apiClient.get(
      `${endpoints.workouts.dailySummary}?from=${from}&to=${to}`
    );

    return {
      success: true,
      data: response.data?.items || [],
    };
  } catch (error) {
    console.log('[WORKOUTS API] Get daily summary error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recuperer la seance de la semaine derniere (meme jour)
 */
export async function getLastWeekSession() {
  try {
    const response = await apiClient.get(endpoints.workouts.lastWeekSession);

    if (!response.data?.session) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: transformBackendToWorkoutFormat(response.data.session),
    };
  } catch (error) {
    console.log('[WORKOUTS API] Get last week session error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

export default {
  saveSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getDailySummary,
  getLastWeekSession,
};
