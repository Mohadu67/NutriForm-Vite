import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureApiCall } from '../../../utils/authService';
import logger from '../../../shared/utils/logger';
import CycleEditor from './CycleEditor';
import PendingPrograms from './PendingPrograms';
import styles from './ProgramsAdmin.module.css';

export default function ProgramsAdmin() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState(null);
  const [showPending, setShowPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'hiit',
    difficulty: 'intermédiaire',
    estimatedDuration: 0,
    estimatedCalories: 0,
    tags: '',
    muscleGroups: '',
    equipment: '',
    isPublic: true,
    isActive: true,
    instructions: '',
    tips: '',
    cycles: [],
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await secureApiCall('/programs/admin/all', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        muscleGroups: formData.muscleGroups.split(',').map((m) => m.trim()).filter(Boolean),
        equipment: formData.equipment.split(',').map((e) => e.trim()).filter(Boolean),
        estimatedDuration: parseInt(formData.estimatedDuration),
        estimatedCalories: parseInt(formData.estimatedCalories),
      };

      console.log('📤 Envoi du programme:', payload);
      console.log('📊 Nombre de cycles:', payload.cycles.length);

      const url = editingProgram
        ? `/programs/admin/${editingProgram._id}`
        : '/programs/admin/create';

      const method = editingProgram ? 'PATCH' : 'POST';

      console.log(`🌐 Requête ${method} vers ${url}`);

      const response = await secureApiCall(url, {
        method,
        body: JSON.stringify(payload),
      });

      console.log('📥 Statut de la réponse:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Succès:', data);
        alert(editingProgram ? 'Programme mis à jour ✅' : 'Programme créé ✅');
        fetchPrograms();
        resetForm();
      } else {
        const error = await response.json();
        console.error('❌ Erreur serveur:', error);
        alert('Erreur: ' + (error.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('💥 Exception:', error);
      logger.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name || '',
      description: program.description || '',
      type: program.type || 'hiit',
      difficulty: program.difficulty || 'intermédiaire',
      estimatedDuration: program.estimatedDuration || 0,
      estimatedCalories: program.estimatedCalories || 0,
      tags: (program.tags || []).join(', '),
      muscleGroups: (program.muscleGroups || []).join(', '),
      equipment: (program.equipment || []).join(', '),
      isPublic: program.isPublic !== undefined ? program.isPublic : true,
      isActive: program.isActive !== undefined ? program.isActive : true,
      instructions: program.instructions || '',
      tips: program.tips || '',
      cycles: program.cycles || [],
    });
  };

  const handleDelete = async (programId) => {
    if (!confirm('Voulez-vous vraiment supprimer ce programme ?')) {
      return;
    }

    try {
      const response = await secureApiCall(`/programs/admin/${programId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Programme supprimé');
        fetchPrograms();
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setEditingProgram(null);
    setFormData({
      name: '',
      description: '',
      type: 'hiit',
      difficulty: 'intermédiaire',
      estimatedDuration: 0,
      estimatedCalories: 0,
      tags: '',
      muscleGroups: '',
      equipment: '',
      isPublic: true,
      isActive: true,
      instructions: '',
      tips: '',
      cycles: [],
    });
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.admin}>
      <button
        onClick={() => navigate('/admin')}
        className={styles.backButton}
        aria-label="Retour au dashboard admin"
      >
        ← Retour au dashboard
      </button>

      <div className={styles.headerBar}>
        <h1>Gestion des Programmes</h1>
        <button onClick={() => setShowPending(true)} className={styles.pendingButton}>
          📋 Programmes en attente
        </button>
      </div>

      {showPending && <PendingPrograms onClose={() => setShowPending(false)} />}

      <div className={styles.content}>
        {/* Formulaire */}
        <div className={styles.formSection}>
          <h2>{editingProgram ? 'Modifier le programme' : 'Créer un programme'}</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Nom *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="hiit">HIIT</option>
                  <option value="circuit">Circuit</option>
                  <option value="tabata">Tabata</option>
                  <option value="superset">Superset</option>
                  <option value="amrap">AMRAP</option>
                  <option value="emom">EMOM</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="difficulty">Difficulté</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                >
                  <option value="débutant">Débutant</option>
                  <option value="intermédiaire">Intermédiaire</option>
                  <option value="avancé">Avancé</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="estimatedDuration">Durée (min)</label>
                <input
                  type="number"
                  id="estimatedDuration"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="estimatedCalories">Calories</label>
                <input
                  type="number"
                  id="estimatedCalories"
                  name="estimatedCalories"
                  value={formData.estimatedCalories}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags">Tags (séparés par des virgules)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="hiit, cardio, full-body"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="instructions">Instructions</label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tips">Conseils</label>
              <textarea
                id="tips"
                name="tips"
                value={formData.tips}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                Public
              </label>

              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Actif
              </label>
            </div>

            {/* Éditeur de cycles */}
            <div className={styles.formGroup}>
              <label>Cycles d'entraînement</label>
              <CycleEditor
                cycles={formData.cycles}
                onChange={(updatedCycles) => setFormData(prev => ({ ...prev, cycles: updatedCycles }))}
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                {editingProgram ? 'Mettre à jour' : 'Créer'}
              </button>
              {editingProgram && (
                <button type="button" onClick={resetForm} className={styles.cancelButton}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Liste des programmes */}
        <div className={styles.listSection}>
          <h2>Programmes existants ({programs.length})</h2>

          <div className={styles.programsList}>
            {programs.map((program) => (
              <div key={program._id} className={styles.programCard}>
                <div className={styles.programHeader}>
                  <h3>{program.name}</h3>
                  <div className={styles.badges}>
                    <span className={`${styles.badge} ${styles[program.type]}`}>
                      {program.type}
                    </span>
                    {program.isPublic && <span className={styles.badge}>Public</span>}
                    {!program.isActive && <span className={styles.badgeInactive}>Inactif</span>}
                  </div>
                </div>

                <p className={styles.programDescription}>{program.description}</p>

                <div className={styles.programStats}>
                  <span>⏱️ {program.estimatedDuration} min</span>
                  <span>🔥 {program.estimatedCalories} kcal</span>
                  <span>📊 {program.difficulty}</span>
                  <span>🔢 {program.cycles?.length || 0} cycles</span>
                </div>

                <div className={styles.programActions}>
                  <button onClick={() => handleEdit(program)} className={styles.editButton}>
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(program._id)} className={styles.deleteButton}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
