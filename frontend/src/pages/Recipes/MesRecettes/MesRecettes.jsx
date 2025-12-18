import { useState, useEffect } from 'react';
import { useNotification } from '../../../hooks/useNotification.jsx';
import { secureApiCall } from '../../../utils/authService';
import logger from '../../../shared/utils/logger';
import styles from './MesRecettes.module.css';
import { ClockIcon, FireIcon, UtensilsIcon } from '../../../components/Navbar/NavIcons';

// Icons
const ArrowLeftIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const PlusIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EditIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const ShareIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const EyeIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function MesRecettes({ onBack, onEdit, onCreate, onView, refreshKey }) {
  const notify = useNotification();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposingId, setProposingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [unpublishingId, setUnpublishingId] = useState(null);

  useEffect(() => {
    loadMyRecipes();
  }, [refreshKey]);

  const loadMyRecipes = async () => {
    try {
      setLoading(true);
      const response = await secureApiCall('/recipes/user/my-recipes');

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      } else {
        logger.error('Erreur chargement recettes');
      }
    } catch (error) {
      logger.error('Erreur chargement recettes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId) => {
    const confirmed = await notify.confirm('Es-tu sur de vouloir supprimer cette recette ?', {
      title: 'Supprimer la recette'
    });
    if (!confirmed) return;

    setDeletingId(recipeId);
    try {
      const response = await secureApiCall(`/recipes/user/${recipeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRecipes(recipes.filter(r => r._id !== recipeId));
        logger.info('Recette supprimee');
        notify.success('Recette supprimee avec succes');
      } else {
        notify.error('Erreur lors de la suppression');
      }
    } catch (error) {
      logger.error('Erreur suppression:', error);
      notify.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePropose = async (recipeId) => {
    const confirmed = await notify.confirm('Veux-tu proposer cette recette pour qu\'elle soit accessible a tous ? Elle sera soumise a validation par un administrateur.', {
      title: 'Proposer la recette au public'
    });
    if (!confirmed) return;

    setProposingId(recipeId);
    try {
      const response = await secureApiCall(`/recipes/user/${recipeId}/propose`, {
        method: 'POST',
      });

      if (response.ok) {
        loadMyRecipes();
        notify.success('Recette proposee avec succes ! Elle sera bientot examinee par notre equipe.');
      } else {
        const error = await response.json();
        notify.error(error.message || 'Erreur lors de la proposition');
      }
    } catch (error) {
      logger.error('Erreur proposition:', error);
      notify.error('Erreur lors de la proposition');
    } finally {
      setProposingId(null);
    }
  };

  const handleUnpublish = async (recipeId) => {
    const confirmed = await notify.confirm('Veux-tu retirer cette recette du public pour la modifier ? Elle ne sera plus visible par les autres utilisateurs jusqu\'a ce que tu la resoumettes.', {
      title: 'Modifier la recette'
    });
    if (!confirmed) return;

    setUnpublishingId(recipeId);
    try {
      const response = await secureApiCall(`/recipes/user/${recipeId}/unpublish`, {
        method: 'POST',
      });

      if (response.ok) {
        loadMyRecipes();
        notify.success('Recette retiree du public. Tu peux maintenant la modifier et la resoumettre.');
      } else {
        const error = await response.json();
        notify.error(error.message || 'Erreur lors du retrait');
      }
    } catch (error) {
      logger.error('Erreur unpublish:', error);
      notify.error('Erreur lors du retrait de la recette');
    } finally {
      setUnpublishingId(null);
    }
  };

  const getStatusBadge = (status, rejectionReason) => {
    switch (status) {
      case 'public':
        return <span className={`${styles.badge} ${styles.badgePublic}`}>Public</span>;
      case 'pending':
        return <span className={`${styles.badge} ${styles.badgePending}`}>En attente</span>;
      default:
        return (
          <span className={`${styles.badge} ${styles.badgePrivate}`} title={rejectionReason || ''}>
            Prive {rejectionReason && '(refuse)'}
          </span>
        );
    }
  };

  const getNutritionPerServing = (recipe) => ({
    calories: Math.round((recipe.nutrition?.calories || 0) / (recipe.servings || 1)),
    proteins: Math.round((recipe.nutrition?.proteins || 0) / (recipe.servings || 1)),
    carbs: Math.round((recipe.nutrition?.carbs || 0) / (recipe.servings || 1)),
    fats: Math.round((recipe.nutrition?.fats || 0) / (recipe.servings || 1))
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement de tes recettes...</p>
      </div>
    );
  }

  return (
    <div className={styles.mesRecettes}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeftIcon size={20} />
          <span>Retour</span>
        </button>
        <div className={styles.headerContent}>
          <div>
            <h1>Mes recettes</h1>
            <p className={styles.subtitle}>
              Cree tes propres recettes et propose-les a la communaute
            </p>
          </div>
          <button onClick={onCreate} className={styles.createButton}>
            <PlusIcon size={20} />
            <span>Nouvelle recette</span>
          </button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🍳</div>
          <h3>Aucune recette creee</h3>
          <p>Cree ta premiere recette personnalisee !</p>
          <button onClick={onCreate} className={styles.createButton}>
            <PlusIcon size={20} />
            <span>Creer une recette</span>
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {recipes.map((recipe) => {
            const nutrition = getNutritionPerServing(recipe);
            return (
              <div key={recipe._id} className={styles.card}>
                {recipe.image && (
                  <div className={styles.coverImage}>
                    <img src={recipe.image} alt={recipe.title} loading="lazy" />
                  </div>
                )}

                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3>{recipe.title}</h3>
                    {getStatusBadge(recipe.status, recipe.rejectionReason)}
                  </div>

                  <p className={styles.description}>{recipe.description}</p>

                  {recipe.rejectionReason && recipe.status === 'private' && (
                    <div className={styles.rejectionReason}>
                      <strong>Raison du refus:</strong> {recipe.rejectionReason}
                    </div>
                  )}

                  <div className={styles.stats}>
                    <span className={styles.stat}>
                      <ClockIcon size={16} />
                      {recipe.totalTime || 0} min
                    </span>
                    <span className={styles.stat}>
                      <FireIcon size={16} />
                      {nutrition.calories} kcal
                    </span>
                    <span className={styles.stat}>
                      <UtensilsIcon size={16} />
                      {recipe.servings} parts
                    </span>
                  </div>

                  <div className={styles.nutrition}>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>P</span>
                      <span>{nutrition.proteins}g</span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>G</span>
                      <span>{nutrition.carbs}g</span>
                    </div>
                    <div className={styles.nutritionItem}>
                      <span className={styles.nutritionLabel}>L</span>
                      <span>{nutrition.fats}g</span>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    {/* Bouton Voir - toujours visible pour les recettes publiques */}
                    {recipe.status === 'public' && (
                      <button
                        onClick={() => onView && onView(recipe)}
                        className={styles.viewBtn}
                        title="Voir la recette"
                      >
                        <EyeIcon size={16} />
                      </button>
                    )}

                    {/* Bouton Modifier - pour les recettes privees */}
                    {recipe.status === 'private' && (
                      <button
                        onClick={() => onEdit && onEdit(recipe)}
                        className={styles.editBtn}
                        title="Modifier"
                      >
                        <EditIcon size={16} />
                      </button>
                    )}

                    {/* Bouton Demander modification - pour les recettes publiques ou en attente */}
                    {(recipe.status === 'public' || recipe.status === 'pending') && (
                      <button
                        onClick={() => handleUnpublish(recipe._id)}
                        disabled={unpublishingId === recipe._id}
                        className={styles.editBtn}
                        title={recipe.status === 'public' ? 'Retirer du public pour modifier' : 'Annuler et modifier'}
                      >
                        {unpublishingId === recipe._id ? (
                          <span>...</span>
                        ) : (
                          <EditIcon size={16} />
                        )}
                      </button>
                    )}

                    {/* Bouton Proposer - pour les recettes privees */}
                    {recipe.status === 'private' && (
                      <button
                        onClick={() => handlePropose(recipe._id)}
                        disabled={proposingId === recipe._id}
                        className={styles.proposeBtn}
                        title="Proposer au public"
                      >
                        {proposingId === recipe._id ? (
                          <span>...</span>
                        ) : (
                          <ShareIcon size={16} />
                        )}
                      </button>
                    )}

                    {/* Bouton Supprimer - pour les recettes privees */}
                    {recipe.status === 'private' && (
                      <button
                        onClick={() => handleDelete(recipe._id)}
                        disabled={deletingId === recipe._id}
                        className={styles.deleteBtn}
                        title="Supprimer"
                      >
                        {deletingId === recipe._id ? (
                          <span>...</span>
                        ) : (
                          <TrashIcon size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
