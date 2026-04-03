import { useState, useEffect } from 'react';
import { useNotification } from '../../../hooks/useNotification.jsx';
import { secureApiCall } from '../../../utils/authService';
import logger from '../../../shared/utils/logger';
import ErrorModal from '../../../components/Modal/ErrorModal';
import BarcodeScanner from '../../../components/BarcodeScanner/BarcodeScanner';
import styles from './UserRecipeForm.module.css';

const GOALS = [
  { value: 'weight_loss', label: 'Perte de poids' },
  { value: 'muscle_gain', label: 'Prise de masse' },
  { value: 'maintenance', label: 'Maintien' },
  { value: 'performance', label: 'Performance' },
  { value: 'health', label: 'Santé' },
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Snack' },
];

const TAGS = [
  { value: 'quick', label: 'Rapide (<30min)' },
  { value: 'no_sugar', label: 'Sans sucre' },
  { value: 'high_protein', label: 'Riche en protéines' },
  { value: 'low_carb', label: 'Faible en glucides' },
  { value: 'low_fat', label: 'Faible en gras' },
  { value: 'budget_friendly', label: 'Économique' },
  { value: 'family_friendly', label: 'Familial' },
  { value: 'meal_prep', label: 'Meal prep' },
];

const DIET_TYPES = [
  { value: 'none', label: 'Aucun' },
  { value: 'vegetarian', label: 'Végétarien' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarien' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten_free', label: 'Sans gluten' },
  { value: 'lactose_free', label: 'Sans lactose' },
];

const UNITS = [
  { group: 'Poids',   options: ['g', 'kg', 'mg'] },
  { group: 'Volume',  options: ['ml', 'cl', 'L'] },
  { group: 'Unités',  options: ['pièce', 'tranche', 'portion', 'poignée', 'pincée'] },
  { group: 'Mesures', options: ['c. à café', 'c. à soupe', 'tasse'] },
];

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ArrowLeftIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const ScanIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5H1v4h2V5zm0 10H1v4h2v-4zm18-10h2v4h-2V5zm0 10h2v4h-2v-4zM7 4h1v16H7zm3 0h1v16h-1zm4 0h2v16h-2z"/>
  </svg>
);

// Convertit une quantité + unité en facteur /100g pour calculer les macros
function toGramsFactor(quantity, unit) {
  const q = parseFloat(quantity);
  if (!q || isNaN(q)) return null;
  switch (unit) {
    case 'g':   return q / 100;
    case 'kg':  return q * 10;
    case 'mg':  return q / 100000;
    case 'ml':  return q / 100;       // approximation densité = 1
    case 'cl':  return q / 10;
    case 'L':   return q * 10;
    default:    return null;          // pièce, tranche… non calculable
  }
}

function calcNutritionFromIngredients(ingredients) {
  const total = { calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0 };
  let hasAny = false;
  for (const ing of ingredients) {
    if (!ing.nutritionPer100g) continue;
    const factor = toGramsFactor(ing.quantity, ing.unit);
    if (factor === null) continue;
    total.calories  += (ing.nutritionPer100g.calories  || 0) * factor;
    total.proteins  += (ing.nutritionPer100g.proteins  || 0) * factor;
    total.carbs     += (ing.nutritionPer100g.carbs     || 0) * factor;
    total.fats      += (ing.nutritionPer100g.fats      || 0) * factor;
    total.fiber     += (ing.nutritionPer100g.fiber     || 0) * factor;
    hasAny = true;
  }
  if (!hasAny) return null;
  return {
    calories: Math.round(total.calories),
    proteins: Math.round(total.proteins * 10) / 10,
    carbs:    Math.round(total.carbs    * 10) / 10,
    fats:     Math.round(total.fats     * 10) / 10,
    fiber:    Math.round(total.fiber    * 10) / 10,
  };
}

