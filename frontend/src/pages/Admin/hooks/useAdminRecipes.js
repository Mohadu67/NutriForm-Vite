import { useState, useCallback, useMemo } from "react";
import { secureApiCall } from "../../../utils/authService";
import logger from "../../../shared/utils/logger.js";

const ITEMS_PER_PAGE = 20;

export function useAdminRecipes(notify, openModal) {
  const [recipes, setRecipes] = useState([]);
  const [searchRecipes, setSearchRecipes] = useState('');
  const [sortRecipes, setSortRecipes] = useState('date-desc');
  const [recipesPage, setRecipesPage] = useState(1);

  const fetchRecipes = useCallback(async (setLoading) => {
    setLoading(true);
    try {
      const response = await secureApiCall('/recipes');
      const data = await response.json();
      if (data.success) setRecipes(data.recipes);
    } catch (err) { logger.error("Erreur recettes:", err); }
    finally { setLoading(false); }
  }, []);

  const handleDeleteRecipe = async (id) => {
    try {
      const response = await secureApiCall(`/recipes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) { notify.success("Recette supprimee !"); fetchRecipes(() => {}); }
      else notify.error(data.message || "Erreur");
    } catch { notify.error("Erreur lors de la suppression"); }
  };

  const confirmDeleteRecipe = (id) => {
    openModal({
      title: 'Supprimer la recette',
      message: 'Supprimer cette recette ?',
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: () => handleDeleteRecipe(id)
    });
  };

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;
    if (searchRecipes) {
      const search = searchRecipes.toLowerCase();
      filtered = filtered.filter((r) => r.title?.toLowerCase().includes(search) || r.category?.toLowerCase().includes(search) || r.description?.toLowerCase().includes(search));
    }
    filtered = [...filtered].sort((a, b) => {
      switch (sortRecipes) {
        case 'date-asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'calories-desc': return (b.nutrition?.calories || 0) - (a.nutrition?.calories || 0);
        case 'calories-asc': return (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0);
        case 'views-desc': return (b.views || 0) - (a.views || 0);
        case 'views-asc': return (a.views || 0) - (b.views || 0);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return filtered;
  }, [recipes, searchRecipes, sortRecipes]);

  const paginatedRecipes = useMemo(
    () => filteredRecipes.slice((recipesPage - 1) * ITEMS_PER_PAGE, recipesPage * ITEMS_PER_PAGE),
    [filteredRecipes, recipesPage]
  );

  return {
    recipes,
    searchRecipes,
    setSearchRecipes,
    sortRecipes,
    setSortRecipes,
    recipesPage,
    setRecipesPage,
    fetchRecipes,
    confirmDeleteRecipe,
    filteredRecipes,
    paginatedRecipes,
  };
}
