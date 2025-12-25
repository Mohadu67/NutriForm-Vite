import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  //       sets: [
  //         { reps: number, weight: number, completed: boolean, restTime: number }
  //       ]
  //     }
  //   ]
  // }

  // Demarrer une nouvelle seance
  const startWorkout = useCallback(() => {
    const workout = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      exercises: [],
    };
    setCurrentWorkout(workout);
    setIsWorkoutActive(true);
    saveWorkout(workout);
    return workout;
  }, []);

  // Ajouter un exercice a la seance
  const addExercise = useCallback((exercice) => {
    setCurrentWorkout(prev => {
      if (!prev) {
        // Si pas de seance active, en creer une
        const newWorkout = {
          id: Date.now().toString(),
          startTime: new Date().toISOString(),
          exercises: [{
            exercice,
            sets: [{ reps: 0, weight: 0, completed: false }],
          }],
        };
        setIsWorkoutActive(true);
        saveWorkout(newWorkout);
        return newWorkout;
      }

      // Verifier si l'exercice existe deja
      const existingIndex = prev.exercises.findIndex(e => e.exercice.id === exercice.id);
      if (existingIndex !== -1) {
        return prev; // L'exercice existe deja
      }

      const updated = {
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            exercice,
            sets: [{ reps: 0, weight: 0, completed: false }],
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

  // Ajouter une serie a un exercice
  const addSet = useCallback((exerciceId) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId) {
            const lastSet = e.sets[e.sets.length - 1];
            return {
              ...e,
              sets: [...e.sets, {
                reps: lastSet?.reps || 0,
                weight: lastSet?.weight || 0,
                completed: false
              }],
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
          if (e.exercice.id === exerciceId && e.sets.length > 1) {
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

  // Mettre a jour une serie
  const updateSet = useCallback((exerciceId, setIndex, data) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId) {
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

  // Marquer une serie comme completee
  const toggleSetComplete = useCallback((exerciceId, setIndex) => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        exercises: prev.exercises.map(e => {
          if (e.exercice.id === exerciceId) {
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
      duration: Math.round((new Date() - new Date(currentWorkout.startTime)) / 1000 / 60), // en minutes
    };

    // Sauvegarder dans l'historique
    try {
      const historyKey = '@workout_history';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(finishedWorkout);
      await AsyncStorage.setItem(historyKey, JSON.stringify(history.slice(0, 100))); // Garder les 100 derniers
    } catch (error) {
      console.log('Erreur sauvegarde historique:', error);
    }

    // Reset la seance courante
    setCurrentWorkout(null);
    setIsWorkoutActive(false);
    await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);

    return finishedWorkout;
  }, [currentWorkout]);

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

  // Compter les series completees
  const getCompletedSetsCount = useCallback(() => {
    if (!currentWorkout) return 0;
    return currentWorkout.exercises.reduce((total, ex) => {
      return total + ex.sets.filter(s => s.completed).length;
    }, 0);
  }, [currentWorkout]);

  // Compter le total des series
  const getTotalSetsCount = useCallback(() => {
    if (!currentWorkout) return 0;
    return currentWorkout.exercises.reduce((total, ex) => {
      return total + ex.sets.length;
    }, 0);
  }, [currentWorkout]);

  const value = {
    currentWorkout,
    isWorkoutActive,
    startWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    finishWorkout,
    cancelWorkout,
    loadWorkout,
    isExerciseInWorkout,
    getCompletedSetsCount,
    getTotalSetsCount,
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
