import { useState, useEffect } from 'react';
import { secureApiCall } from '../../../utils/authService';

export const useLikedRecipes = () => {
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLikedRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await secureApiCall('/recipes/liked');

      if (!response.ok) {
        if (response.status === 401) {
          setLikedRecipes([]);
          return;
        }
        throw new Error('Erreur lors du chargement des favoris');
      }

      const data = await response.json();

      if (data.success) {
        setLikedRecipes(data.recipes || []);
      }
    } catch (err) {
      setError(err.message);
      setLikedRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedRecipes();
  }, []);

  return {
    likedRecipes,
    loading,
    error,
    refetch: fetchLikedRecipes
  };
};
