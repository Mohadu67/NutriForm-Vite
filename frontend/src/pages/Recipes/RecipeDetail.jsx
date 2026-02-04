import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Alert from '../../components/MessageAlerte/Alert/Alert';
import { useRecipeDetail } from './hooks/useRecipeDetail';
import usePageTitle from '../../hooks/usePageTitle';
import { storage } from '../../shared/utils/storage';
import { getProxiedImageUrl } from '../../utils/imageProxy';
import {
  ClockIcon,
  ChefHatIcon,
  EyeIcon,
  HeartIcon,
  ShoppingCartIcon,
  ZapIcon,
  XCircleIcon,
  MeatIcon,
  SaladIcon,
  DropletIcon,
  ArrowLeftIcon,
  AlertCircleIcon
} from '../../components/Navbar/NavIcons';
import style from './RecipeDetail.module.css';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipe, loading, error, isLiked, likesCount, toggleLike, likeError, clearLikeError } = useRecipeDetail(id);
  const [servings, setServings] = useState(2);
  const user = storage.get('user');

  usePageTitle(recipe?.title || 'Détail de la recette');

  // Synchroniser servings avec recipe.servings quand la recette se charge
  useEffect(() => {
    if (recipe?.servings) {
      setServings(recipe.servings);
    }
  }, [recipe]);

  const handleLoginRedirect = () => {
    clearLikeError();
    // Rediriger vers l'accueil avec le hash pour ouvrir la popup de connexion
    navigate('/#login');
  };

  const getAlertMessage = () => {
    if (likeError === 'auth_required') {
      return 'Connecte-toi pour ajouter cette recette à tes favoris et la retrouver facilement !';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className={style.page}>
          <div className={style.loading}>
            <div className={style.spinner}></div>
            <p>Chargement de la recette...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !recipe) {
    return (
      <>
        <Header />
        <main className={style.page}>
          <div className={style.error}>
            <AlertCircleIcon size={64} />
            <h2>Recette introuvable</h2>
            <p>{error || 'Cette recette n\'existe pas ou n\'est plus disponible'}</p>
            <button onClick={() => navigate('/recettes')} className={style.backButton}>
              <ArrowLeftIcon size={20} />
              Retour aux recettes
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Calculer les quantités ajustées en fonction des portions
  const ratio = servings / recipe.servings;

  const adjustedNutrition = {
    calories: Math.round(recipe.nutrition.calories * ratio),
    proteins: Math.round(recipe.nutrition.proteins * ratio),
    carbs: Math.round(recipe.nutrition.carbs * ratio),
    fats: Math.round(recipe.nutrition.fats * ratio),
    fiber: Math.round(recipe.nutrition.fiber * ratio)
  };

  return (
    <>
      <Header />
      <main className={style.page}>
        <div className={style.container}>
          {/* Back button */}
          <button onClick={() => navigate('/recettes')} className={style.backLink}>
            <ArrowLeftIcon size={20} />
            Retour aux recettes
          </button>

          {/* Hero image */}
          <div className={style.hero}>
            <img
              src={getProxiedImageUrl(recipe.image)}
              alt={recipe.title}
              className={style.heroImage}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className={style.heroOverlay}>
              {recipe.isPremium && (
                <span className={style.premiumBadge}>Premium</span>
              )}
            </div>
          </div>

          {/* Header info */}
          <header className={style.header}>
            <div className={style.headerMain}>
              <h1 className={style.title}>{recipe.title}</h1>
              <p className={style.description}>{recipe.description}</p>

              <div className={style.meta}>
                <div className={style.metaItem}>
                  <ClockIcon size={24} className={style.metaIcon} />
                  <div>
                    <span className={style.metaLabel}>Temps total</span>
                    <span className={style.metaValue}>{recipe.totalTime} min</span>
                  </div>
                </div>
                <div className={style.metaItem}>
                  <ChefHatIcon size={24} className={style.metaIcon} />
                  <div>
                    <span className={style.metaLabel}>Difficulté</span>
                    <span className={style.metaValue}>
                      {recipe.difficulty === 'easy' ? 'Facile' :
                       recipe.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                    </span>
                  </div>
                </div>
                <div className={style.metaItem}>
                  <EyeIcon size={24} className={style.metaIcon} />
                  <div>
                    <span className={style.metaLabel}>Vues</span>
                    <span className={style.metaValue}>{recipe.views}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {recipe.tags.length > 0 && (
                <div className={style.tags}>
                  {recipe.tags.map(tag => (
                    <span key={tag} className={style.tag}>
                      {tag === 'quick' && <><ZapIcon size={16} /> Rapide</>}
                      {tag === 'no_sugar' && <><XCircleIcon size={16} /> Sans sucre</>}
                      {tag === 'high_protein' && <><MeatIcon size={16} /> Riche en protéines</>}
                      {tag === 'low_carb' && <><SaladIcon size={16} /> Faible en glucides</>}
                      {tag === 'low_fat' && <><DropletIcon size={16} /> Faible en gras</>}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={style.actions}>
              <button
                onClick={toggleLike}
                className={`${style.likeButton} ${isLiked ? style.liked : ''}`}
              >
                <HeartIcon size={20} filled={isLiked} />
                {(user && likesCount > 0) && <span>{likesCount}</span>}
              </button>
            </div>
          </header>

          {/* Main content */}
          <div className={style.content}>
            {/* Sidebar */}
            <aside className={style.sidebar}>
              {/* Nutrition card */}
              <div className={style.nutritionCard}>
                <div className={style.nutritionHeader}>
                  <h3>Valeurs nutritionnelles</h3>
                  <div className={style.servingsControl}>
                    <button
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      className={style.servingsButton}
                    >
                      -
                    </button>
                    <span className={style.servingsValue}>{servings} parts</span>
                    <button
                      onClick={() => setServings(servings + 1)}
                      className={style.servingsButton}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={style.nutritionGrid}>
                  <div className={style.nutritionItem}>
                    <span className={style.nutritionLabel}>Calories</span>
                    <span className={style.nutritionValue}>{adjustedNutrition.calories}</span>
                    <span className={style.nutritionUnit}>kcal</span>
                  </div>
                  <div className={style.nutritionItem}>
                    <span className={style.nutritionLabel}>Protéines</span>
                    <span className={style.nutritionValue}>{adjustedNutrition.proteins}</span>
                    <span className={style.nutritionUnit}>g</span>
                  </div>
                  <div className={style.nutritionItem}>
                    <span className={style.nutritionLabel}>Glucides</span>
                    <span className={style.nutritionValue}>{adjustedNutrition.carbs}</span>
                    <span className={style.nutritionUnit}>g</span>
                  </div>
                  <div className={style.nutritionItem}>
                    <span className={style.nutritionLabel}>Lipides</span>
                    <span className={style.nutritionValue}>{adjustedNutrition.fats}</span>
                    <span className={style.nutritionUnit}>g</span>
                  </div>
                  <div className={style.nutritionItem}>
                    <span className={style.nutritionLabel}>Fibres</span>
                    <span className={style.nutritionValue}>{adjustedNutrition.fiber}</span>
                    <span className={style.nutritionUnit}>g</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main */}
            <div className={style.main}>
              {/* Ingredients */}
              <section className={style.section}>
                <h2 className={style.sectionTitle}>
                  <ShoppingCartIcon size={28} />
                  Ingrédients
                </h2>
                <p className={style.sectionSubtitle}>Pour {servings} personne{servings > 1 ? 's' : ''}</p>
                <ul className={style.ingredientsList}>
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className={style.ingredientItem}>
                      <span className={style.ingredientQuantity}>
                        {Math.round(ingredient.quantity * ratio * 10) / 10} {ingredient.unit}
                      </span>
                      <span className={style.ingredientName}>
                        {ingredient.name}
                        {ingredient.optional && <span className={style.optional}> (optionnel)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Instructions */}
              <section className={style.section}>
                <h2 className={style.sectionTitle}>
                  <ChefHatIcon size={28} />
                  Préparation
                </h2>
                <ol className={style.instructionsList}>
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className={style.instructionItem}>
                      <span className={style.instructionNumber}>{index + 1}</span>
                      <span className={style.instructionText}>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Alert pour les erreurs de like */}
      <Alert
        show={!!likeError}
        message={getAlertMessage()}
        variant="error"
        onClose={clearLikeError}
      >
        {likeError === 'auth_required' && (
          <button onClick={handleLoginRedirect} className={style.loginButton}>
            Se connecter
          </button>
        )}
      </Alert>

      <Footer />
    </>
  );
}
