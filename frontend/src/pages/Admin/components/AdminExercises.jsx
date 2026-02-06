import { useState } from 'react';
import { createExercise } from '../../../shared/api/admin';
import styles from '../AdminPage.module.css';

const CATEGORIES = ['muscu', 'cardio', 'etirement', 'hiit', 'yoga', 'meditation', 'natation'];
const TYPES = ['muscu', 'poids-du-corps', 'cardio', 'etirement', 'hiit', 'yoga', 'meditation', 'natation'];
const OBJECTIVES = ['force', 'hypertrophie', 'endurance', 'souplesse', 'relaxation', 'cardio', 'equilibre'];
const DIFFICULTIES = ['debutant', 'intermediaire', 'avance'];

export default function AdminExercises({ notify }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  const [currentTip, setCurrentTip] = useState('');
  const [currentEquipment, setCurrentEquipment] = useState('');
  const [currentSecondaryMuscle, setCurrentSecondaryMuscle] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.primaryMuscle || !formData.explanation) {
      notify.error('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);
    try {
      const response = await createExercise(formData);
      if (response.success) {
        notify.success('Exercice créé avec succès !');
        // Reset form
        setFormData({
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
        });
      }
    } catch (error) {
      console.error('Erreur création exercice:', error);
      console.error('Response data:', error.response?.data);
      console.error('Données envoyées:', formData);
      notify.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Créer un Exercice</h2>
      </div>

      <form onSubmit={handleSubmit} className={styles.exerciseForm}>
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
          <input
            type="text"
            name="primaryMuscle"
            value={formData.primaryMuscle}
            onChange={handleInputChange}
            required
            placeholder="Ex: Pectoraux"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Muscles secondaires</label>
          <div className={styles.addItemGroup}>
            <input
              type="text"
              value={currentSecondaryMuscle}
              onChange={(e) => setCurrentSecondaryMuscle(e.target.value)}
              placeholder="Ajouter un muscle secondaire"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryMuscle())}
            />
            <button type="button" onClick={addSecondaryMuscle}>Ajouter</button>
          </div>
          <div className={styles.tagList}>
            {formData.secondaryMuscles.map((muscle, index) => (
              <span key={index} className={styles.tag}>
                {muscle}
                <button type="button" onClick={() => removeSecondaryMuscle(index)}>×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className={styles.formGroup}>
          <label>Équipement</label>
          <div className={styles.addItemGroup}>
            <input
              type="text"
              value={currentEquipment}
              onChange={(e) => setCurrentEquipment(e.target.value)}
              placeholder="Ajouter un équipement"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
            />
            <button type="button" onClick={addEquipment}>Ajouter</button>
          </div>
          <div className={styles.tagList}>
            {formData.equipment.map((equip, index) => (
              <span key={index} className={styles.tag}>
                {equip}
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
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTip())}
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

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Création...' : 'Créer l\'exercice'}
        </button>
      </form>
    </div>
  );
}
