import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { secureApiCall } from '../../utils/authService';
import styles from './RecipeForm.module.css';
import Navbar from '../../components/Navbar/Navbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { useRecipeForm } from '../../hooks/admin/useRecipeForm';
import { useAdminNotification } from '../../hooks/admin/useAdminNotification';

const GOALS = [
  { value: 'weight_loss', label: 'Perte de poids' },
  { value: 'muscle_gain', label: 'Prise de masse' },
  { value: 'maintenance', label: 'Maintien' },
  { value: 'performance', label: 'Performance' },
  { value: 'health', label: 'Santé' }
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Snack' }
];

const TAGS = [
  { value: 'quick', label: 'Rapide (<30min)' },
  { value: 'no_sugar', label: 'Sans sucre' },
  { value: 'high_protein', label: 'Riche en protéines' },
  { value: 'low_carb', label: 'Faible en glucides' },
  { value: 'low_fat', label: 'Faible en gras' },
  { value: 'budget_friendly', label: 'Économique' },
  { value: 'family_friendly', label: 'Familial' },
  { value: 'meal_prep', label: 'Meal prep' }
];

const DIET_TYPES = [
  { value: 'none', label: 'Aucun' },
  { value: 'vegetarian', label: 'Végétarien' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarien' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten_free', label: 'Sans gluten' },
  { value: 'lactose_free', label: 'Sans lactose' }
];

