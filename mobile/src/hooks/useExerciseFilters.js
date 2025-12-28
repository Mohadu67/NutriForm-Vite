import { useState, useMemo } from 'react';

// Mapping muscles vers zones body picker (avec variantes API)
const MUSCLE_TO_ZONE = {
  // Format local
  'pectoraux': 'pectoraux',
  'dos-superieur': 'dos-superieur',
  'dos-inferieur': 'dos-inferieur',
  'epaules': 'epaules',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'avant-bras': 'avant-bras',
  'cuisses-externes': 'cuisses-externes',
  'cuisses-internes': 'cuisses-internes',
  'fessiers': 'fessiers',
  'mollets': 'mollets',
  'abdos-centre': 'abdos-centre',
  'abdos-lateraux': 'abdos-lateraux',
  'cardio': 'cardio',

  // Variantes possibles de l'API
  'chest': 'pectoraux',
  'pecs': 'pectoraux',
  'back': 'dos-superieur',
  'upper-back': 'dos-superieur',
  'lower-back': 'dos-inferieur',
  'shoulders': 'epaules',
  'arms': 'biceps',
  'forearms': 'avant-bras',
  'quads': 'cuisses-externes',
  'quadriceps': 'cuisses-externes',
  'hamstrings': 'cuisses-internes',
  'glutes': 'fessiers',
  'calves': 'mollets',
  'abs': 'abdos-centre',
  'core': 'abdos-centre',
  'obliques': 'abdos-lateraux',
};

/**
 * Hook pour gérer le filtrage d'exercices
 *
 * @param {Object} options - Options du hook
 * @param {Array} options.exercises - Liste complète des exercices
 * @param {Array} options.favorites - Liste des IDs des exercices favoris
 *
 * @returns {Object} État des filtres et exercices filtrés
 */
export default function useExerciseFilters({ exercises = [], favorites = [] }) {
  // États des filtres
  const [searchText, setSearchText] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  /**
   * Filtre les exercices selon tous les critères actifs
   */
  const filteredExercises = useMemo(() => {
    let results = [...exercises];

    // Filtre par texte de recherche
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      results = results.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.muscle?.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query)
      );
    }

    // Filtre favoris uniquement
    if (showFavoritesOnly) {
      results = results.filter(ex => favorites.includes(ex.id));
    }

    // Filtre par types sélectionnés
    if (selectedTypes.length > 0) {
      results = results.filter(ex => selectedTypes.includes(ex.type));
    }

    // Filtre par muscles sélectionnés
    if (selectedMuscles.length > 0) {
      results = results.filter(ex => {
        // Vérifier le muscle principal
        const exZone = MUSCLE_TO_ZONE[ex.muscle] || ex.muscle;
        if (selectedMuscles.includes(exZone)) return true;

        // Vérifier dans muscles[] si disponible (format API)
        if (ex.muscles?.some(m => {
          const zone = MUSCLE_TO_ZONE[m] || m;
          return selectedMuscles.includes(zone);
        })) return true;

        // Vérifier les muscles secondaires
        if (ex.secondary?.some(sec => {
          const zone = MUSCLE_TO_ZONE[sec] || sec;
          return selectedMuscles.includes(zone);
        })) return true;

        return false;
      });
    }

    // Filtre par équipements (multi-selection)
    if (selectedEquipments.length > 0) {
      results = results.filter(ex => selectedEquipments.includes(ex.equipment));
    }

    return results;
  }, [exercises, searchText, selectedMuscles, selectedEquipments, selectedTypes, showFavoritesOnly, favorites]);

  /**
   * Compte le nombre de filtres actifs
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedMuscles.length > 0) count++;
    if (selectedEquipments.length > 0) count++;
    if (selectedTypes.length > 0) count++;
    if (showFavoritesOnly) count++;
    return count;
  }, [selectedMuscles, selectedEquipments, selectedTypes, showFavoritesOnly]);

  /**
   * Réinitialise tous les filtres
   */
  const clearFilters = () => {
    setSearchText('');
    setSelectedMuscles([]);
    setSelectedEquipments([]);
    setSelectedTypes([]);
    setShowFavoritesOnly(false);
  };

  return {
    // États
    searchText,
    selectedMuscles,
    selectedEquipments,
    selectedTypes,
    showFavoritesOnly,

    // Setters
    setSearchText,
    setSelectedMuscles,
    setSelectedEquipments,
    setSelectedTypes,
    setShowFavoritesOnly,

    // Données calculées
    filteredExercises,
    activeFiltersCount,

    // Actions
    clearFilters,
  };
}
