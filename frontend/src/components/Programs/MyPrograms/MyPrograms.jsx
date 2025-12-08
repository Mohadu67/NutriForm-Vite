import { useState, useEffect } from 'react';
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

export default function MyPrograms({ onBack, onEdit, onSelectProgram }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyPrograms();
  }, []);

  const loadMyPrograms = async () => {
    try {
      setLoading(true);
      const response = await secureApiCall('/api/programs/user/my-programs');

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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      return;
    }

    try {
      const response = await secureApiCall(`/api/programs/${programId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPrograms(programs.filter(p => p._id !== programId));
        logger.info('Programme supprimé');
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      logger.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handlePropose = async (programId) => {
    if (!confirm('Voulez-vous proposer ce programme pour qu\'il soit accessible à tous ? Il sera soumis à validation par un administrateur.')) {
      return;
    }

    try {
      const response = await secureApiCall(`/api/programs/${programId}/propose`, {
        method: 'POST',
      });

      if (response.ok) {
        // Recharger la liste
        loadMyPrograms();
        alert('Programme proposé avec succès ! Il sera bientôt examiné par notre équipe.');
      } else {
        const error = await response.json();
        alert(error.error === 'program_already_proposed_or_public'
          ? 'Ce programme a déjà été proposé ou est déjà public'
          : 'Erreur lors de la proposition');
      }
    } catch (error) {
      logger.error('Erreur proposition:', error);
      alert('Erreur lors de la proposition');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'public':
        return <span className={`${styles.badge} ${styles.badgePublic}`}>✓ Public</span>;
      case 'pending':
        return <span className={`${styles.badge} ${styles.badgePending}`}>⏳ En attente</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgePrivate}`}>🔒 Privé</span>;
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
                  {getStatusBadge(program.status)}
                </div>

                <p className={styles.description}>{program.description}</p>

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
                  <button
                    onClick={() => onSelectProgram(program)}
                    className={styles.playBtn}
                    title="Lancer le programme"
                  >
                    <PlayIcon size={16} />
                  </button>

                  <button
                    onClick={() => onEdit(program)}
                    className={styles.editBtn}
                    title="Modifier"
                  >
                    <EditIcon size={16} />
                  </button>

                  {program.status === 'private' && (
                    <button
                      onClick={() => handlePropose(program._id)}
                      className={styles.proposeBtn}
                      title="Proposer au public"
                    >
                      <ShareIcon size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(program._id)}
                    className={styles.deleteBtn}
                    title="Supprimer"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