export default function RecipeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const notify = useAdminNotification();

  const {
    formData,
    setField,
    setNutrition,
    toggleArray,
    setIngredient,
    addIngredient: addIngredientHook,
    removeIngredient: removeIngredientHook,
    setInstruction,
    addInstruction: addInstructionHook,
    removeInstruction: removeInstructionHook,
    loadRecipe
  } = useRecipeForm();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const response = await secureApiCall(`/recipes/${id}`);
      const data = await response.json();
      if (data.success) {
        loadRecipe({
          ...data.recipe,
          ingredients: data.recipe.ingredients.length > 0 ? data.recipe.ingredients : [{ name: '', quantity: '', unit: '', optional: false }],
          instructions: data.recipe.instructions.length > 0 ? data.recipe.instructions : ['']
        });
      }
    } catch (err) {
      setError('Erreur lors du chargement de la recette');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;

    if (type === 'number') {
      finalValue = value === '' ? 0 : parseInt(value);
    }

    setField(name, type === 'checkbox' ? checked : finalValue);
  };

  const handleNutritionChange = (e) => {
    const { name, value } = e.target;
    setNutrition(name, value === '' ? '' : parseFloat(value));
  };

  const handleArrayToggle = (field, value) => {
    toggleArray(field, value);
  };

  const handleIngredientChange = (index, field, value) => {
    let finalValue = value;
    if (field === 'quantity') {
      finalValue = value === '' ? '' : parseFloat(value) || 0;
    }
    setIngredient(index, field, finalValue);
  };

  const addIngredient = addIngredientHook;

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      removeIngredientHook(index);
    }
  };

  const handleInstructionChange = (index, value) => {
    setInstruction(index, value);
  };

  const addInstruction = addInstructionHook;

  const removeInstruction = (index) => {
    if (formData.instructions.length > 1) {
      removeInstructionHook(index);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Validation
    if (!formData.title || !formData.description || !formData.image) {
      setError('Veuillez remplir tous les champs obligatoires');
      setSaving(false);
      return;
    }

    if (formData.ingredients.some(ing => !ing.name || !ing.quantity || !ing.unit)) {
      setError('Veuillez remplir tous les ingrédients ou les supprimer');
      setSaving(false);
      return;
    }

    if (formData.instructions.some(inst => !inst.trim())) {
      setError('Veuillez remplir toutes les instructions ou les supprimer');
      setSaving(false);
      return;
    }

    try {
      const url = isEdit ? `/recipes/${id}` : '/recipes';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await secureApiCall(url, {
        method,
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        notify.success(isEdit ? 'Recette modifiée avec succès !' : 'Recette créée avec succès !');
        setTimeout(() => navigate('/admin'), 1500);
      } else {
        setError(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la recette');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loading}>Chargement...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => navigate('/admin')} className={styles.backBtn}>
            ← Retour
          </button>
          <h1>{isEdit ? 'Modifier la recette' : 'Nouvelle recette'}</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Informations de base */}
          <section className={styles.section}>
            <h2>Informations de base</h2>

            <div className={styles.formGroup}>
              <label>Titre *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ex: Bowl Protéiné du Champion"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Décrivez votre recette en quelques phrases..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>URL de l'image *</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                required
                placeholder="https://..."
              />
              {formData.image && (
                <img src={formData.image} alt="Preview" className={styles.imagePreview} />
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Catégorie</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="salty">Salé</option>
                  <option value="sweet">Sucré</option>
                  <option value="both">Les deux</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Difficulté</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Temps de préparation (min)</label>
                <input
                  type="number"
                  name="prepTime"
                  value={formData.prepTime}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Temps de cuisson (min)</label>
                <input
                  type="number"
                  name="cookTime"
                  value={formData.cookTime}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Portions</label>
                <input
                  type="number"
                  name="servings"
                  value={formData.servings}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="isPremium"
                  checked={formData.isPremium}
                  onChange={handleChange}
                />
                Recette Premium
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                />
                Publier la recette
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="isOfficial"
                  checked={formData.isOfficial}
                  onChange={handleChange}
                />
                Recette officielle
              </label>
            </div>
          </section>

          {/* Nutrition */}
          <section className={styles.section}>
            <h2>Valeurs nutritionnelles (pour la recette complète)</h2>
            <div className={styles.nutritionGrid}>
              <div className={styles.formGroup}>
                <label>Calories (kcal)</label>
                <input
                  type="number"
                  name="calories"
                  value={formData.nutrition.calories}
                  onChange={handleNutritionChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Protéines (g)</label>
                <input
                  type="number"
                  name="proteins"
                  value={formData.nutrition.proteins}
                  onChange={handleNutritionChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Glucides (g)</label>
                <input
                  type="number"
                  name="carbs"
                  value={formData.nutrition.carbs}
                  onChange={handleNutritionChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Lipides (g)</label>
                <input
                  type="number"
                  name="fats"
                  value={formData.nutrition.fats}
                  onChange={handleNutritionChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fibres (g)</label>
                <input
                  type="number"
                  name="fiber"
                  value={formData.nutrition.fiber}
                  onChange={handleNutritionChange}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </section>

          {/* Filtres */}
          <section className={styles.section}>
            <h2>Objectifs</h2>
            <div className={styles.pillsGrid}>
              {GOALS.map(goal => (
                <button
                  key={goal.value}
                  type="button"
                  className={`${styles.pill} ${formData.goal.includes(goal.value) ? styles.pillActive : ''}`}
                  onClick={() => handleArrayToggle('goal', goal.value)}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Types de repas</h2>
            <div className={styles.pillsGrid}>
              {MEAL_TYPES.map(meal => (
                <button
                  key={meal.value}
                  type="button"
                  className={`${styles.pill} ${formData.mealType.includes(meal.value) ? styles.pillActive : ''}`}
                  onClick={() => handleArrayToggle('mealType', meal.value)}
                >
                  {meal.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Tags</h2>
            <div className={styles.pillsGrid}>
              {TAGS.map(tag => (
                <button
                  key={tag.value}
                  type="button"
                  className={`${styles.pill} ${formData.tags.includes(tag.value) ? styles.pillActive : ''}`}
                  onClick={() => handleArrayToggle('tags', tag.value)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Régimes alimentaires</h2>
            <div className={styles.pillsGrid}>
              {DIET_TYPES.map(diet => (
                <button
                  key={diet.value}
                  type="button"
                  className={`${styles.pill} ${formData.dietType.includes(diet.value) ? styles.pillActive : ''}`}
                  onClick={() => handleArrayToggle('dietType', diet.value)}
                >
                  {diet.label}
                </button>
              ))}
            </div>
          </section>

          {/* Ingrédients */}
          <section className={styles.section}>
            <h2>Ingrédients</h2>
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className={styles.ingredientRow}>
                <input
                  type="text"
                  placeholder="Nom de l'ingrédient"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Quantité"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  required
                  min="0"
                  step="0.1"
                />
                <input
                  type="text"
                  placeholder="Unité (g, ml, pièce...)"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  required
                />
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={ingredient.optional}
                    onChange={(e) => handleIngredientChange(index, 'optional', e.target.checked)}
                  />
                  Optionnel
                </label>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className={styles.removeBtn}
                  disabled={formData.ingredients.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={addIngredient} className={styles.addBtn}>
              + Ajouter un ingrédient
            </button>
          </section>

          {/* Instructions */}
          <section className={styles.section}>
            <h2>Instructions</h2>
            {formData.instructions.map((instruction, index) => (
              <div key={index} className={styles.instructionRow}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <textarea
                  placeholder="Décrivez cette étape..."
                  value={instruction}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  required
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className={styles.removeBtn}
                  disabled={formData.instructions.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={addInstruction} className={styles.addBtn}>
              + Ajouter une étape
            </button>
          </section>

          {/* Submit */}
          <div className={styles.formActions}>
            <button type="button" onClick={() => navigate('/admin')} className={styles.cancelBtn}>
              Annuler
            </button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Enregistrement...' : (isEdit ? 'Modifier la recette' : 'Créer la recette')}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
