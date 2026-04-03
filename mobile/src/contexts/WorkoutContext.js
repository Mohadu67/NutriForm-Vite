import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSession as saveSessionToBackend, getSessions as getSessionsFromBackend } from '../api/workouts';
import { detectExerciseMode, getInitialDataForMode } from '../utils/exerciseTypeDetector';

const WorkoutContext = createContext();

const WORKOUT_STORAGE_KEY = '@current_workout';

export function WorkoutProvider({ children }) {
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  // Structure d'un workout:
  // {
  //   id: string,
  //   startTime: Date,
  //   exercises: [
  //     {
  //       exercice: {...}, // L'objet exercice complet
  //       mode: 'muscu' | 'pdc' | 'cardio' | 'swim' | 'yoga' | 'stretch' | 'walk_run',
  //       sets: [...],          // pour muscu et pdc
  //       cardioSets: [...],    // pour cardio
  //       swim: {...},          // pour natation
  //       yoga: {...},          // pour yoga/meditation
  //       stretch: {...},       // pour etirement
  //       walkRun: {...},       // pour course/marche
  //     }
  //   ]
  // }

  // Demarrer une nouvelle seance (commence le timer)
  const startWorkout = useCallback(() => {
    setCurrentWorkout(prev => {
      if (!prev) {
        const newWorkout = {
          id: Date.now().toString(),
          startTime: new Date().toISOString(),
          exercises: [],
        };
        setIsWorkoutActive(true);
        saveWorkout(newWorkout);
        return newWorkout;
      }

      if (!prev.startTime) {
        const updated = {
          ...prev,
          startTime: new Date().toISOString(),
        };
        setIsWorkoutActive(true);
        saveWorkout(updated);
        return updated;
      }

      return prev;
    });
  }, []);

  // Ajouter un exercice a la seance (avec detection de mode)
  const addExercise = useCallback((exercice) => {
    setCurrentWorkout(prev => {
      if (!prev) {
        const mode = detectExerciseMode(exercice);
        const initialData = getInitialDataForMode(mode);
        const newWorkout = {
          id: Date.now().toString(),
          startTime: null,
          exercises: [{
            exercice,
            mode,
            ...initialData,
          }],
        };
        saveWorkout(newWorkout);
        return newWorkout;
      }

      const existingIndex = prev.exercises.findIndex(e => e.exercice.id === exercice.id);
      if (existingIndex !== -1) {
        return prev;
      }

      const mode = detectExerciseMode(exercice);
      const initialData = getInitialDataForMode(mode);

      const updated = {
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            exercice,
            mode,
            ...initialData,
          },
        ],
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Supprimer un exercice de la seance
  const removeExercise = useCallback((exerciceId) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.filter(e => e.exercice.id !== exerciceId),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Deplacer un exercice vers le haut
  const moveExerciseUp = useCallback((exerciceId) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const index = prev.exercises.findIndex(e => e.exercice.id === exerciceId);
      if (index <= 0) return prev;

      const exercises = [...prev.exercises];
      [exercises[index - 1], exercises[index]] = [exercises[index], exercises[index - 1]];

      const updated = { ...prev, exercises };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Deplacer un exercice vers le bas
  const moveExerciseDown = useCallback((exerciceId) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const index = prev.exercises.findIndex(e => e.exercice.id === exerciceId);
      if (index < 0 || index >= prev.exercises.length - 1) return prev;

      const exercises = [...prev.exercises];
      [exercises[index], exercises[index + 1]] = [exercises[index + 1], exercises[index]];

      const updated = { ...prev, exercises };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Ajouter une serie a un exercice (muscu/pdc)
  const addSet = useCallback((exerciceId) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId && e.sets) {
            const lastSet = e.sets[e.sets.length - 1];
            const mode = e.mode || 'muscu';
            const newSet = mode === 'pdc'
              ? { reps: lastSet?.reps || 0, completed: false }
              : { reps: lastSet?.reps || 0, weight: lastSet?.weight || 0, completed: false };
            return {
              ...e,
              sets: [...e.sets, newSet],
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Ajouter une serie cardio
  const addCardioSet = useCallback((exerciceId) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId && e.cardioSets) {
            return {
              ...e,
              cardioSets: [...e.cardioSets, { durationMin: '', durationSec: '', intensity: 10 }],
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Supprimer une serie
  const removeSet = useCallback((exerciceId, setIndex) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId && e.sets && e.sets.length > 1) {
            return {
              ...e,
              sets: e.sets.filter((_, i) => i !== setIndex),
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Supprimer une serie cardio
  const removeCardioSet = useCallback((exerciceId, setIndex) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId && e.cardioSets && e.cardioSets.length > 1) {
            return {
              ...e,
              cardioSets: e.cardioSets.filter((_, i) => i !== setIndex),
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Mettre a jour une serie (muscu/pdc)
  const updateSet = useCallback((exerciceId, setIndex, data) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId && e.sets) {
            return {
              ...e,
              sets: e.sets.map((set, i) => {
                if (i === setIndex) {
                  return { ...set, ...data };
                }
                return set;
              }),
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Mettre a jour une serie cardio
  const updateCardioSet = useCallback((exerciceId, setIndex, data) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId && e.cardioSets) {
            return {
              ...e,
              cardioSets: e.cardioSets.map((set, i) => {
                if (i === setIndex) {
                  return { ...set, ...data };
                }
                return set;
              }),
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Mettre a jour les donnees specifiques d'un exercice (swim, yoga, stretch, walkRun)
  const updateExerciseData = useCallback((exerciceId, dataKey, patch) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId) {
            return {
              ...e,
              [dataKey]: { ...(e[dataKey] || {}), ...patch },
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Changer le mode de tracking d'un exercice (ex: pdc -> cardio)
  const changeExerciseMode = useCallback((exerciceId, newMode) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const initialData = getInitialDataForMode(newMode);
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId) {
            // Nettoyer les anciennes donnees et injecter les nouvelles
            const { sets, cardioSets, swim, yoga, stretch, walkRun, ...rest } = e;
            return {
              ...rest,
              mode: newMode,
              ...initialData,
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Marquer une serie comme completee
  const toggleSetComplete = useCallback((exerciceId, setIndex) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId && e.sets) {
            return {
              ...e,
              sets: e.sets.map((set, i) => {
                if (i === setIndex) {
                  return { ...set, completed: !set.completed };
                }
                return set;
              }),
            };
          }
          return e;
        }),
      };
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Terminer la seance
  const finishWorkout = useCallback(async () => {
    if (!currentWorkout) return null;

    const finishedWorkout = {
      ...currentWorkout,
      endTime: new Date().toISOString(),
      duration: Math.round((new Date() - new Date(currentWorkout.startTime)) / 1000 / 60),
    };

    // 1. Sauvegarder sur le backend (synchronisation)
    try {
      const result = await saveSessionToBackend(finishedWorkout);
      if (result.success) {
        console.log('[WORKOUT] Seance synchronisee avec le backend');
        finishedWorkout.backendId = result.data?._id;
      } else {
        console.log('[WORKOUT] Echec sync backend:', result.error);
        finishedWorkout.synced = false;
      }
    } catch (error) {
      console.log('[WORKOUT] Erreur sync backend:', error);
      finishedWorkout.synced = false;
    }

    // 2. Sauvegarder dans l'historique local (backup)
    try {
      const historyKey = '@workout_history';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(finishedWorkout);
      await AsyncStorage.setItem(historyKey, JSON.stringify(history.slice(0, 100)));
    } catch (error) {
      console.log('Erreur sauvegarde historique local:', error);
    }

    // Reset la seance courante
    setCurrentWorkout(null);
    setIsWorkoutActive(false);
    await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);

    return finishedWorkout;
  }, [currentWorkout]);

  // Sauvegarder une seance passee (sans passer par le flow normal)
  const savePastSession = useCallback(async (workout) => {
    // workout = { name, date (YYYY-MM-DD), durationMin, exercises: [...] }
    const dateStr = workout.date;
    const durationMin = workout.durationMin || 0;
    const start = new Date(`${dateStr}T10:00:00`);
    const end = new Date(start.getTime() + durationMin * 60 * 1000);

    const pastWorkout = {
      ...workout,
      id: Date.now().toString(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: durationMin,
    };

    // Sauvegarder sur le backend
    try {
      const result = await saveSessionToBackend(pastWorkout);
      if (result.success) {
        pastWorkout.backendId = result.data?._id;
      }
    } catch (error) {
      console.log('[WORKOUT] Erreur sync backend (past session):', error);
    }

    // Sauvegarder dans l'historique local
    try {
      const historyKey = '@workout_history';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(pastWorkout);
      await AsyncStorage.setItem(historyKey, JSON.stringify(history.slice(0, 100)));
    } catch (error) {
      console.log('Erreur sauvegarde historique local (past):', error);
    }

    return pastWorkout;
  }, []);

  // Forcer le startTime (pour reprendre une séance partagée avec le bon timestamp)
  const setWorkoutStartTime = useCallback((isoString) => {
    setCurrentWorkout(prev => {
      if (!prev) return prev;
      const updated = { ...prev, startTime: isoString };
      setIsWorkoutActive(true);
      saveWorkout(updated);
      return updated;
    });
  }, []);

  // Annuler la seance
  const cancelWorkout = useCallback(async () => {
    setCurrentWorkout(null);
    setIsWorkoutActive(false);
    await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);
  }, []);

  // Sauvegarder le workout en cours
  const saveWorkout = async (workout) => {
    try {
      await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workout));
    } catch (error) {
      console.log('Erreur sauvegarde workout:', error);
    }
  };

  // Charger un workout en cours (au demarrage de l'app)
  const loadWorkout = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
      if (stored) {
        const workout = JSON.parse(stored);
        // Migration : ajouter le mode aux exercices existants si manquant
        if (workout.exercises) {
          workout.exercises = workout.exercises.map(e => {
            if (!e.mode) {
              const mode = detectExerciseMode(e.exercice);
              // Si c'est un ancien format muscu avec sets, garder tel quel
              if (e.sets && !e.cardioSets && !e.swim && !e.yoga && !e.stretch && !e.walkRun) {
                return { ...e, mode };
              }
              return { ...e, mode };
            }
            return e;
          });
        }
        setCurrentWorkout(workout);
        setIsWorkoutActive(true);
        return workout;
      }
    } catch (error) {
      console.log('Erreur chargement workout:', error);
    }
    return null;
  }, []);

  // Verifier si un exercice est dans la seance
  const isExerciseInWorkout = useCallback((exerciceId) => {
    if (!currentWorkout) return false;
    return currentWorkout.exercises.some(e => e.exercice.id === exerciceId);
  }, [currentWorkout]);

  // Compter les series completees (adapte aux differents modes)
  const getCompletedSetsCount = useCallback(() => {
    if (!currentWorkout) return 0;
    return currentWorkout.exercises.reduce((total, ex) => {
      if (ex.sets) {
        return total + ex.sets.filter(s => s.completed).length;
      }
      // Pour les modes sans sets (swim, yoga, stretch, walkrun), compter 1 si des donnees sont saisies
      if (ex.swim && (ex.swim.poolLength || ex.swim.lapCount)) return total + 1;
      if (ex.yoga && ex.yoga.durationMin) return total + 1;
      if (ex.stretch && ex.stretch.durationSec) return total + 1;
      if (ex.walkRun && (ex.walkRun.durationMin || ex.walkRun.distanceKm)) return total + 1;
      if (ex.cardioSets) {
        return total + ex.cardioSets.filter(s => s.durationMin || s.durationSec).length;
      }
      return total;
    }, 0);
  }, [currentWorkout]);

  // Compter le total des series
  const getTotalSetsCount = useCallback(() => {
    if (!currentWorkout) return 0;
    return currentWorkout.exercises.reduce((total, ex) => {
      if (ex.sets) return total + ex.sets.length;
      if (ex.cardioSets) return total + ex.cardioSets.length;
      // Modes sans sets comptent pour 1
      if (ex.swim || ex.yoga || ex.stretch || ex.walkRun) return total + 1;
      return total;
    }, 0);
  }, [currentWorkout]);

  // Recuperer l'historique des seances depuis le backend
  const getWorkoutHistory = useCallback(async (params = {}) => {
    try {
      const result = await getSessionsFromBackend(params);
      if (result.success && result.data.length > 0) {
        return {
          success: true,
          data: result.data,
          nextCursor: result.nextCursor,
          source: 'backend',
        };
      }

      const historyKey = '@workout_history';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const localHistory = existingHistory ? JSON.parse(existingHistory) : [];

      return {
        success: true,
        data: localHistory,
        nextCursor: null,
        source: 'local',
      };
    } catch (error) {
      console.log('[WORKOUT] Erreur chargement historique:', error);

      try {
        const historyKey = '@workout_history';
        const existingHistory = await AsyncStorage.getItem(historyKey);
        const localHistory = existingHistory ? JSON.parse(existingHistory) : [];
        return {
          success: true,
          data: localHistory,
          nextCursor: null,
          source: 'local',
        };
      } catch (localError) {
        return { success: false, data: [], error: localError.message };
      }
    }
  }, []);

  const value = {
    currentWorkout,
    isWorkoutActive,
    startWorkout,
    addExercise,
    removeExercise,
    moveExerciseUp,
    moveExerciseDown,
    addSet,
    addCardioSet,
    removeSet,
    removeCardioSet,
    updateSet,
    updateCardioSet,
    updateExerciseData,
    changeExerciseMode,
    toggleSetComplete,
    finishWorkout,
    cancelWorkout,
    setWorkoutStartTime,
    loadWorkout,
    isExerciseInWorkout,
    getCompletedSetsCount,
    getTotalSetsCount,
    getWorkoutHistory,
    savePastSession,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}

export default WorkoutContext;
