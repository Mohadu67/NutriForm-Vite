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
    if (!recipeId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchRecipeDetail = async () => {
      setLoading(true);
      setError(null);
      setRecipe(null);

      try {
        let found = false;

        // D'abord essayer la route publique
        try {
          const response = await axios.get(`${API_URL}/recipes/${recipeId}`);
          if (response.data.success) {
            const recipeData = response.data.recipe;
            if (mounted) {
              setRecipe(recipeData);
              setLikesCount(recipeData.likes?.length || 0);

              const user = storage.get('user');
              if (user && recipeData.likes) {
                setIsLiked(recipeData.likes.includes(user.id));
              }
            }
            found = true;
          }
        } catch (publicErr) {
          if (publicErr.response?.status !== 404) {
            throw publicErr;
          }
          // Si 404, continuer vers la route privée
        }

        // Essayer la route privée si pas trouvée en public
        if (!found) {
          try {
            const privateResponse = await secureApiCall(`/recipes/user/${recipeId}`);
            if (privateResponse.ok) {
              const data = await privateResponse.json();
              if (data.success) {
                const recipeData = data.recipe;
                if (mounted) {
                  setRecipe(recipeData);
                  setLikesCount(recipeData.likes?.length || 0);

                  const user = storage.get('user');
                  if (user && recipeData.likes) {
                    setIsLiked(recipeData.likes.includes(user.id));
                  }
                }
                found = true;
              }
            }
          } catch (privateErr) {
            console.error('Recette non trouvée:', privateErr);
          }
        }

        // Si pas trouvée, afficher erreur
        if (!found && mounted) {
          setError('Recette introuvable');
        }
      } catch (err) {
        if (mounted) {
          console.error('Erreur fetch recipe detail:', err);
          setError(err.message || 'Erreur lors du chargement');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRecipeDetail();

    // Cleanup pour éviter les state updates après unmount
    return () => {
      mounted = false;
    };
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
