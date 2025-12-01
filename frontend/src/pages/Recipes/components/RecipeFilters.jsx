import { useState } from 'react';
import {
  TargetIcon,
  MuscleIcon,
  ScaleIcon,
  RunningIcon,
  HeartIcon,
  SunriseIcon,
  SunIcon,
  MoonIcon,
  CookieIcon,
  ZapIcon,
  XCircleIcon,
  MeatIcon,
  SaladIcon,
  DropletIcon,
  CheckIcon,
  AlertTriangleIcon,
  FireIcon,
  SaltIcon,
  CakeIcon,
  SearchIcon
} from '../../../components/Navbar/NavIcons';
import style from './RecipeFilters.module.css';

export default function RecipeFilters({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    goal: [],
    mealType: [],
    tags: [],
    difficulty: '',
    category: ''
  });

  const [isOpen, setIsOpen] = useState(false);

  const goals = [
    { value: 'weight_loss', label: 'Perte de poids', icon: <TargetIcon size={16} /> },
    { value: 'muscle_gain', label: 'Prise de masse', icon: <MuscleIcon size={16} /> },
    { value: 'maintenance', label: 'Maintien', icon: <ScaleIcon size={16} /> },
    { value: 'performance', label: 'Performance', icon: <RunningIcon size={16} /> }
  ];

  const mealTypes = [
    { value: 'breakfast', label: 'Petit-déjeuner', icon: <SunriseIcon size={16} /> },
    { value: 'lunch', label: 'Déjeuner', icon: <SunIcon size={16} /> },
    { value: 'dinner', label: 'Dîner', icon: <MoonIcon size={16} /> },
    { value: 'snack', label: 'Snack', icon: <CookieIcon size={16} /> }
  ];

  const tags = [
    { value: 'quick', label: 'Rapide', icon: <ZapIcon size={16} /> },
    { value: 'high_protein', label: 'Riche en protéines', icon: <MeatIcon size={16} /> },
    { value: 'low_carb', label: 'Faible en glucides', icon: <SaladIcon size={16} /> }
  ];

  const difficulties = [
    { value: '', label: 'Toutes' },
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
    { value: 'hard', label: 'Difficile' }
  ];

  const categories = [
    { value: '', label: 'Toutes' },
    { value: 'salty', label: 'Salé' },
    { value: 'sweet', label: 'Sucré' }
  ];

  const handleCheckboxChange = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      const newFilters = { ...prev, [filterType]: newValues };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const handleSelectChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterType]: value };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const resetFilters = () => {
    const emptyFilters = {
      goal: [],
      mealType: [],
      tags: [],
      difficulty: '',
      category: ''
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount =
    filters.goal.length +
    filters.mealType.length +
    filters.tags.length +
    (filters.difficulty ? 1 : 0) +
    (filters.category ? 1 : 0);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className={style.mobileToggle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <SearchIcon size={20} />
        Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
      </button>

      <aside className={`${style.filters} ${isOpen ? style.open : ''}`}>
        <div className={style.header}>
          <h3 className={style.title}>Filtres</h3>
          {activeFiltersCount > 0 && (
            <button className={style.reset} onClick={resetFilters}>
              Réinitialiser
            </button>
          )}
        </div>

        {/* Objectif */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Objectif</h4>
          {goals.map(goal => (
            <label key={goal.value} className={style.checkbox}>
              <input
                type="checkbox"
                checked={filters.goal.includes(goal.value)}
                onChange={() => handleCheckboxChange('goal', goal.value)}
              />
              <span className={style.checkboxLabel}>
                {goal.icon}
                {goal.label}
              </span>
            </label>
          ))}
        </div>

        {/* Type de repas */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Type de repas</h4>
          {mealTypes.map(meal => (
            <label key={meal.value} className={style.checkbox}>
              <input
                type="checkbox"
                checked={filters.mealType.includes(meal.value)}
                onChange={() => handleCheckboxChange('mealType', meal.value)}
              />
              <span className={style.checkboxLabel}>
                {meal.icon}
                {meal.label}
              </span>
            </label>
          ))}
        </div>

        {/* Catégorie */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Catégorie</h4>
          <select
            className={style.select}
            value={filters.category}
            onChange={(e) => handleSelectChange('category', e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulté */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Difficulté</h4>
          <select
            className={style.select}
            value={filters.difficulty}
            onChange={(e) => handleSelectChange('difficulty', e.target.value)}
          >
            {difficulties.map(diff => (
              <option key={diff.value} value={diff.value}>
                {diff.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tags spéciaux */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Tags</h4>
          {tags.map(tag => (
            <label key={tag.value} className={style.checkbox}>
              <input
                type="checkbox"
                checked={filters.tags.includes(tag.value)}
                onChange={() => handleCheckboxChange('tags', tag.value)}
              />
              <span className={style.checkboxLabel}>
                {tag.icon}
                {tag.label}
              </span>
            </label>
          ))}
        </div>

        {/* Mobile close button */}
        <button
          className={style.mobileClose}
          onClick={() => setIsOpen(false)}
        >
          Appliquer les filtres
        </button>
      </aside>

      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className={style.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
