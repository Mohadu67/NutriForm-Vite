import { useState, useEffect } from 'react';
import { secureApiCall } from '../../../utils/authService';
import logger from '../../../shared/utils/logger';
import styles from './PendingPrograms.module.css';

export default function PendingPrograms({ onClose }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    fetchPendingPrograms();
  }, []);

  const fetchPendingPrograms = async () => {
    try {
      setLoading(true);
      const response = await secureApiCall('/api/programs/admin/pending', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des programmes en attente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (programId) => {
    if (!confirm('Voulez-vous approuver ce programme et le rendre public ?')) {
      return;
    }

    try {
      const response = await secureApiCall(`/api/programs/admin/${programId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Programme approuvé avec succès !');
        fetchPendingPrograms();
        setSelectedProgram(null);
      } else {
        const error = await response.json();
        alert('Erreur: ' + (error.error || 'Erreur inconnue'));
      }
    } catch (error) {
      logger.error('Erreur lors de l\'approbation:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (programId) => {
    const reason = prompt('Raison du rejet (optionnel):');
    if (reason === null) return; // Annulé

    try {
      const response = await secureApiCall(`/api/programs/admin/${programId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('Programme rejeté. L\'utilisateur peut le modifier et le soumettre à nouveau.');
        fetchPendingPrograms();
        setSelectedProgram(null);
      } else {
        const error = await response.json();
        alert('Erreur: ' + (error.error || 'Erreur inconnue'));
      }
    } catch (error) {
      logger.error('Erreur lors du rejet:', error);
      alert('Erreur lors du rejet');
    }
  };

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
          <h2>Programmes en attente de validation</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        {programs.length === 0 ? (
          <div className={styles.empty}>
            <p>Aucun programme en attente de validation</p>
          </div>
        ) : (
          <div className={styles.list}>
            {programs.map((program) => (
              <div
                key={program._id}
                className={`${styles.card} ${selectedProgram?._id === program._id ? styles.selected : ''}`}
              >
                <div className={styles.cardHeader} onClick={() => setSelectedProgram(program)}>
                  <h3>{program.name}</h3>
                  <span className={styles.badge}>
                    Par: {program.userId?.pseudo || program.userId?.username || 'Utilisateur'}
                  </span>
                </div>

                <p className={styles.description}>{program.description}</p>

                <div className={styles.stats}>
                  <span>⏱️ {program.estimatedDuration} min</span>
                  <span>🔥 {program.estimatedCalories || 0} kcal</span>
                  <span>📊 {program.difficulty}</span>
                  <span>🔢 {program.cycles?.length || 0} cycles</span>
                  <span>🏷️ {program.type}</span>
                </div>

                {selectedProgram?._id === program._id && (
                  <div className={styles.details}>
                    <div className={styles.detailsContent}>
                      <h4>Détails du programme</h4>

                      {program.instructions && (
                        <div className={styles.section}>
                          <strong>Instructions:</strong>
                          <p>{program.instructions}</p>
                        </div>
                      )}

                      {program.tips && (
                        <div className={styles.section}>
                          <strong>Conseils:</strong>
                          <p>{program.tips}</p>
                        </div>
                      )}

                      {program.tags && program.tags.length > 0 && (
                        <div className={styles.section}>
                          <strong>Tags:</strong>
                          <div className={styles.tags}>
                            {program.tags.map((tag, i) => (
                              <span key={i} className={styles.tag}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {program.muscleGroups && program.muscleGroups.length > 0 && (
                        <div className={styles.section}>
                          <strong>Groupes musculaires:</strong>
                          <div className={styles.tags}>
                            {program.muscleGroups.map((group, i) => (
                              <span key={i} className={styles.tag}>{group}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {program.equipment && program.equipment.length > 0 && (
                        <div className={styles.section}>
                          <strong>Équipement:</strong>
                          <div className={styles.tags}>
                            {program.equipment.map((equip, i) => (
                              <span key={i} className={styles.tag}>{equip}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.section}>
                        <strong>Cycles d'entraînement ({program.cycles?.length || 0}):</strong>
                        <div className={styles.cycles}>
                          {program.cycles?.map((cycle, i) => (
                            <div key={i} className={styles.cycle}>
                              <span className={styles.cycleOrder}>#{i + 1}</span>
                              <div className={styles.cycleContent}>
                                {cycle.type === 'exercise' ? (
                                  <>
                                    <strong>{cycle.exerciseName}</strong>
                                    <span>{cycle.durationSec}s • Intensité {cycle.intensity}/10</span>
                                  </>
                                ) : (
                                  <>
                                    <strong>{cycle.type === 'rest' ? 'Repos' : 'Transition'}</strong>
                                    <span>{cycle.restSec}s{cycle.notes ? ` • ${cycle.notes}` : ''}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button
                        onClick={() => handleApprove(program._id)}
                        className={styles.approveBtn}
                      >
                        ✓ Approuver
                      </button>
                      <button
                        onClick={() => handleReject(program._id)}
                        className={styles.rejectBtn}
                      >
                        ✕ Rejeter
                      </button>
                    </div>
                  </div>
                )}

                {!selectedProgram && (
                  <button
                    onClick={() => setSelectedProgram(program)}
                    className={styles.viewBtn}
                  >
                    Voir les détails
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