export default function UserRecipeForm({ recipe, onBack, onSave }) {
  const notify = useNotification();
  const isEdit = Boolean(recipe?._id);

  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanningIngredientIndex, setScanningIngredientIndex] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFromUrl, setUploadingFromUrl] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState(null);
  const [autoNutrition, setAutoNutrition] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    category: 'salty',
    difficulty: 'medium',
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    nutrition: { calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0 },
    goal: [],
    mealType: [],
    tags: [],
    dietType: ['none'],
    ingredients: [{ name: '', quantity: '', unit: 'g', optional: false }],
    instructions: [''],
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        ...recipe,
        ingredients: recipe.ingredients?.length > 0
          ? recipe.ingredients.map(ing => ({ ...ing, unit: ing.unit || 'g' }))
          : [{ name: '', quantity: '', unit: 'g', optional: false }],
        instructions: recipe.instructions?.length > 0 ? recipe.instructions : [''],
      });
    }
  }, [recipe]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    if (type === 'number') finalValue = value === '' ? 0 : parseInt(value);
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : finalValue }));
  };

  const handleNutritionChange = (e) => {
    const { name, value } = e.target;
    setAutoNutrition(false); // l'utilisateur prend la main
    setFormData(prev => ({
      ...prev,
      nutrition: { ...prev.nutrition, [name]: value === '' ? '' : parseFloat(value) },
    }));
  };

  const resetToAutoNutrition = () => {
    const calc = calcNutritionFromIngredients(formData.ingredients);
    if (calc) {
      setFormData(prev => ({ ...prev, nutrition: calc }));
      setAutoNutrition(true);
    }
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    let finalValue = value;
    if (field === 'quantity') finalValue = value === '' ? '' : parseFloat(value) || 0;
    newIngredients[index] = { ...newIngredients[index], [field]: finalValue };

    // Recalcul auto si quantity ou unit changent et qu'on est en mode auto
    if ((field === 'quantity' || field === 'unit') && autoNutrition) {
      const calc = calcNutritionFromIngredients(newIngredients);
      if (calc) {
        setFormData(prev => ({ ...prev, ingredients: newIngredients, nutrition: calc }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: 'g', optional: false }],
    }));
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      const updated = formData.ingredients.filter((_, i) => i !== index);
      if (autoNutrition) {
        const calc = calcNutritionFromIngredients(updated);
        setFormData(prev => ({ ...prev, ingredients: updated, nutrition: calc || prev.nutrition }));
      } else {
        setFormData(prev => ({ ...prev, ingredients: updated }));
      }
    }
  };

  const openScannerForIngredient = (index) => {
    setScanningIngredientIndex(index);
    setScannerOpen(true);
  };

  const handleIngredientProductFound = (product) => {
    if (scanningIngredientIndex === null) return;
    const newIngredients = [...formData.ingredients];

    // Parse product quantity to suggest a default (e.g. "300g" → 300)
    const parsedQty = parseInt(product.quantity) || 100;

    newIngredients[scanningIngredientIndex] = {
      ...newIngredients[scanningIngredientIndex],
      name: product.name + (product.brand ? ` (${product.brand})` : ''),
      quantity: parsedQty,
      unit: 'g',
      nutritionPer100g: product.nutrition,
      scannedImage: product.imageUrl || null,
      scannedProductQty: product.quantity || null,
    };

    // Active le mode auto et recalcule
    const calc = calcNutritionFromIngredients(newIngredients);
    setAutoNutrition(!!calc);
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients,
      ...(calc ? { nutrition: calc } : {}),
    }));

    notify.success(
      calc
        ? `${product.name} ajouté (${parsedQty}g) — macros recalculées`
        : `${product.name} ajouté — entrez la quantité pour calculer les macros`
    );
    setScanningIngredientIndex(null);
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData(prev => ({ ...prev, instructions: [...prev.instructions, ''] }));
  };

  const removeInstruction = (index) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({ ...prev, instructions: prev.instructions.filter((_, i) => i !== index) }));
    }
  };

  // Upload automatique dès la sélection du fichier
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Veuillez sélectionner une image valide');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    setUploadingImage(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const response = await secureApiCall('/upload/recipe-image', { method: 'POST', body: fd });
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
        notify.success('Image ajoutée !');
      } else {
        setError({ title: "Erreur d'upload", message: data.message || 'Impossible d\'uploader l\'image.', details: response.status !== 200 ? `HTTP ${response.status}` : null });
      }
    } catch (err) {
      logger.error('Erreur upload image:', err);
      setError({ title: "Erreur d'upload", message: 'Erreur lors de l\'upload. Vérifiez votre connexion.', details: err.message });
    } finally {
      setUploadingImage(false);
    }
    // Reset input pour permettre de resélectionner le même fichier
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImageUrlInput('');
  };

  const handleUploadFromUrl = async () => {
    if (!imageUrlInput.trim()) { notify.error("Veuillez entrer une URL d'image"); return; }
    setUploadingFromUrl(true);
    setError(null);
    try {
      const response = await secureApiCall('/upload/from-url', { method: 'POST', body: JSON.stringify({ url: imageUrlInput }) });
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
        notify.success('Image importée avec succès !');
        setImageUrlInput('');
      } else {
        setError({ title: "Erreur d'import", message: data.message || 'Impossible d\'importer l\'image depuis cette URL.', details: response.status !== 200 ? `HTTP ${response.status}` : null });
      }
    } catch (err) {
      logger.error('Erreur upload depuis URL:', err);
      setError({ title: "Erreur d'import", message: 'Vérifiez que l\'URL pointe vers une image valide.', details: err.message });
    } finally {
      setUploadingFromUrl(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!formData.title || !formData.description) {
      notify.error('Veuillez remplir le titre et la description');
      setSaving(false);
      return;
    }
    if (formData.ingredients.some(ing => !ing.name || !ing.quantity || !ing.unit)) {
      notify.error('Veuillez remplir tous les ingrédients ou les supprimer');
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
      const response = await secureApiCall(url, { method, body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) {
        notify.success(isEdit ? 'Recette modifiée !' : 'Recette créée !');
        if (onSave) onSave(data.recipe);
      } else {
        notify.error(data.message || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      logger.error('Erreur sauvegarde recette:', err);
      notify.error("Erreur lors de l'enregistrement de la recette");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => { setScannerOpen(false); setScanningIngredientIndex(null); }}
        onProductFound={handleIngredientProductFound}
      />

      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={onBack} className={styles.backBtn}>
            <ArrowLeftIcon size={20} />
            Retour
          </button>
          <h1>{isEdit ? 'Modifier la recette' : 'Nouvelle recette'}</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* ── 1. Infos essentielles ───────────────────────────────────── */}
          <section className={styles.section}>
            <h2>Infos essentielles</h2>

            <div className={styles.formGroup}>
              <label>Titre *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ex : Bowl Protéine du Champion"
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
              <label>Photo</label>
              {formData.image ? (
                <div className={styles.imagePreviewContainer}>
                  <img src={formData.image} alt="Aperçu" className={styles.imagePreview} />
                  <button type="button" onClick={handleRemoveImage} className={styles.removeImageBtn}>
                    Supprimer la photo
                  </button>
                  <p className={styles.hint}>✅ Photo ajoutée — la recette peut être proposée au public</p>
                </div>
              ) : (
                <div className={styles.imageUploadArea}>
                  <label className={styles.fileDropZone}>
                    {uploadingImage ? (
                      <span className={styles.uploadingState}>⏳ Upload en cours...</span>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.uploadIcon}>
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span className={styles.dropZoneLabel}>Cliquez pour choisir une photo</span>
                        <span className={styles.dropZoneHint}>JPG, PNG, WebP · 5 MB max</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                      className={styles.hiddenFileInput}
                    />
                  </label>

                  <div className={styles.orDivider}><span>ou importer depuis une URL</span></div>

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
                      {uploadingFromUrl ? 'Import...' : 'Importer'}
                    </button>
                  </div>
                  <p className={styles.hint}>⚠️ Une photo sera requise pour proposer la recette au public</p>
                </div>
              )}
            </div>
          </section>

          {/* ── 2. Ingrédients ─────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2>Ingrédients</h2>

            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className={`${styles.ingredientRow} ${ingredient.nutritionPer100g ? styles.ingredientScanned : ''}`}>
                {/* Scanned product thumbnail */}
                {ingredient.scannedImage && (
                  <img src={ingredient.scannedImage} alt="" className={styles.ingredientThumb} />
                )}

                <div className={styles.ingredientFields}>
                  <div className={styles.ingredientNameWrapper}>
                    <input
                      type="text"
                      placeholder="Nom de l'ingrédient"
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={styles.scanInlineBtn}
                      onClick={() => openScannerForIngredient(index)}
                      title="Scanner ce produit"
                    >
                      <ScanIcon />
                    </button>
                  </div>

                  <div className={styles.ingredientQtyRow}>
                    <input
                      type="number"
                      placeholder="Qté"
                      value={ingredient.quantity}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      required
                      min="0"
                      step="0.1"
                      className={styles.qtyInput}
                    />

                    <select
                      value={ingredient.unit}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      className={styles.unitSelect}
                      required
                    >
                      {UNITS.map(group => (
                        <optgroup key={group.group} label={group.group}>
                          {group.options.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={ingredient.optional}
                        onChange={(e) => handleIngredientChange(index, 'optional', e.target.checked)}
                      />
                      Opt.
                    </label>

                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className={styles.removeBtn}
                      disabled={formData.ingredients.length === 1}
                      aria-label="Supprimer cet ingrédient"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  {/* Scanned product: quantity presets + per-100g info */}
                  {ingredient.nutritionPer100g && (
                    <div className={styles.ingredientScanInfo}>
                      <div className={styles.ingredientPresets}>
                        {[50, 100, 150, 200, 250].map(g => (
                          <button
                            key={g}
                            type="button"
                            className={`${styles.ingredientPreset} ${Number(ingredient.quantity) === g ? styles.ingredientPresetActive : ''}`}
                            onClick={() => handleIngredientChange(index, 'quantity', g)}
                          >
                            {g}g
                          </button>
                        ))}
                      </div>
                      <span className={styles.ingredientPer100}>
                        Pour 100g : {ingredient.nutritionPer100g.calories}kcal · {ingredient.nutritionPer100g.proteins}g prot · {ingredient.nutritionPer100g.carbs}g gluc · {ingredient.nutritionPer100g.fats}g lip
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addIngredient} className={styles.addBtn}>
              + Ajouter un ingrédient
            </button>
          </section>

          {/* ── 3. Instructions ────────────────────────────────────────── */}
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
                  aria-label="Supprimer cette étape"
                >
                  <CloseIcon />
                </button>
              </div>
            ))}

            <button type="button" onClick={addInstruction} className={styles.addBtn}>
              + Ajouter une étape
            </button>
          </section>

          {/* ── 4. Infos pratiques ─────────────────────────────────────── */}
          <section className={styles.section}>
            <h2>Infos pratiques</h2>

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
                <label>Préparation (min)</label>
                <input type="number" name="prepTime" value={formData.prepTime} onChange={handleChange} min="0" required />
              </div>
              <div className={styles.formGroup}>
                <label>Cuisson (min)</label>
                <input type="number" name="cookTime" value={formData.cookTime} onChange={handleChange} min="0" required />
              </div>
              <div className={styles.formGroup}>
                <label>Portions</label>
                <input type="number" name="servings" value={formData.servings} onChange={handleChange} min="1" required />
              </div>
            </div>
          </section>

          {/* ── 5. Valeurs nutritionnelles ─────────────────────────────── */}
          <section className={styles.section}>
            <h2>
              Valeurs nutritionnelles
              <span className={styles.sectionBadge}>pour la recette complète</span>
              {autoNutrition && (
                <span className={styles.autoBadge}>⚡ Calculé auto</span>
              )}
            </h2>

            {autoNutrition ? (
              <p className={styles.autoHint}>
                Les macros sont calculées à partir de vos ingrédients scannés.{' '}
                <button type="button" className={styles.manualBtn} onClick={() => setAutoNutrition(false)}>
                  Modifier manuellement
                </button>
              </p>
            ) : (
              calcNutritionFromIngredients(formData.ingredients) && (
                <p className={styles.autoHint}>
                  <button type="button" className={styles.manualBtn} onClick={resetToAutoNutrition}>
                    ⚡ Restaurer le calcul automatique
                  </button>
                </p>
              )
            )}

            <div className={styles.nutritionGrid}>
              {[
                { name: 'calories', label: 'Calories', unit: 'kcal' },
                { name: 'proteins', label: 'Protéines', unit: 'g' },
                { name: 'carbs', label: 'Glucides', unit: 'g' },
                { name: 'fats', label: 'Lipides', unit: 'g' },
                { name: 'fiber', label: 'Fibres', unit: 'g' },
              ].map(({ name, label, unit }) => (
                <div key={name} className={styles.formGroup}>
                  <label>{label} <span className={styles.unitLabel}>({unit})</span></label>
                  <input
                    type="number"
                    name={name}
                    value={formData.nutrition[name]}
                    onChange={handleNutritionChange}
                    min="0"
                    step="0.1"
                    className={autoNutrition ? styles.autoInput : ''}
                    readOnly={autoNutrition}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ── 6. Classification ──────────────────────────────────────── */}
          <section className={styles.section}>
            <h2>Classification</h2>

            <h3 className={styles.subGroupTitle}>Objectifs</h3>
            <div className={styles.pillsGrid}>
              {GOALS.map(goal => (
                <button key={goal.value} type="button"
                  className={`${styles.pill} ${formData.goal.includes(goal.value) ? styles.pillActive : ''}`}
                  onClick={() => handleArrayToggle('goal', goal.value)}>
                  {goal.label}
                </button>
              ))}
            </div>

            <h3 className={styles.subGroupTitle}>Types de repas</h3>
            <div className={styles.pillsGrid}>
              {MEAL_TYPES.map(meal => (
                <button key={meal.value} type="button"
                  className={`${styles.pill} ${formData.mealType.includes(meal.value) ? styles.pillActive : ''}`}
                  onClick={() => handleArrayToggle('mealType', meal.value)}>
                  {meal.label}
                </button>
              ))}
            </div>

            <h3 className={styles.subGroupTitle}>Tags</h3>
            <div className={styles.pillsGrid}>
              {TAGS.map(tag => (
                <button key={tag.value} type="button"
                  className={`${styles.pill} ${formData.tags.includes(tag.value) ? styles.pillActive : ''}`}
                  onClick={() => handleArrayToggle('tags', tag.value)}>
                  {tag.label}
                </button>
              ))}
            </div>

            <h3 className={styles.subGroupTitle}>Régimes alimentaires</h3>
            <div className={styles.pillsGrid}>
              {DIET_TYPES.map(diet => (
                <button key={diet.value} type="button"
                  className={`${styles.pill} ${formData.dietType.includes(diet.value) ? styles.pillActive : ''}`}
                  onClick={() => handleArrayToggle('dietType', diet.value)}>
                  {diet.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Sticky footer ──────────────────────────────────────────── */}
          <div className={styles.stickyFooter}>
            <button type="button" onClick={onBack} className={styles.cancelBtn}>
              Annuler
            </button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Enregistrement...' : (isEdit ? 'Modifier la recette' : 'Créer la recette')}
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
        onRetry={null}
      />
    </>
  );
}
