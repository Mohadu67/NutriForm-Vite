import { useState, useMemo } from 'react';

/**
 * Hook pour gérer le filtrage de recettes
 *
 * @param {Object} options - Options du hook
 * @param {Array} options.recipes - Liste complète des recettes
 * @param {Array} options.favorites - Liste des IDs des recettes favorites
 *
 * @returns {Object} État des filtres et recettes filtrées
 */
export default function useRecipeFilters({ recipes = [], favorites = [] }) {
  // États des filtres
  const [searchText, setSearchText] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedCookingTime, setSelectedCookingTime] = useState(null);
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [selectedMealTypes, setSelectedMealTypes] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  /**
   * Filtre les recettes selon tous les critères actifs
   */
  const filteredRecipes = useMemo(() => {
    console.log('[useRecipeFilters] Initial recipes count:', recipes.length);
    let results = [...recipes];

    // Filtre par texte de recherche
    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      results = results.filter(recipe =>
        recipe.title?.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.ingredients?.some(ing => ing.name?.toLowerCase().includes(query))
      );
    }

    // Filtre favoris uniquement
    if (showFavoritesOnly) {
      results = results.filter(recipe => favorites.includes(recipe._id));
    }

    // Filtre par cuisine
    if (selectedCuisines.length > 0) {
      results = results.filter(recipe =>
        selectedCuisines.includes(recipe.cuisine)
      );
    }

    // Filtre par difficulté
    if (selectedDifficulty) {
      results = results.filter(recipe => recipe.difficulty === selectedDifficulty);
    }

    // Filtre par temps de cuisson
    if (selectedCookingTime) {
      const maxTime = parseInt(selectedCookingTime);
      results = results.filter(recipe =>
        ((recipe.prepTime || 0) + (recipe.cookTime || 0)) <= maxTime
      );
    }

    // Filtre par restrictions alimentaires
    if (selectedDietary.length > 0) {
      results = results.filter(recipe =>
        selectedDietary.every(diet => recipe.dietary?.includes(diet))
      );
    }

    // Filtre par type de repas
    if (selectedMealTypes.length > 0) {
      results = results.filter(recipe =>
        selectedMealTypes.some(type => recipe.mealType?.includes(type))
      );
    }

    console.log('[useRecipeFilters] Filtered recipes count:', results.length);
    return results;
  }, [
    recipes,
    searchText,
    selectedCuisines,
    selectedDifficulty,
    selectedCookingTime,
    selectedDietary,
    selectedMealTypes,
    showFavoritesOnly,
    favorites,
  ]);

  /**
   * Compte le nombre de filtres actifs
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCuisines.length > 0) count++;
    if (selectedDifficulty) count++;
    if (selectedCookingTime) count++;
    if (selectedDietary.length > 0) count++;
    if (selectedMealTypes.length > 0) count++;
    if (showFavoritesOnly) count++;
    return count;
  }, [
    selectedCuisines,
    selectedDifficulty,
    selectedCookingTime,
    selectedDietary,
    selectedMealTypes,
    showFavoritesOnly,
  ]);

  /**
   * Réinitialise tous les filtres
   */
  const clearFilters = () => {
    setSearchText('');
    setSelectedCuisines([]);
    setSelectedDifficulty(null);
    setSelectedCookingTime(null);
    setSelectedDietary([]);
    setSelectedMealTypes([]);
    setShowFavoritesOnly(false);
  };

  return {
    // États
    searchText,
    selectedCuisines,
    selectedDifficulty,
    selectedCookingTime,
    selectedDietary,
    selectedMealTypes,
    showFavoritesOnly,

    // Setters
    setSearchText,
    setSelectedCuisines,
    setSelectedDifficulty,
    setSelectedCookingTime,
    setSelectedDietary,
    setSelectedMealTypes,
    setShowFavoritesOnly,

    // Données calculées
    filteredRecipes,
    activeFiltersCount,

    // Actions
    clearFilters,
  };
}
