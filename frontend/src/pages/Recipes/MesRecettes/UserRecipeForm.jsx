import { useState, useEffect } from 'react';
import { useNotification } from '../../../hooks/useNotification.jsx';
import { secureApiCall } from '../../../utils/authService';
import logger from '../../../shared/utils/logger';
import ErrorModal from '../../../components/Modal/ErrorModal';
import styles from './UserRecipeForm.module.css';

const GOALS = [
  { value: 'weight_loss', label: 'Perte de poids' },
  { value: 'muscle_gain', label: 'Prise de masse' },
  { value: 'maintenance', label: 'Maintien' },
  { value: 'performance', label: 'Performance' },
  { value: 'health', label: 'Sante' }
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Petit-dejeuner' },
  { value: 'lunch', label: 'Dejeuner' },
  { value: 'dinner', label: 'Diner' },
  { value: 'snack', label: 'Snack' }
];

const TAGS = [
  { value: 'quick', label: 'Rapide (<30min)' },
  { value: 'no_sugar', label: 'Sans sucre' },
  { value: 'high_protein', label: 'Riche en proteines' },
  { value: 'low_carb', label: 'Faible en glucides' },
  { value: 'low_fat', label: 'Faible en gras' },
  { value: 'budget_friendly', label: 'Economique' },
  { value: 'family_friendly', label: 'Familial' },
  { value: 'meal_prep', label: 'Meal prep' }
];

const DIET_TYPES = [
  { value: 'none', label: 'Aucun' },
  { value: 'vegetarian', label: 'Vegetarien' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarien' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten_free', label: 'Sans gluten' },
  { value: 'lactose_free', label: 'Sans lactose' }
];

// Icons
const ArrowLeftIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

