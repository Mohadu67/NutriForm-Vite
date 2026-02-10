import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './ExerciseSelector.module.css';

// Mapping des types de programme vers les fichiers JSON
const PROGRAM_TYPE_TO_FILES = {
  hiit: ['hiit', 'cardio'],
  circuit: ['hiit', 'cardio', 'muscu'],
  tabata: ['hiit', 'cardio'],
  superset: ['muscu'],
  amrap: ['hiit', 'cardio', 'muscu'],
  emom: ['hiit', 'cardio', 'muscu'],
  custom: ['hiit', 'cardio', 'muscu', 'yoga', 'etirement', 'natation'],
  cardio: ['cardio', 'hiit'],
  muscu: ['muscu'],
  yoga: ['yoga', 'etirement'],
  natation: ['natation'],
  etirement: ['etirement', 'yoga']
};

export default function ExerciseSelector({
  programType = 'custom',
  value = null,
  onChange,
  placeholder = 'Rechercher un exercice...',
  hasError = false
}) {
  const [exercises, setExercises] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Charger les exercices selon le type de programme
  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      const categories = PROGRAM_TYPE_TO_FILES[programType] || PROGRAM_TYPE_TO_FILES.custom;

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const categoryParam = categories.join(',');
        const response = await fetch(`${apiUrl}/exercises?limit=1000&category=${categoryParam}`);

        if (!response.ok) {
          console.warn(`Erreur chargement exercices API: ${response.status}`);
          setExercises([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const exos = data.success && data.data ? data.data : (data.exercises || data.data || []);

        // Mapper les exercices au format attendu par le composant
        const mappedExercises = exos.map(exo => ({
          id: exo._id || exo.exoId,
          name: exo.name,
          images: [exo.mainImage],
          type: exo.type,
          muscles: exo.muscles
        }));

        // Trier par nom
        mappedExercises.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        setExercises(mappedExercises);
      } catch (err) {
        console.error('Erreur chargement exercices:', err);
        setExercises([]);
      }

      setLoading(false);
    };

    loadExercises();
  }, [programType]);

  // Filtrer les exercices selon la recherche
  const filteredExercises = useMemo(() => {
    if (!search.trim()) return exercises;
    const searchLower = search.toLowerCase();
    return exercises.filter(exo =>
      exo.name.toLowerCase().includes(searchLower) ||
      exo.muscles?.some(m => m.toLowerCase().includes(searchLower)) ||
      exo.type?.some(t => t.toLowerCase().includes(searchLower))
    );
  }, [exercises, search]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (exercise) => {
    onChange({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseImage: exercise.images?.[0] || null,
      exerciseType: exercise.type?.[0] || 'custom'
    });
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({
      exerciseId: '',
      exerciseName: '',
      exerciseImage: null,
      exerciseType: ''
    });
    setSearch('');
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className={styles.selector} ref={dropdownRef}>
      <div className={`${styles.inputWrapper} ${hasError ? styles.inputError : ''}`}>
        {value?.exerciseImage && (
          <img
            src={value.exerciseImage}
            alt=""
            className={styles.selectedImage}
          />
        )}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={value?.exerciseName || placeholder}
          value={search}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        {value?.exerciseName && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            title="Effacer"
          >
            ×
          </button>
        )}
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {loading ? (
            <div className={styles.loading}>Chargement...</div>
          ) : filteredExercises.length === 0 ? (
            <div className={styles.empty}>Aucun exercice trouvé</div>
          ) : (
            <ul className={styles.list}>
              {filteredExercises.map((exo) => (
                <li
                  key={exo.id}
                  className={`${styles.item} ${value?.exerciseId === exo.id ? styles.selected : ''}`}
                  onClick={() => handleSelect(exo)}
                >
                  {exo.images?.[0] && (
                    <img
                      src={exo.images[0]}
                      alt=""
                      className={styles.itemImage}
                    />
                  )}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{exo.name}</span>
                    <span className={styles.itemMeta}>
                      {exo.type?.join(', ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
