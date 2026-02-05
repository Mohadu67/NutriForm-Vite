import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, FireIcon, UtensilsIcon, ZapIcon, XCircleIcon } from '../../../components/Navbar/NavIcons';
import { getProxiedImageUrl } from '../../../utils/imageProxy';
import style from './RecipeCard.module.css';

export default function RecipeCard({ recipe }) {
  const nutritionPerServing = useMemo(() => ({
    calories: Math.round(recipe.nutrition.calories / recipe.servings),
    proteins: Math.round(recipe.nutrition.proteins / recipe.servings),
    carbs: Math.round(recipe.nutrition.carbs / recipe.servings),
    fats: Math.round(recipe.nutrition.fats / recipe.servings)
  }), [recipe.nutrition, recipe.servings]);

  return (
    <Link to={`/recettes/${recipe._id}`} className={style.card}>
      <div className={style.imageContainer}>
        <img
          src={getProxiedImageUrl(recipe.image)}
          alt={recipe.title}
          className={style.image}
          loading="eager"
        />
        {recipe.isPremium && (
          <span className={style.premiumBadge}>Premium</span>
        )}
        <div className={style.tags}>
          {recipe.tags.includes('quick') && (
            <span className={style.tag}>
              <ZapIcon size={14} /> Rapide
            </span>
          )}
          {recipe.tags.includes('no_sugar') && (
            <span className={style.tag}>
              <XCircleIcon size={14} /> Sans sucre
            </span>
          )}
        </div>
      </div>

      <div className={style.content}>
        <h3 className={style.title}>{recipe.title}</h3>
        <p className={style.description}>{recipe.description}</p>

        <div className={style.meta}>
          <div className={style.metaItem}>
            <span className={style.icon}>
              <ClockIcon size={16} />
            </span>
            <span>{recipe.totalTime} min</span>
          </div>
          <div className={style.metaItem}>
            <span className={style.icon}>
              <FireIcon size={16} />
            </span>
            <span>{nutritionPerServing.calories} kcal</span>
          </div>
          <div className={style.metaItem}>
            <span className={style.icon}>
              <UtensilsIcon size={16} />
            </span>
            <span>{recipe.servings} parts</span>
          </div>
        </div>

        <div className={style.nutrition}>
          <div className={style.nutritionItem}>
            <span className={style.nutritionLabel}>P</span>
            <span>{nutritionPerServing.proteins}g</span>
          </div>
          <div className={style.nutritionItem}>
            <span className={style.nutritionLabel}>G</span>
            <span>{nutritionPerServing.carbs}g</span>
          </div>
          <div className={style.nutritionItem}>
            <span className={style.nutritionLabel}>L</span>
            <span>{nutritionPerServing.fats}g</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
