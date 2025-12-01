import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import RecipeCard from './components/RecipeCard';
import RecipeFilters from './components/RecipeFilters';
import CustomSelect from './components/CustomSelect';
import { useRecipes } from './hooks/useRecipes';
import { useLikedRecipes } from './hooks/useLikedRecipes';
import usePageTitle from '../../hooks/usePageTitle';
import {
  SearchIcon,
  AlertCircleIcon,
  UtensilsIcon
} from '../../components/Navbar/NavIcons';
import style from './RecipesPage.module.css';

export default function RecipesPage() {
  usePageTitle('Recettes santé');

  const [filters, setFilters] = useState({
    goal: [],
    mealType: [],
    tags: [],
    difficulty: '',
    category: '',
    page: 1,
    limit: 12,
    sort: 'newest'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Debounce de la recherche (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { recipes, loading, error, pagination } = useRecipes({
    ...filters,
    ...(debouncedSearch && { search: debouncedSearch })
  }, !showFavoritesOnly);

  const { likedRecipes } = useLikedRecipes();

  // Afficher les favoris ou les recettes filtrées
  const displayedRecipes = showFavoritesOnly ? likedRecipes : recipes;

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value, page: 1 }));
  };

  const sortOptions = [
    { value: 'newest', label: 'Plus récentes' },
    { value: 'popular', label: 'Populaires' },
    { value: 'rating', label: 'Mieux notées' },
    { value: 'calories_asc', label: 'Calories (croissant)' },
    { value: 'calories_desc', label: 'Calories (décroissant)' }
  ];

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Header />
      <main className={style.page}>
        <div className={style.container}>
          {/* Hero section */}
          <section className={style.hero}>
            <h1 className={style.heroTitle}>Recettes Santé</h1>
            <p className={style.heroSubtitle}>
              Des recettes nutritives adaptées à vos objectifs : perte de poids, prise de masse, ou simplement manger sainement
            </p>
          </section>

          {/* Search & Sort bar */}
          <div className={style.searchBar}>
            <div className={style.searchContainer}>
              <input
                type="text"
                placeholder="Rechercher une recette..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={style.searchInput}
              />
              <span className={style.searchIcon}>
                <SearchIcon size={20} />
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', flexWrap: 'wrap' }}>
              <CustomSelect
                value={filters.sort}
                onChange={handleSortChange}
                options={sortOptions}
              />

              <button
                className={`${style.favoritesBtn} ${showFavoritesOnly ? style.active : ''}`}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>Mes favoris {likedRecipes.length > 0 && `(${likedRecipes.length})`}</span>
              </button>
            </div>
          </div>

          <div className={style.content}>
            {/* Sidebar Filters */}
            <div className={style.sidebar}>
              <RecipeFilters onFiltersChange={handleFiltersChange} />
            </div>

            {/* Recipes Grid */}
            <div className={style.main}>
              {loading && (
                <div className={style.loading}>
                  <div className={style.spinner}></div>
                  <p>Chargement des recettes...</p>
                </div>
              )}

              {error && (
                <div className={style.error}>
                  <AlertCircleIcon size={48} />
                  <p>Erreur lors du chargement des recettes</p>
                  <p className={style.errorMessage}>{error}</p>
                </div>
              )}

              {!loading && !error && displayedRecipes.length === 0 && (
                <div className={style.empty}>
                  <div className={style.emptyIcon}>
                    <UtensilsIcon size={64} />
                  </div>
                  <h3>{showFavoritesOnly ? 'Aucune recette favorite' : 'Aucune recette trouvée'}</h3>
                  <p>{showFavoritesOnly ? 'Commencez à ajouter des recettes à vos favoris !' : 'Essayez de modifier vos filtres'}</p>
                </div>
              )}

              {!loading && !error && displayedRecipes.length > 0 && (
                <>
                  <div className={style.resultsHeader}>
                    <p className={style.resultsCount}>
                      {showFavoritesOnly
                        ? `${displayedRecipes.length} recette${displayedRecipes.length > 1 ? 's' : ''} favorite${displayedRecipes.length > 1 ? 's' : ''}`
                        : `${pagination.total} recette${pagination.total > 1 ? 's' : ''} trouvée${pagination.total > 1 ? 's' : ''}`
                      }
                    </p>
                  </div>

                  <div className={style.grid}>
                    {displayedRecipes.map(recipe => (
                      <RecipeCard key={recipe._id} recipe={recipe} />
                    ))}
                  </div>

                  {/* Pagination - masquée en mode favoris */}
                  {!showFavoritesOnly && pagination.pages > 1 && (
                    <div className={style.pagination}>
                      <button
                        className={style.paginationButton}
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        ← Précédent
                      </button>

                      <div className={style.paginationInfo}>
                        Page {pagination.page} sur {pagination.pages}
                      </div>

                      <button
                        className={style.paginationButton}
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                      >
                        Suivant →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
