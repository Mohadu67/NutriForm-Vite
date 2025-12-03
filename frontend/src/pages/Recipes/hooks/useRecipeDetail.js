import { useState, useEffect } from 'react';
import axios from 'axios';
import { storage } from '../../../shared/utils/storage';
import { secureApiCall } from '../../../utils/authService';

const API_URL = import.meta.env.VITE_API_URL || '';

export const useRecipeDetail = (recipeId) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeError, setLikeError] = useState(null);

  useEffect(() => {
    const fetchRecipeDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_URL}/recipes/${recipeId}`);

        if (response.data.success) {
          const recipeData = response.data.recipe;
          setRecipe(recipeData);
          setLikesCount(recipeData.likes?.length || 0);

          // Vérifier si l'utilisateur a déjà liké
          const user = storage.get('user');
          if (user && recipeData.likes) {
            setIsLiked(recipeData.likes.includes(user.id));
          }
        }
      } catch (err) {
        console.error('Erreur fetch recipe detail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipeDetail();
    }
  }, [recipeId]);

  const toggleLike = async () => {
    try {
      setLikeError(null);

      const response = await secureApiCall(`/recipes/${recipeId}/like`, {
        method: 'POST'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLikeError('auth_required');
          return;
        }
        throw new Error('Erreur lors de l\'ajout aux favoris');
      }

      const data = await response.json();

      if (data.success) {
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
      }
    } catch (err) {
      // secureApiCall throw une erreur "Not authenticated" pour les 401
      if (err.message === 'Not authenticated') {
        setLikeError('auth_required');
      } else {
        setLikeError('generic_error');
      }
    }
  };

  return {
    recipe,
    loading,
    error,
    isLiked,
    likesCount,
    toggleLike,
    likeError,
    clearLikeError: () => setLikeError(null)
  };
};
