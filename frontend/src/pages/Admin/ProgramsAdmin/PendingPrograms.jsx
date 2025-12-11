import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { secureApiCall } from '../../../utils/authService';
import logger from '../../../shared/utils/logger';
import ConfirmModal from '../../../components/Modal/ConfirmModal';
import { TimerIcon, FlameIcon, TrendingUpIcon, LayersIcon, TagIcon, UserIcon, CheckCircleIcon, XIcon } from '../../../components/Programs/ProgramIcons';
import styles from './PendingPrograms.module.css';

export default function PendingPrograms({ onClose }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [approveModalConfig, setApproveModalConfig] = useState({ isOpen: false, programId: null });
  const [rejectModalConfig, setRejectModalConfig] = useState({ isOpen: false, programId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingPrograms();
  }, []);

  const fetchPendingPrograms = async () => {
    try {
      setLoading(true);
      const response = await secureApiCall('/programs/admin/pending', {
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

  const confirmApprove = (programId) => {
    setApproveModalConfig({ isOpen: true, programId });
  };

  const handleApprove = async (programId) => {
    try {
      const response = await secureApiCall(`/programs/admin/${programId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Programme approuvé avec succès !');
        fetchPendingPrograms();
        setSelectedProgram(null);
      } else {
        const error = await response.json();
        toast.error('Erreur: ' + (error.error || 'Erreur inconnue'));
      }
    } catch (error) {
      logger.error('Erreur lors de l\'approbation:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const confirmReject = (programId) => {
    setRejectReason('');
    setRejectModalConfig({ isOpen: true, programId });
  };

  const handleReject = async (programId, reason) => {
    try {
      const response = await secureApiCall(`/programs/admin/${programId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success('Programme rejeté. L\'utilisateur peut le modifier et le soumettre à nouveau.');
        fetchPendingPrograms();
        setSelectedProgram(null);
      } else {
        const error = await response.json();
        toast.error('Erreur: ' + (error.error || 'Erreur inconnue'));
      }
    } catch (error) {
      logger.error('Erreur lors du rejet:', error);
      toast.error('Erreur lors du rejet');
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
          <button onClick={onClose} className={styles.closeBtn}><XIcon size={20} /></button>
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
                    <UserIcon size={16} />
                    {program.userId?.pseudo || program.userId?.username || 'Utilisateur'}
                  </span>
                </div>

                <p className={styles.description}>{program.description}</p>

                <div className={styles.stats}>
                  <span className={styles.statItem}><TimerIcon size={16} /> {program.estimatedDuration} min</span>
                  <span className={styles.statItem}><FlameIcon size={16} /> {program.estimatedCalories || 0} kcal</span>
                  <span className={styles.statItem}><TrendingUpIcon size={16} /> {program.difficulty}</span>
                  <span className={styles.statItem}><LayersIcon size={16} /> {program.cycles?.length || 0} cycles</span>
                  <span className={styles.statItem}><TagIcon size={16} /> {program.type}</span>
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
                        onClick={() => confirmApprove(program._id)}
                        className={styles.approveBtn}
                      >
                        <CheckCircleIcon size={18} /> Approuver
                      </button>
                      <button
                        onClick={() => confirmReject(program._id)}
                        className={styles.rejectBtn}
                      >
                        <XIcon size={18} /> Rejeter
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

      {/* Modal d'approbation */}
      <ConfirmModal
        isOpen={approveModalConfig.isOpen}
        onClose={() => setApproveModalConfig({ isOpen: false, programId: null })}
        onConfirm={() => {
          handleApprove(approveModalConfig.programId);
          setApproveModalConfig({ isOpen: false, programId: null });
        }}
        title="Approuver le programme"
        message="Voulez-vous approuver ce programme et le rendre public ? Il sera visible par tous les utilisateurs."
        type="default"
      />

      {/* Modal de rejet avec champ raison */}
      {rejectModalConfig.isOpen && (
        <div className={styles.modal} onClick={() => setRejectModalConfig({ isOpen: false, programId: null })}>
          <div className={styles.rejectModal} onClick={(e) => e.stopPropagation()}>
            <h3>Rejeter le programme</h3>
            <p>L'utilisateur pourra modifier et resoumettre son programme.</p>
            <div className={styles.rejectInputGroup}>
              <label>Raison du rejet (optionnel) :</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi le programme est rejeté..."
                rows={3}
              />
            </div>
            <div className={styles.rejectActions}>
              <button
                onClick={() => setRejectModalConfig({ isOpen: false, programId: null })}
                className={styles.cancelBtn}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleReject(rejectModalConfig.programId, rejectReason);
                  setRejectModalConfig({ isOpen: false, programId: null });
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
