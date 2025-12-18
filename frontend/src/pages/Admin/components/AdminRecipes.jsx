import { useState, useEffect } from 'react';
import { MdRestaurant, MdEdit, MdDelete, MdPendingActions } from 'react-icons/md';
import SearchBar from '../../../components/SearchBar/SearchBar.jsx';
import Pagination from '../../../components/Pagination/Pagination.jsx';
import PendingRecipes from '../RecipesAdmin/PendingRecipes.jsx';
import { secureApiCall } from '../../../utils/authService';
import styles from '../AdminPage.module.css';

export default function AdminRecipes({
  recipes,
  filteredRecipes,
  paginatedRecipes,
  loading,
  setSearchRecipes,
  sortRecipes,
  setSortRecipes,
  confirmDeleteRecipe,
  onNavigate,
  recipesPage,
  setRecipesPage,
  ITEMS_PER_PAGE
}) {
  const [showPending, setShowPending] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const fetchPendingCount = async () => {
    try {
      const response = await secureApiCall('/recipes/admin/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.recipes?.length || 0);
      }
    } catch (error) {
      console.error('Erreur chargement recettes pending:', error);
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.sectionHeader}>
        <button className={styles.btnPrimary} onClick={() => onNavigate("/admin/recipes/new")}>
          <MdEdit /> Nouvelle Recette
        </button>
        <button
          className={styles.btnSecondary}
          onClick={() => setShowPending(true)}
          style={{ position: 'relative' }}
        >
          <MdPendingActions /> Recettes en attente
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {showPending && (
        <PendingRecipes onClose={() => {
          setShowPending(false);
          fetchPendingCount();
        }} />
      )}

      {/* Search & Sort */}
      <div className={styles.searchSortWrapper}>
        <SearchBar
          placeholder="Rechercher une recette (titre, categorie)..."
          onSearch={setSearchRecipes}
        />
        <select
          className={styles.sortSelect}
          value={sortRecipes}
          onChange={(e) => setSortRecipes(e.target.value)}
        >
          <option value="date-desc">Plus recent</option>
          <option value="date-asc">Plus ancien</option>
          <option value="calories-desc">Calories decroissantes</option>
          <option value="calories-asc">Calories croissantes</option>
          <option value="views-desc">Plus vues</option>
          <option value="views-asc">Moins vues</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : recipes.length === 0 ? (
        <div className={styles.empty}>
          <MdRestaurant className={styles.emptyIcon} />
          <h3>Aucune recette</h3>
          <button className={styles.btnPrimary} onClick={() => onNavigate("/admin/recipes/new")}>
            <MdEdit /> Creer une recette
          </button>
        </div>
      ) : (
        <>
          <div className={styles.recipesGrid}>
            {paginatedRecipes.map((recipe) => (
              <div key={recipe._id} className={styles.recipeCard}>
                <div className={styles.recipeImage}>
                  <img src={recipe.image} alt={recipe.title} />
                  {recipe.isPremium && <span className={styles.premiumBadge}>Premium</span>}
                </div>
                <div className={styles.recipeContent}>
                  <h3>{recipe.title}</h3>
                  <p>{recipe.description?.slice(0, 100)}...</p>
                  <div className={styles.recipeMeta}>
                    <span>{recipe.totalTime} min</span>
                    <span>{recipe.nutrition?.calories || 0} kcal</span>
                    <span>{recipe.views} vues</span>
                  </div>
                  <div className={styles.recipeActions}>
                    <button className={styles.btnSecondary} onClick={() => onNavigate(`/recettes/${recipe.slug || recipe._id}`)}>
                      Voir
                    </button>
                    <button className={styles.btnSecondary} onClick={() => onNavigate(`/admin/recipes/${recipe._id}/edit`)}>
                      <MdEdit /> Modifier
                    </button>
                    <button className={styles.btnDanger} onClick={() => confirmDeleteRecipe(recipe._id)}>
                      <MdDelete /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={recipesPage}
            totalItems={filteredRecipes.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setRecipesPage}
          />
        </>
      )}
    </div>
  );
}
