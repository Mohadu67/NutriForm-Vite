import { useState, useEffect } from 'react';
import { getAllExercises, createExercise, updateExercise, deleteExercise } from '../../../shared/api/admin';
import ConfirmModal from '../../../components/Modal/ConfirmModal';
import styles from './AdminExercises.module.css';

const CATEGORIES = ['muscu', 'cardio', 'etirement', 'hiit', 'yoga', 'meditation', 'natation'];
const TYPES = ['muscu', 'poids-du-corps', 'cardio', 'etirement', 'hiit', 'yoga', 'meditation', 'natation'];
const OBJECTIVES = ['force', 'hypertrophie', 'endurance', 'souplesse', 'relaxation', 'cardio', 'equilibre'];
const DIFFICULTIES = ['debutant', 'intermediaire', 'avance'];

const MUSCLES = [
  { value: 'pectoraux', label: 'Pectoraux' },
  { value: 'epaules', label: 'Épaules' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'avant-bras', label: 'Avant-bras' },
  { value: 'abdos', label: 'Abdominaux' },
  { value: 'obliques', label: 'Obliques' },
  { value: 'dos-superieur', label: 'Dos supérieur (trapèzes)' },
  { value: 'dos-inferieur', label: 'Dos inférieur (dorsaux)' },
  { value: 'quadriceps', label: 'Quadriceps' },
  { value: 'ischios', label: 'Ischio-jambiers' },
  { value: 'fessiers', label: 'Fessiers' },
  { value: 'adducteurs', label: 'Adducteurs' },
  { value: 'abducteurs', label: 'Abducteurs' },
  { value: 'mollets', label: 'Mollets' },
  { value: 'core', label: 'Core / Gainage' },
];

