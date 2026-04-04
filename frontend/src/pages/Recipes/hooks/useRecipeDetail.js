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
  const [userRating, setUserRating] = useState(null);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [similarRecipes, setSimilarRecipes] = useState([]);

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

        // Essayer avec auth si connecté (pour récupérer userRating), sinon route publique
        const user = storage.get('user');
        try {
          let recipeData;
          if (user) {
            const authResponse = await secureApiCall(`/recipes/${recipeId}`);
            if (authResponse.ok) {
              const data = await authResponse.json();
              if (data.success) recipeData = data.recipe;
            }
          }
          if (!recipeData) {
            const response = await axios.get(`${API_URL}/recipes/${recipeId}`);
            if (response.data.success) recipeData = response.data.recipe;
          }
          if (recipeData) {
            if (mounted) {
              setRecipe(recipeData);
              setLikesCount(recipeData.likes?.length || 0);
              setAvgRating(recipeData.avgRating || 0);
              setRatingsCount(recipeData.ratingsCount || 0);
              setUserRating(recipeData.userRating || null);

              if (user && recipeData.likes) {
                setIsLiked(recipeData.likes.includes(user.id));
              }
            }
            found = true;
          }
        } catch (publicErr) {
          if (publicErr.response?.status !== 404 && publicErr.message !== 'Not authenticated') {
            throw publicErr;
          }
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
                  setAvgRating(recipeData.avgRating || 0);
                  setRatingsCount(recipeData.ratingsCount || 0);
                  setUserRating(recipeData.userRating || null);

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

    // Fetch similar recipes
    axios.get(`${API_URL}/recipes/${recipeId}/similar?limit=8`)
      .then((res) => {
        if (mounted && res.data?.success) setSimilarRecipes(res.data.recipes || []);
      })
      .catch(() => {});

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

  const submitRating = async (rating) => {
    try {
      const response = await secureApiCall(`/recipes/${recipeId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLikeError('auth_required');
          return;
        }
        throw new Error('Erreur lors de la notation');
      }

      const data = await response.json();
      if (data.success) {
        setUserRating(data.userRating);
        setAvgRating(data.avgRating);
        setRatingsCount(data.ratingsCount);
      }
    } catch (err) {
      if (err.message === 'Not authenticated') {
        setLikeError('auth_required');
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
    clearLikeError: () => setLikeError(null),
    userRating,
    avgRating,
    ratingsCount,
    submitRating,
    similarRecipes,
  };
};
