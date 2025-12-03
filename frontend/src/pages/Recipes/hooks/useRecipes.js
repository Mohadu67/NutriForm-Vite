import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const useRecipes = (filters = {}, enabled = true) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1
  });

  // Créer une clé stable pour les dépendances
  const filtersKey = useMemo(() => JSON.stringify(filters), [
    filters.goal,
    filters.mealType,
    filters.tags,
    filters.difficulty,
    filters.category,
    filters.page,
    filters.limit,
    filters.sort,
    filters.search
  ]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setRecipes([]);
      return;
    }

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construire les query params
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value);
            }
          }
        });

        const response = await axios.get(`${API_URL}/recipes?${params.toString()}`);

        if (response.data.success) {
          setRecipes(response.data.recipes);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        console.error('Erreur fetch recipes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [filtersKey, enabled]);

  return { recipes, loading, error, pagination };
};

export const useFeaturedRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/recipes/featured`);

        if (response.data.success) {
          setRecipes(response.data.recipes);
        }
      } catch (err) {
        console.error('Erreur fetch featured:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return { recipes, loading, error };
};
