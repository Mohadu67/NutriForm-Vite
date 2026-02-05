import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { secureApiCall } from '../../../utils/authService';
import logger from '../../../shared/utils/logger';
import ConfirmModal from '../../../components/Modal/ConfirmModal';
import { ClockIcon, FireIcon, UtensilsIcon } from '../../../components/Navbar/NavIcons';
import { getProxiedImageUrl } from '../../../utils/imageProxy';
import styles from './PendingRecipes.module.css';

// Icons
const XIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CheckCircleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const UserIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const GOAL_LABELS = {
  weight_loss: 'Perte de poids',
  muscle_gain: 'Prise de masse',
  maintenance: 'Maintien',
  performance: 'Performance',
  health: 'Sante'
};

const MEAL_TYPE_LABELS = {
  breakfast: 'Petit-dejeuner',
  lunch: 'Dejeuner',
  dinner: 'Diner',
  snack: 'Snack'
};

const TAG_LABELS = {
  quick: 'Rapide',
  no_sugar: 'Sans sucre',
  high_protein: 'Riche en proteines',
  low_carb: 'Faible en glucides',
  low_fat: 'Faible en gras',
  budget_friendly: 'Economique',
  family_friendly: 'Familial',
  meal_prep: 'Meal prep'
};

const DIET_LABELS = {
  none: 'Aucun',
  vegetarian: 'Vegetarien',
  vegan: 'Vegan',
  pescatarian: 'Pescatarien',
  keto: 'Keto',
  paleo: 'Paleo',
  gluten_free: 'Sans gluten',
  lactose_free: 'Sans lactose'
};

const DIFFICULTY_LABELS = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile'
};