const EQUIPMENTS = [
  { value: 'aucun', label: 'Aucun (poids du corps)' },
  { value: 'halteres', label: 'Haltères' },
  { value: 'barre', label: 'Barre' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Câble / Poulie' },
  { value: 'elastique', label: 'Élastique / Bande' },
  { value: 'banc', label: 'Banc' },
  { value: 'barre-traction', label: 'Barre de traction' },
  { value: 'swiss-ball', label: 'Swiss ball' },
  { value: 'trx', label: 'TRX / Sangles' },
  { value: 'medecine-ball', label: 'Médecine ball' },
  { value: 'corde-sauter', label: 'Corde à sauter' },
  { value: 'rameur', label: 'Rameur' },
  { value: 'velo', label: 'Vélo / Spinning' },
  { value: 'tapis', label: 'Tapis de course' },
  { value: 'step', label: 'Step' },
  { value: 'foam-roller', label: 'Foam roller' },
  { value: 'anneaux', label: 'Anneaux' },
  { value: 'parallettes', label: 'Parallettes' },
  { value: 'disque', label: 'Disque / Poids' },
  { value: 'gilet-leste', label: 'Gilet lesté' },
];

const INITIAL_FORM_DATA = {
  name: '',
  category: 'muscu',
  type: [],
  objectives: [],
  primaryMuscle: '',
  secondaryMuscles: [],
  equipment: [],
  difficulty: 'intermediaire',
  explanation: '',
  videoUrl: '',
  tips: [],
  restTime: 60,
  recommendedSets: 3,
  recommendedReps: '8-12',
  mainImage: '',
};

export default function AdminExercises({ notify }) {
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentExerciseId, setCurrentExerciseId] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [currentTip, setCurrentTip] = useState('');
  const [currentEquipment, setCurrentEquipment] = useState('');
  const [currentSecondaryMuscle, setCurrentSecondaryMuscle] = useState('');

  // Modal de confirmation pour la suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);

  // Load exercises on mount
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const response = await getAllExercises();
      if (response.success) {
        setExercises(response.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement exercices:', error);
      notify.error('Erreur lors du chargement des exercices');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const addTip = () => {
    if (currentTip.trim()) {
      setFormData(prev => ({
        ...prev,
        tips: [...prev.tips, currentTip.trim()]
      }));
      setCurrentTip('');
    }
  };

  const removeTip = (index) => {
    setFormData(prev => ({
      ...prev,
      tips: prev.tips.filter((_, i) => i !== index)
    }));
  };

  const addEquipment = () => {
    if (currentEquipment.trim()) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, currentEquipment.trim()]
      }));
      setCurrentEquipment('');
    }
  };

  const removeEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  const addSecondaryMuscle = () => {
    if (currentSecondaryMuscle.trim()) {
      setFormData(prev => ({
        ...prev,
        secondaryMuscles: [...prev.secondaryMuscles, currentSecondaryMuscle.trim()]
      }));
      setCurrentSecondaryMuscle('');
    }
  };

  const removeSecondaryMuscle = (index) => {
    setFormData(prev => ({
      ...prev,
      secondaryMuscles: prev.secondaryMuscles.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (exercise) => {
    setEditMode(true);
    setCurrentExerciseId(exercise._id);
    setFormData({
      name: exercise.name || '',
      category: exercise.category || 'muscu',
      type: exercise.type || [],
      objectives: exercise.objectives || [],
      primaryMuscle: exercise.primaryMuscle || '',
      secondaryMuscles: exercise.secondaryMuscles || [],
      equipment: exercise.equipment || [],
      difficulty: exercise.difficulty || 'intermediaire',
      explanation: exercise.explanation || '',
      videoUrl: exercise.videoUrl || '',
      tips: exercise.tips || [],
      restTime: exercise.restTime || 60,
      recommendedSets: exercise.recommendedSets || 3,
      recommendedReps: exercise.recommendedReps || '8-12',
      mainImage: exercise.mainImage || '',
    });
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      document.querySelector(`.${styles.exerciseForm}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteClick = (exercise) => {
    setExerciseToDelete(exercise);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exerciseToDelete) return;

    setLoading(true);
    try {
      const response = await deleteExercise(exerciseToDelete._id);
      if (response.success) {
        notify.success('Exercice supprimé avec succès !');
        loadExercises();
      }
    } catch (error) {
      console.error('Erreur suppression exercice:', error);
      notify.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setExerciseToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setExerciseToDelete(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditMode(false);
    setCurrentExerciseId(null);
    setFormData(INITIAL_FORM_DATA);
    setCurrentTip('');
    setCurrentEquipment('');
    setCurrentSecondaryMuscle('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.primaryMuscle || !formData.explanation) {
      notify.error('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editMode && currentExerciseId) {
        response = await updateExercise(currentExerciseId, formData);
        if (response.success) {
          notify.success('Exercice modifié avec succès !');
        }
      } else {
        response = await createExercise(formData);
        if (response.success) {
          notify.success('Exercice créé avec succès !');
        }
      }

      if (response.success) {
        handleCancel();
        loadExercises();
      }
    } catch (error) {
      console.error('Erreur exercice:', error);
      notify.error(error.response?.data?.message || 'Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = !searchQuery ||
      ex.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.section}>
      {/* Header avec bouton nouveau */}
      <div className={styles.sectionHeader}>
        <h2>Gestion des Exercices</h2>
        <button
          className={styles.createButton}
          onClick={() => {
            handleCancel();
            setShowForm(!showForm);
          }}
        >
          <span className={styles.buttonIcon}>{showForm ? '✕' : '+'}</span>
          <span className={styles.buttonText}>{showForm ? 'Fermer' : 'Nouvel exercice'}</span>
        </button>
      </div>

      {/* Formulaire création/édition */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.exerciseForm}>
          <h3>{editMode ? 'Modifier l\'exercice' : 'Créer un exercice'}</h3>

          {/* Basic Info */}
          <div className={styles.formGroup}>
            <label>Nom de l'exercice *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Ex: Pompes"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Catégorie *</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Difficulté</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
                {DIFFICULTIES.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Types */}
          <div className={styles.formGroup}>
            <label>Types</label>
            <div className={styles.checkboxGroup}>
              {TYPES.map(type => (
                <label key={type} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.type.includes(type)}
                    onChange={() => handleCheckboxChange('type', type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Objectives */}
          <div className={styles.formGroup}>
            <label>Objectifs</label>
            <div className={styles.checkboxGroup}>
              {OBJECTIVES.map(obj => (
                <label key={obj} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.objectives.includes(obj)}
                    onChange={() => handleCheckboxChange('objectives', obj)}
                  />
                  {obj}
                </label>
              ))}
            </div>
          </div>

          {/* Muscles */}
          <div className={styles.formGroup}>
            <label>Muscle principal *</label>
            <select
              name="primaryMuscle"
              value={formData.primaryMuscle}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Sélectionner --</option>
              {MUSCLES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Muscles secondaires</label>
            <div className={styles.addItemGroup}>
              <select
                value={currentSecondaryMuscle}
                onChange={(e) => setCurrentSecondaryMuscle(e.target.value)}
              >
                <option value="">-- Ajouter un muscle --</option>
                {MUSCLES
                  .filter(m => m.value !== formData.primaryMuscle && !formData.secondaryMuscles.includes(m.value))
                  .map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))
                }
              </select>
              <button type="button" onClick={addSecondaryMuscle}>Ajouter</button>
            </div>
            <div className={styles.tagList}>
              {formData.secondaryMuscles.map((muscle, index) => (
                <span key={index} className={styles.tag}>
                  {MUSCLES.find(m => m.value === muscle)?.label || muscle}
                  <button type="button" onClick={() => removeSecondaryMuscle(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className={styles.formGroup}>
            <label>Équipement</label>
            <div className={styles.addItemGroup}>
              <select
                value={currentEquipment}
                onChange={(e) => setCurrentEquipment(e.target.value)}
              >
                <option value="">-- Ajouter un équipement --</option>
                {EQUIPMENTS
                  .filter(eq => !formData.equipment.includes(eq.value))
                  .map(eq => (
                    <option key={eq.value} value={eq.value}>{eq.label}</option>
                  ))
                }
              </select>
              <button type="button" onClick={addEquipment}>Ajouter</button>
            </div>
            <div className={styles.tagList}>
              {formData.equipment.map((equip, index) => (
                <span key={index} className={styles.tag}>
                  {EQUIPMENTS.find(eq => eq.value === equip)?.label || equip}
                  <button type="button" onClick={() => removeEquipment(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className={styles.formGroup}>
            <label>Explication *</label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleInputChange}
              required
              placeholder="Décrivez comment réaliser l'exercice..."
              rows={6}
            />
          </div>

          {/* Tips */}
          <div className={styles.formGroup}>
            <label>Conseils</label>
            <div className={styles.addItemGroup}>
              <input
                type="text"
                value={currentTip}
                onChange={(e) => setCurrentTip(e.target.value)}
                placeholder="Ajouter un conseil"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTip())}
              />
              <button type="button" onClick={addTip}>Ajouter</button>
            </div>
            <div className={styles.tagList}>
              {formData.tips.map((tip, index) => (
                <span key={index} className={styles.tag}>
                  {tip}
                  <button type="button" onClick={() => removeTip(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Séries recommandées</label>
              <input
                type="number"
                name="recommendedSets"
                value={formData.recommendedSets}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Répétitions recommandées</label>
              <input
                type="text"
                name="recommendedReps"
                value={formData.recommendedReps}
                onChange={handleInputChange}
                placeholder="Ex: 8-12"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Temps de repos (secondes)</label>
              <input
                type="number"
                name="restTime"
                value={formData.restTime}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>

          {/* Media */}
          <div className={styles.formGroup}>
            <label>URL de l'image principale</label>
            <input
              type="url"
              name="mainImage"
              value={formData.mainImage}
              onChange={handleInputChange}
              placeholder="https://res.cloudinary.com/..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>URL vidéo YouTube (optionnel)</label>
            <input
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleInputChange}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : (editMode ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      )}

      {/* Filtres et recherche */}
      <div className={styles.filtersRow}>
        <input
          type="text"
          placeholder="🔍 Rechercher un exercice..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Liste des exercices */}
      <div className={styles.exercisesList}>
        {loading && !exercises.length ? (
          <div className={styles.loading}>Chargement...</div>
        ) : filteredExercises.length === 0 ? (
          <div className={styles.emptyState}>
            Aucun exercice trouvé
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Muscle principal</th>
                <th>Difficulté</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExercises.map(exercise => (
                <tr key={exercise._id}>
                  <td>
                    {exercise.mainImage ? (
                      <img
                        src={exercise.mainImage}
                        alt={exercise.name}
                        className={styles.exerciseThumb}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.noImage}>—</span>
                    )}
                  </td>
                  <td>
                    <strong>{exercise.name}</strong>
                    {exercise.exoId && <span className={styles.exoId}> ({exercise.exoId})</span>}
                  </td>
                  <td>
                    <span className={styles.badge}>{exercise.category}</span>
                  </td>
                  <td>{exercise.primaryMuscle}</td>
                  <td>
                    <span className={`${styles.difficulty} ${styles[exercise.difficulty]}`}>
                      {exercise.difficulty}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEdit(exercise)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteClick(exercise)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.exercisesCount}>
        {filteredExercises.length} exercice(s) affiché(s) sur {exercises.length} total
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'exercice "${exerciseToDelete?.name}" ?\n\nCette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}
