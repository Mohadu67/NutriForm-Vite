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
  SaladIcon,
  MeatIcon
} from '../../../components/Navbar/NavIcons';
import style from './RecipeFilters.module.css';

export default function RecipeFilters({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    goal: [],
    mealType: [],
    tags: [],
    dietType: [],
    difficulty: '',
    category: '',
    maxCalories: '',
    minProtein: ''
  });

  const [isOpen, setIsOpen] = useState(false);

  const goals = [
    { value: 'weight_loss', label: 'Perte de poids', icon: <TargetIcon size={14} /> },
    { value: 'muscle_gain', label: 'Prise de masse', icon: <MuscleIcon size={14} /> },
    { value: 'maintenance', label: 'Maintien', icon: <ScaleIcon size={14} /> },
    { value: 'performance', label: 'Performance', icon: <RunningIcon size={14} /> },
    { value: 'health', label: 'Sante', icon: <HeartIcon size={14} /> }
  ];

  const mealTypes = [
    { value: 'breakfast', label: 'Petit-dej', icon: <SunriseIcon size={14} /> },
    { value: 'lunch', label: 'Dejeuner', icon: <SunIcon size={14} /> },
    { value: 'dinner', label: 'Diner', icon: <MoonIcon size={14} /> },
    { value: 'snack', label: 'Snack', icon: <CookieIcon size={14} /> }
  ];

  const dietTypes = [
    { value: 'vegetarian', label: 'Vegetarien' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'gluten_free', label: 'Sans gluten' },
    { value: 'lactose_free', label: 'Sans lactose' }
  ];

  const tags = [
    { value: 'quick', label: 'Rapide', icon: <ZapIcon size={14} /> },
    { value: 'high_protein', label: 'Proteine', icon: <MeatIcon size={14} /> },
    { value: 'low_carb', label: 'Low carb', icon: <SaladIcon size={14} /> },
    { value: 'low_fat', label: 'Low fat' },
    { value: 'no_sugar', label: 'Sans sucre' },
    { value: 'budget_friendly', label: 'Budget' },
    { value: 'family_friendly', label: 'Famille' },
    { value: 'meal_prep', label: 'Meal prep' }
  ];

  const difficulties = [
    { value: '', label: 'Toutes' },
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
    { value: 'hard', label: 'Difficile' }
  ];

  const categories = [
    { value: '', label: 'Toutes' },
    { value: 'salty', label: 'Sale' },
    { value: 'sweet', label: 'Sucre' }
  ];

  const calorieRanges = [
    { value: '', label: 'Toutes' },
    { value: '300', label: '< 300 kcal' },
    { value: '500', label: '< 500 kcal' },
    { value: '700', label: '< 700 kcal' }
  ];

  const proteinRanges = [
    { value: '', label: 'Toutes' },
    { value: '20', label: '20g+' },
    { value: '30', label: '30g+' },
    { value: '40', label: '40g+' }
  ];

  const handleChipToggle = (filterType, value) => {
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
      dietType: [],
      difficulty: '',
      category: '',
      maxCalories: '',
      minProtein: ''
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount =
    filters.goal.length +
    filters.mealType.length +
    filters.tags.length +
    filters.dietType.length +
    (filters.difficulty ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.maxCalories ? 1 : 0) +
    (filters.minProtein ? 1 : 0);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className={style.mobileToggle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="8" cy="18" r="1" fill="currentColor" />
        </svg>
        Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
      </button>

      <aside className={`${style.filters} ${isOpen ? style.open : ''}`}>
        <div className={style.header}>
          <h3 className={style.title}>Filtres</h3>
          {activeFiltersCount > 0 && (
            <button className={style.reset} onClick={resetFilters}>
              Reinitialiser
            </button>
          )}
        </div>

        {/* Objectif */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Objectif</h4>
          <div className={style.chipGroup}>
            {goals.map(goal => (
              <button
                key={goal.value}
                className={`${style.chip} ${filters.goal.includes(goal.value) ? style.chipActive : ''}`}
                onClick={() => handleChipToggle('goal', goal.value)}
              >
                {goal.icon}
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type de repas */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Type de repas</h4>
          <div className={style.chipGroup}>
            {mealTypes.map(meal => (
              <button
                key={meal.value}
                className={`${style.chip} ${filters.mealType.includes(meal.value) ? style.chipActive : ''}`}
                onClick={() => handleChipToggle('mealType', meal.value)}
              >
                {meal.icon}
                {meal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Regime alimentaire */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Regime</h4>
          <div className={style.chipGroup}>
            {dietTypes.map(diet => (
              <button
                key={diet.value}
                className={`${style.chip} ${filters.dietType.includes(diet.value) ? style.chipActive : ''}`}
                onClick={() => handleChipToggle('dietType', diet.value)}
              >
                {diet.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categorie */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Categorie</h4>
          <div className={style.chipGroup}>
            {categories.map(cat => (
              <button
                key={cat.value || 'all'}
                className={`${style.chip} ${filters.category === cat.value ? style.chipActive : ''}`}
                onClick={() => handleSelectChange('category', filters.category === cat.value ? '' : cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulte */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Difficulte</h4>
          <div className={style.chipGroup}>
            {difficulties.map(diff => (
              <button
                key={diff.value || 'all'}
                className={`${style.chip} ${filters.difficulty === diff.value ? style.chipActive : ''}`}
                onClick={() => handleSelectChange('difficulty', filters.difficulty === diff.value ? '' : diff.value)}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calories max */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Calories max</h4>
          <div className={style.chipGroup}>
            {calorieRanges.map(range => (
              <button
                key={range.value || 'all'}
                className={`${style.chip} ${filters.maxCalories === range.value ? style.chipActive : ''}`}
                onClick={() => handleSelectChange('maxCalories', filters.maxCalories === range.value ? '' : range.value)}
              >
                {range.icon}{range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Proteines min */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Proteines min</h4>
          <div className={style.chipGroup}>
            {proteinRanges.map(range => (
              <button
                key={range.value || 'all'}
                className={`${style.chip} ${filters.minProtein === range.value ? style.chipActive : ''}`}
                onClick={() => handleSelectChange('minProtein', filters.minProtein === range.value ? '' : range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags speciaux */}
        <div className={style.section}>
          <h4 className={style.sectionTitle}>Tags</h4>
          <div className={style.chipGroup}>
            {tags.map(tag => (
              <button
                key={tag.value}
                className={`${style.chip} ${filters.tags.includes(tag.value) ? style.chipActive : ''}`}
                onClick={() => handleChipToggle('tags', tag.value)}
              >
                {tag.icon}
                {tag.label}
              </button>
            ))}
          </div>
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