export default function PendingRecipes({ onClose }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [approveModalConfig, setApproveModalConfig] = useState({ isOpen: false, recipeId: null });
  const [rejectModalConfig, setRejectModalConfig] = useState({ isOpen: false, recipeId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingRecipes();
  }, []);

  const fetchPendingRecipes = async () => {
    try {
      setLoading(true);
      const response = await secureApiCall('/recipes/admin/pending', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des recettes en attente:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmApprove = (recipeId) => {
    setApproveModalConfig({ isOpen: true, recipeId });
  };

  const handleApprove = async (recipeId) => {
    try {
      const response = await secureApiCall(`/recipes/admin/${recipeId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Recette approuvee avec succes !');
        fetchPendingRecipes();
        setSelectedRecipe(null);
      } else {
        const error = await response.json();
        toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
      }
    } catch (error) {
      logger.error('Erreur lors de l\'approbation:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const confirmReject = (recipeId) => {
    setRejectReason('');
    setRejectModalConfig({ isOpen: true, recipeId });
  };

  const handleReject = async (recipeId, reason) => {
    try {
      const response = await secureApiCall(`/recipes/admin/${recipeId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success('Recette rejetee. L\'utilisateur peut la modifier et la resoumettre.');
        fetchPendingRecipes();
        setSelectedRecipe(null);
      } else {
        const error = await response.json();
        toast.error('Erreur: ' + (error.message || 'Erreur inconnue'));
      }
    } catch (error) {
      logger.error('Erreur lors du rejet:', error);
      toast.error('Erreur lors du rejet');
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
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.loading}>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Recettes en attente de validation</h2>
          <button onClick={onClose} className={styles.closeBtn}><XIcon size={20} /></button>
        </div>

        {recipes.length === 0 ? (
          <div className={styles.empty}>
            <p>Aucune recette en attente de validation</p>
          </div>
        ) : (
          <div className={styles.list}>
            {recipes.map((recipe) => {
              const nutrition = getNutritionPerServing(recipe);
              return (
                <div
                  key={recipe._id}
                  className={`${styles.card} ${selectedRecipe?._id === recipe._id ? styles.selected : ''}`}
                >
                  <div className={styles.cardHeader} onClick={() => setSelectedRecipe(selectedRecipe?._id === recipe._id ? null : recipe)}>
                    <div className={styles.cardTitle}>
                      {recipe.image && (
                        <img src={getProxiedImageUrl(recipe.image)} alt={recipe.title} className={styles.thumbnail} />
                      )}
                      <div>
                        <h3>{recipe.title}</h3>
                        <span className={styles.badge}>
                          <UserIcon size={16} />
                          {recipe.author?.pseudo || recipe.author?.email || 'Utilisateur'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className={styles.description}>{recipe.description}</p>

                  <div className={styles.stats}>
                    <span className={styles.statItem}><ClockIcon size={16} /> {recipe.totalTime || 0} min</span>
                    <span className={styles.statItem}><FireIcon size={16} /> {nutrition.calories} kcal</span>
                    <span className={styles.statItem}><UtensilsIcon size={16} /> {recipe.servings} parts</span>
                    <span className={styles.statItem}>{DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty}</span>
                  </div>

                  {selectedRecipe?._id === recipe._id && (
                    <div className={styles.details}>
                      <div className={styles.detailsContent}>
                        <h4>Details de la recette</h4>

                        {/* Nutrition */}
                        <div className={styles.section}>
                          <strong>Nutrition par portion:</strong>
                          <div className={styles.nutritionGrid}>
                            <span>Proteines: {nutrition.proteins}g</span>
                            <span>Glucides: {nutrition.carbs}g</span>
                            <span>Lipides: {nutrition.fats}g</span>
                          </div>
                        </div>

                        {/* Objectifs */}
                        {recipe.goal && recipe.goal.length > 0 && (
                          <div className={styles.section}>
                            <strong>Objectifs:</strong>
                            <div className={styles.tags}>
                              {recipe.goal.map((g, i) => (
                                <span key={i} className={styles.tag}>{GOAL_LABELS[g] || g}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Types de repas */}
                        {recipe.mealType && recipe.mealType.length > 0 && (
                          <div className={styles.section}>
                            <strong>Types de repas:</strong>
                            <div className={styles.tags}>
                              {recipe.mealType.map((m, i) => (
                                <span key={i} className={styles.tag}>{MEAL_TYPE_LABELS[m] || m}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {recipe.tags && recipe.tags.length > 0 && (
                          <div className={styles.section}>
                            <strong>Tags:</strong>
                            <div className={styles.tags}>
                              {recipe.tags.map((t, i) => (
                                <span key={i} className={styles.tag}>{TAG_LABELS[t] || t}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Regimes */}
                        {recipe.dietType && recipe.dietType.length > 0 && recipe.dietType[0] !== 'none' && (
                          <div className={styles.section}>
                            <strong>Regimes:</strong>
                            <div className={styles.tags}>
                              {recipe.dietType.filter(d => d !== 'none').map((d, i) => (
                                <span key={i} className={styles.tag}>{DIET_LABELS[d] || d}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ingredients */}
                        <div className={styles.section}>
                          <strong>Ingredients ({recipe.ingredients?.length || 0}):</strong>
                          <ul className={styles.ingredientsList}>
                            {recipe.ingredients?.map((ing, i) => (
                              <li key={i}>
                                {ing.quantity} {ing.unit} {ing.name}
                                {ing.optional && <span className={styles.optional}> (optionnel)</span>}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Instructions */}
                        <div className={styles.section}>
                          <strong>Instructions ({recipe.instructions?.length || 0} etapes):</strong>
                          <ol className={styles.instructionsList}>
                            {recipe.instructions?.map((inst, i) => (
                              <li key={i}>{inst}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      <div className={styles.actions}>
                        <button
                          onClick={() => confirmApprove(recipe._id)}
                          className={styles.approveBtn}
                        >
                          <CheckCircleIcon size={18} /> Approuver
                        </button>
                        <button
                          onClick={() => confirmReject(recipe._id)}
                          className={styles.rejectBtn}
                        >
                          <XIcon size={18} /> Rejeter
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedRecipe?._id !== recipe._id && (
                    <button
                      onClick={() => setSelectedRecipe(recipe)}
                      className={styles.viewBtn}
                    >
                      Voir les details
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal d'approbation */}
      <ConfirmModal
        isOpen={approveModalConfig.isOpen}
        onClose={() => setApproveModalConfig({ isOpen: false, recipeId: null })}
        onConfirm={() => {
          handleApprove(approveModalConfig.recipeId);
          setApproveModalConfig({ isOpen: false, recipeId: null });
        }}
        title="Approuver la recette"
        message="Voulez-vous approuver cette recette et la rendre publique ? Elle sera visible par tous les utilisateurs."
        type="default"
      />

      {/* Modal de rejet avec champ raison */}
      {rejectModalConfig.isOpen && (
        <div className={styles.modal} onClick={() => setRejectModalConfig({ isOpen: false, recipeId: null })}>
          <div className={styles.rejectModal} onClick={(e) => e.stopPropagation()}>
            <h3>Rejeter la recette</h3>
            <p>L'utilisateur pourra modifier et resoumettre sa recette.</p>
            <div className={styles.rejectInputGroup}>
              <label>Raison du rejet (optionnel) :</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi la recette est rejetee..."
                rows={3}
              />
            </div>
            <div className={styles.rejectActions}>
              <button
                onClick={() => setRejectModalConfig({ isOpen: false, recipeId: null })}
                className={styles.cancelBtn}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleReject(rejectModalConfig.recipeId, rejectReason);
                  setRejectModalConfig({ isOpen: false, recipeId: null });
                }}
                className={styles.confirmRejectBtn}
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
