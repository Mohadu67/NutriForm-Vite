import { useState, useEffect, useMemo } from 'react';
import { loadPrograms } from '../../../utils/programsLoader';
import ProgramCard from './ProgramCard';
import CustomSelect from '../CustomSelect/CustomSelect';
import styles from './ProgramBrowser.module.css';
import logger from '../../../shared/utils/logger';
import { DumbbellIcon, SparklesIcon, SearchIcon, LayersIcon, SlidersIcon } from '../../Programs/ProgramIcons';

export default function ProgramBrowser({ onSelectProgram, onCreateProgram, isPremium }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    difficulty: 'all',
  });

  useEffect(() => {
    async function fetchPrograms() {
      try {
        setLoading(true);
        const data = await loadPrograms('all');
        setPrograms(data);
      } catch (error) {
        logger.error('Erreur lors du chargement des programmes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  // Optimisation avec useMemo pour éviter le re-filtrage à chaque render
  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      if (filters.type !== 'all' && program.type !== filters.type) {
        return false;
      }
      if (filters.difficulty !== 'all' && program.difficulty !== filters.difficulty) {
        return false;
      }
      return true;
    });
  }, [programs, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  if (loading) {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        <div className={styles.spinner} aria-hidden="true"></div>
        <p>Chargement des programmes...</p>
      </div>
    );
  }

  return (
    <div className={styles.browser}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <DumbbellIcon size={32} />
            </div>
            <div>
              <h1 className={styles.title}>Programmes d'Entraînement</h1>
              <p className={styles.subtitle}>
                Choisissez un programme et lancez-vous. Pas besoin de connexion pour essayer.
              </p>
            </div>
          </div>

          {isPremium && onCreateProgram && (
            <button onClick={onCreateProgram} className={styles.createButton}>
              <SparklesIcon size={20} />
              <span>Créer mon programme</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <CustomSelect
          label="Type"
          value={filters.type}
          onChange={(value) => handleFilterChange('type', value)}
          icon={LayersIcon}
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'hiit', label: 'HIIT' },
            { value: 'circuit', label: 'Circuit' },
            { value: 'tabata', label: 'Tabata' },
            { value: 'superset', label: 'Superset' },
            { value: 'amrap', label: 'AMRAP' },
          ]}
        />

        <CustomSelect
          label="Difficulté"
          value={filters.difficulty}
          onChange={(value) => handleFilterChange('difficulty', value)}
          icon={SlidersIcon}
          options={[
            { value: 'all', label: 'Toutes' },
            { value: 'débutant', label: 'Débutant' },
            { value: 'intermédiaire', label: 'Intermédiaire' },
            { value: 'avancé', label: 'Avancé' },
          ]}
        />
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <div className={styles.empty}>
          <SearchIcon size={48} />
          <p>Aucun programme ne correspond à vos critères</p>
          <button
            className={styles.resetButton}
            onClick={() => setFilters({ type: 'all', difficulty: 'all' })}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => onSelectProgram(program)}
            />
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoIcon}>
          <SparklesIcon size={24} />
        </div>
        <div className={styles.infoContent}>
          <h3 className={styles.infoTitle}>Accessible à tous</h3>
          <p className={styles.infoText}>
            Les programmes sont accessibles à tous, même sans connexion.
            Les utilisateurs <strong>Premium</strong> peuvent sauvegarder leur progression
            et suivre leurs statistiques dans le dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
