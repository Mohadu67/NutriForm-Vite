/**
 * Hook pour le suivi intelligent des seances
 * Gere le toggle activation/desactivation et les donnees de progression
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLastExerciseData } from '../api/workouts';
import {
  calculateProgression,
  detectRecord,
  calculateDifference,
  getSuggestedValues,
} from '../utils/progressionHelper';

const SMART_TRACKING_KEY = '@smart_tracking_enabled';

/**
 * Hook principal pour le suivi intelligent
 */
export function useSmartTracking() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la preference au montage
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(SMART_TRACKING_KEY);
        // Par defaut active si pas de preference stockee
        setIsEnabled(stored === null ? true : stored === 'true');
      } catch (error) {
        console.log('[SMART TRACKING] Error loading preference:', error);
        setIsEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreference();
  }, []);

  // Toggle avec persistence
  const toggleSmartTracking = useCallback(async () => {
    try {
      const newValue = !isEnabled;
      setIsEnabled(newValue);
      await AsyncStorage.setItem(SMART_TRACKING_KEY, newValue.toString());
      return newValue;
    } catch (error) {
      console.log('[SMART TRACKING] Error saving preference:', error);
      return isEnabled;
    }
  }, [isEnabled]);

  return {
    isEnabled,
    isLoading,
    toggleSmartTracking,
  };
}

/**
 * Hook pour les donnees d'un exercice specifique
 * @param {string} exerciseId - ID ou nom de l'exercice
 * @param {boolean} isEnabled - Si le suivi intelligent est active
 */
export function useExerciseData(exerciseId, exerciseName, isEnabled = true) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadedRef = useRef(false);
  const searchKeyRef = useRef(null);

  useEffect(() => {
    const searchKey = exerciseName || exerciseId;

    // Ne pas recharger si meme exercice
    if (searchKeyRef.current === searchKey && loadedRef.current) {
      return;
    }

    // Reset si pas active ou pas d'identifiant
    if (!isEnabled || !searchKey) {
      setData(null);
      setIsLoading(false);
      return;
    }

    searchKeyRef.current = searchKey;
    loadedRef.current = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getLastExerciseData(searchKey);
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setData(null);
        }
      } catch (err) {
        console.log('[EXERCISE DATA] Error:', err);
        setError(err.message);
        setData(null);
      } finally {
        setIsLoading(false);
        loadedRef.current = true;
      }
    };

    loadData();
  }, [exerciseId, exerciseName, isEnabled]);

  return { data, isLoading, error };
}

/**
 * Hook pour obtenir les suggestions de progression d'un exercice
 * @param {Object} exerciseData - Donnees historiques de l'exercice
 * @param {boolean} isPdc - Est-ce poids du corps?
 * @param {string} exerciseName - Nom de l'exercice
 * @param {boolean} isEnabled - Si le suivi intelligent est active
 */
export function useProgressionSuggestion(exerciseData, isPdc = false, exerciseName = '', isEnabled = true) {
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    if (!isEnabled || !exerciseData) {
      setSuggestion(null);
      return;
    }

    const prog = calculateProgression(exerciseData, isPdc, exerciseName);
    setSuggestion(prog);
  }, [exerciseData, isPdc, exerciseName, isEnabled]);

  return suggestion;
}

/**
 * Hook pour analyser une serie en temps reel
 * @param {Object} currentSet - Serie actuelle
 * @param {Object} exerciseData - Donnees historiques
 * @param {number} setIndex - Index de la serie
 * @param {boolean} isEnabled - Si le suivi intelligent est active
 */
export function useSetAnalysis(currentSet, exerciseData, setIndex = 0, isEnabled = true) {
  const [analysis, setAnalysis] = useState({
    record: null,
    difference: null,
  });

  useEffect(() => {
    if (!isEnabled || !currentSet || !exerciseData) {
      setAnalysis({ record: null, difference: null });
      return;
    }

    const record = detectRecord(currentSet, exerciseData);
    const difference = calculateDifference(currentSet, exerciseData, setIndex);

    setAnalysis({ record, difference });
  }, [currentSet, exerciseData, setIndex, isEnabled]);

  return analysis;
}

/**
 * Fonction utilitaire pour obtenir les valeurs suggerees
 */
export function getSmartSuggestedValues(currentSets, exerciseData, isPdc, isEnabled) {
  if (!isEnabled) {
    return { weight: 0, reps: 0, source: 'default' };
  }
  return getSuggestedValues(currentSets, exerciseData, isPdc);
}

export default {
  useSmartTracking,
  useExerciseData,
  useProgressionSuggestion,
  useSetAnalysis,
  getSmartSuggestedValues,
};
