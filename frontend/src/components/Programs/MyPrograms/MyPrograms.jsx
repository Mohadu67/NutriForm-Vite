import { useState, useEffect } from 'react';
import { useNotification } from '../../../hooks/useNotification.jsx';
import { secureApiCall } from '../../../utils/authService';
import logger from '../../../shared/utils/logger';
import styles from './MyPrograms.module.css';
import {
  ArrowLeftIcon,
  PlusIcon,
  PlayIcon,
  EditIcon,
  TrashIcon,
  ShareIcon,
  CheckCircleIcon,
  ClockIcon
} from '../ProgramIcons';

const EyeIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function MyPrograms({ onBack, onEdit, onSelectProgram, onView, refreshKey }) {
  const notify = useNotification();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposingId, setProposingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [unpublishingId, setUnpublishingId] = useState(null);

  useEffect(() => {
    loadMyPrograms();
  }, [refreshKey]);

  const loadMyPrograms = async () => {
    try {
      setLoading(true);
      const response = await secureApiCall('/programs/user/my-programs');

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      } else {
        logger.error('Erreur chargement programmes');
      }
    } catch (error) {
      logger.error('Erreur chargement programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (programId) => {
    const confirmed = await notify.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?', {
      title: 'Supprimer le programme'
    });
    if (!confirmed) return;

    setDeletingId(programId);
    try {
      const response = await secureApiCall(`/programs/${programId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPrograms(programs.filter(p => p._id !== programId));
        logger.info('Programme supprimé');
        notify.success('Programme supprimé avec succès');
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

  const handlePropose = async (programId) => {
    const confirmed = await notify.confirm('Voulez-vous proposer ce programme pour qu\'il soit accessible à tous ? Il sera soumis à validation par un administrateur.', {
      title: 'Proposer le programme au public'
    });
    if (!confirmed) return;

    setProposingId(programId);
    try {
      const response = await secureApiCall(`/programs/${programId}/propose`, {
        method: 'POST',
      });

      if (response.ok) {
        // Recharger la liste
        loadMyPrograms();
        notify.success('Programme proposé avec succès ! Il sera bientôt examiné par notre équipe.');
      } else {
        const error = await response.json();
        notify.error(error.error === 'program_already_proposed_or_public'
          ? 'Ce programme a déjà été proposé ou est déjà public'
          : 'Erreur lors de la proposition');
      }
    } catch (error) {
      logger.error('Erreur proposition:', error);
      notify.error('Erreur lors de la proposition');
    } finally {
      setProposingId(null);
    }
  };

  const handleUnpublish = async (programId) => {
    const confirmed = await notify.confirm('Veux-tu retirer ce programme du public pour le modifier ? Il ne sera plus visible par les autres utilisateurs jusqu\'à ce que tu le resoumettes.', {
      title: 'Modifier le programme'
    });
    if (!confirmed) return;

    setUnpublishingId(programId);
    try {
      const response = await secureApiCall(`/programs/${programId}/unpublish`, {
        method: 'POST',
      });

      if (response.ok) {
        loadMyPrograms();
        notify.success('Programme retiré du public. Tu peux maintenant le modifier et le resoumettre.');
      } else {
        const error = await response.json();
        notify.error(error.message || 'Erreur lors du retrait');
      }
    } catch (error) {
      logger.error('Erreur unpublish:', error);
      notify.error('Erreur lors du retrait du programme');
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

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement de vos programmes...</p>
      </div>
    );
  }

  return (
    <div className={styles.myPrograms}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeftIcon size={20} />
          <span>Retour</span>
        </button>
        <h1>Mes programmes personnalisés</h1>
        <p className={styles.subtitle}>
          Créez vos propres programmes et proposez-les à la communauté
        </p>
      </div>

      {programs.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>Aucun programme créé</h3>
          <p>Créez votre premier programme d'entraînement personnalisé !</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {programs.map((program) => (
            <div key={program._id} className={styles.card}>
              {program.coverImage && (
                <div className={styles.coverImage}>
                  <img src={program.coverImage} alt={program.name} loading="lazy" />
                </div>
              )}

              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3>{program.name}</h3>
                  {getStatusBadge(program.status, program.rejectionReason)}
                </div>

                <p className={styles.description}>{program.description}</p>

                {program.rejectionReason && program.status === 'private' && (
                  <div className={styles.rejectionReason}>
                    <strong>Raison du refus:</strong> {program.rejectionReason}
                  </div>
                )}

                <div className={styles.stats}>
                  <span className={styles.stat}>
                    <ClockIcon size={16} />
                    {program.estimatedDuration} min
                  </span>
                  <span className={styles.stat}>
                    {program.cycles?.length || 0} cycles
                  </span>
                  <span className={styles.stat}>
                    {program.difficulty}
                  </span>
                </div>

                <div className={styles.actions}>
                  {/* Bouton Lancer - toujours visible */}
                  <button
                    onClick={() => onSelectProgram(program)}
                    className={styles.playBtn}
                    title="Lancer le programme"
                  >
                    <PlayIcon size={16} />
                  </button>

                  {/* Bouton Voir - pour les programmes publics */}
                  {program.status === 'public' && (
                    <button
                      onClick={() => onView && onView(program)}
                      className={styles.viewBtn}
                      title="Voir le programme"
                    >
                      <EyeIcon size={16} />
                    </button>
                  )}

                  {/* Bouton Modifier - pour les programmes prives */}
                  {program.status === 'private' && (
                    <button
                      onClick={() => onEdit(program)}
                      className={styles.editBtn}
                      title="Modifier"
                    >
                      <EditIcon size={16} />
                    </button>
                  )}

                  {/* Bouton Demander modification - pour les programmes publics ou en attente */}
                  {(program.status === 'public' || program.status === 'pending') && (
                    <button
                      onClick={() => handleUnpublish(program._id)}
                      disabled={unpublishingId === program._id}
                      className={styles.editBtn}
                      title={program.status === 'public' ? 'Retirer du public pour modifier' : 'Annuler et modifier'}
                    >
                      {unpublishingId === program._id ? (
                        <span>...</span>
                      ) : (
                        <EditIcon size={16} />
                      )}
                    </button>
                  )}

                  {/* Bouton Proposer - pour les programmes prives */}
                  {program.status === 'private' && (
                    <button
                      onClick={() => handlePropose(program._id)}
                      disabled={proposingId === program._id}
                      className={styles.proposeBtn}
                      title="Proposer au public"
                    >
                      {proposingId === program._id ? (
                        <span>...</span>
                      ) : (
                        <ShareIcon size={16} />
                      )}
                    </button>
                  )}

                  {/* Bouton Supprimer - pour les programmes prives */}
                  {program.status === 'private' && (
                    <button
                      onClick={() => handleDelete(program._id)}
                      disabled={deletingId === program._id}
                      className={styles.deleteBtn}
                      title="Supprimer"
                    >
                      {deletingId === program._id ? (
                        <span>...</span>
                      ) : (
                        <TrashIcon size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