export default function UserRecipeForm({ recipe, onBack, onSave }) {
  const notify = useNotification();
  const isEdit = Boolean(recipe?._id);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFromUrl, setUploadingFromUrl] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    category: 'salty',
    difficulty: 'medium',
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    nutrition: {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
      fiber: 0
    },
    goal: [],
    mealType: [],
    tags: [],
    dietType: ['none'],
    ingredients: [{ name: '', quantity: '', unit: '', optional: false }],
    instructions: ['']
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        ...recipe,
        ingredients: recipe.ingredients?.length > 0 ? recipe.ingredients : [{ name: '', quantity: '', unit: '', optional: false }],
        instructions: recipe.instructions?.length > 0 ? recipe.instructions : ['']
      });
    }
  }, [recipe]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;

    if (type === 'number') {
      finalValue = value === '' ? 0 : parseInt(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : finalValue
    }));
  };

  const handleNutritionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        [name]: value === '' ? '' : parseFloat(value)
      }
    }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    let finalValue = value;

    if (field === 'quantity') {
      finalValue = value === '' ? '' : parseFloat(value) || 0;
    }

    newIngredients[index] = {
      ...newIngredients[index],
      [field]: finalValue
    };
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '', optional: false }]
    }));
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }));
    }
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      notify.error('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      notify.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setImageFile(file);
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await secureApiCall('/upload/recipe-image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
        notify.success('Image uploadée avec succès !');
        setImageFile(null);
      } else {
        setError({
          title: 'Erreur d\'upload',
          message: data.message || 'Impossible d\'uploader l\'image. Veuillez réessayer.',
          details: response.status !== 200 ? `HTTP ${response.status}` : null
        });
      }
    } catch (err) {
      logger.error('Erreur upload image:', err);
      setError({
        title: 'Erreur d\'upload',
        message: 'Une erreur s\'est produite lors de l\'upload de l\'image. Vérifiez votre connexion et réessayez.',
        details: err.message
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImageFile(null);
    setImageUrlInput('');
  };

  const handleUploadFromUrl = async () => {
    if (!imageUrlInput.trim()) {
      notify.error('Veuillez entrer une URL d\'image');
      return;
    }

    setUploadingFromUrl(true);
    setError(null);

    try {
      const response = await secureApiCall('/upload/from-url', {
        method: 'POST',
        body: JSON.stringify({ url: imageUrlInput })
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
        notify.success('Image uploadée sur Cloudinary avec succès !');
        setImageUrlInput('');
      } else {
        setError({
          title: 'Erreur d\'upload',
          message: data.message || 'Impossible d\'uploader l\'image depuis cette URL.',
          details: response.status !== 200 ? `HTTP ${response.status}` : null
        });
      }
    } catch (err) {
      logger.error('Erreur upload depuis URL:', err);
      setError({
        title: 'Erreur d\'upload',
        message: 'Une erreur s\'est produite. Vérifiez que l\'URL pointe vers une image valide.',
        details: err.message
      });
    } finally {
      setUploadingFromUrl(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Validation
    if (!formData.title || !formData.description) {
      notify.error('Veuillez remplir le titre et la description');
      setSaving(false);
      return;
    }

    if (formData.ingredients.some(ing => !ing.name || !ing.quantity || !ing.unit)) {
      notify.error('Veuillez remplir tous les ingredients ou les supprimer');
      setSaving(false);
      return;
    }

    if (formData.instructions.some(inst => !inst.trim())) {
      notify.error('Veuillez remplir toutes les instructions ou les supprimer');
      setSaving(false);
      return;
    }

    try {
      const url = isEdit ? `/recipes/user/${recipe._id}` : '/recipes/user';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await secureApiCall(url, {
        method,
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        notify.success(isEdit ? 'Recette modifiee avec succes !' : 'Recette creee avec succes !');
        if (onSave) onSave(data.recipe);
      } else {
        notify.error(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      logger.error('Erreur sauvegarde recette:', err);
      notify.error('Erreur lors de l\'enregistrement de la recette');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={onBack} className={styles.backBtn}>
            <ArrowLeftIcon size={20} />
            Retour
          </button>
          <h1>{isEdit ? 'Modifier la recette' : 'Nouvelle recette'}</h1>
        </div>

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
              placeholder="Ex: Bowl Proteine du Champion"
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
              placeholder="Decrivez votre recette en quelques phrases..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Image de la recette</label>

            {/* Si on a déjà une image uploadée */}
            {formData.image ? (
              <div className={styles.imagePreviewContainer}>
                <img src={formData.image} alt="Preview" className={styles.imagePreview} />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className={styles.removeImageBtn}
                >
                  Supprimer l'image
                </button>
              </div>
            ) : (
              <>
                {/* Input de sélection de fichier */}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className={styles.fileInput}
                />

                {/* Aperçu du fichier sélectionné */}
                {imageFile && (
                  <div className={styles.filePreview}>
                    <p>📷 {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                      className={styles.uploadBtn}
                    >
                      {uploadingImage ? 'Upload en cours...' : 'Uploader l\'image'}
                    </button>
                  </div>
                )}

                {/* Ou URL avec upload sur Cloudinary */}
                <div className={styles.orDivider}>
                  <span>ou collez une URL d'image</span>
                </div>
                <div className={styles.urlUploadSection}>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://exemple.com/image.jpg"
                    className={styles.urlInput}
                  />
                  <button
                    type="button"
                    onClick={handleUploadFromUrl}
                    disabled={uploadingFromUrl || !imageUrlInput.trim()}
                    className={styles.uploadFromUrlBtn}
                  >
                    {uploadingFromUrl ? '⏳ Upload...' : '📤 Uploader sur Cloudinary'}
                  </button>
                </div>
                <p className={styles.hint}>
                  💡 L'image sera automatiquement téléchargée et hébergée sur Cloudinary
                </p>
              </>
            )}

            <p className={styles.hint}>
              {formData.image
                ? '✅ Image ajoutée - Vous pouvez maintenant proposer la recette au public'
                : '⚠️  Une image sera requise pour proposer la recette au public'}
            </p>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Categorie</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="salty">Sale</option>
                <option value="sweet">Sucre</option>
                <option value="both">Les deux</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Difficulte</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Temps de preparation (min)</label>
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
        </section>

        {/* Nutrition */}
        <section className={styles.section}>
          <h2>Valeurs nutritionnelles (pour la recette complete)</h2>
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
              <label>Proteines (g)</label>
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
          <h2>Regimes alimentaires</h2>
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

        {/* Ingredients */}
        <section className={styles.section}>
          <h2>Ingredients</h2>
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className={styles.ingredientRow}>
              <input
                type="text"
                placeholder="Nom de l'ingredient"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Quantite"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                required
                min="0"
                step="0.1"
              />
              <input
                type="text"
                placeholder="Unite (g, ml, piece...)"
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
                X
              </button>
            </div>
          ))}
          <button type="button" onClick={addIngredient} className={styles.addBtn}>
            + Ajouter un ingredient
          </button>
        </section>

        {/* Instructions */}
        <section className={styles.section}>
          <h2>Instructions</h2>
          {formData.instructions.map((instruction, index) => (
            <div key={index} className={styles.instructionRow}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <textarea
                placeholder="Decrivez cette etape..."
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
                X
              </button>
            </div>
          ))}
          <button type="button" onClick={addInstruction} className={styles.addBtn}>
            + Ajouter une etape
          </button>
        </section>

        {/* Submit */}
        <div className={styles.formActions}>
          <button type="button" onClick={onBack} className={styles.cancelBtn}>
            Annuler
          </button>
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Enregistrement...' : (isEdit ? 'Modifier la recette' : 'Creer la recette')}
          </button>
        </div>
      </form>
    </div>

    <ErrorModal
      isOpen={!!error}
      title={error?.title}
      message={error?.message}
      details={error?.details}
      onClose={() => setError(null)}
      onRetry={handleImageUpload}
      retryText="Réessayer l'upload"
    />
    </>
  );
}
