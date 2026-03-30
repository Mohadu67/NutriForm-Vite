import { Link, useNavigate } from 'react-router-dom';
import { getInitials, formatDateLong } from '../utils';
import { RecipeIcon } from './Icons';
import ReactionBar from './ReactionBar';
import styles from '../FluxPage.module.css';

const RECIPE_TAGS = {
  high_protein: 'Haute protéine',
  low_carb: 'Low carb',
  quick: 'Rapide',
  no_sugar: 'Sans sucre',
  meal_prep: 'Meal prep',
  budget_friendly: 'Éco',
};

export default function RecipeCard({ item }) {
  const user = item.user || {};
  const d = item.data;
  const navigate = useNavigate();

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <Link to={`/social/u/${user._id}`} className={styles.userRow}>
          {user.photo
            ? <img src={user.photo} alt="" className={styles.avatar} />
            : <div className={styles.avatarPlaceholder}>{getInitials(user.prenom, user.pseudo)}</div>
          }
          <div className={styles.userMeta}>
            <div className={styles.userName}>{user.prenom || user.pseudo || 'Utilisateur'}</div>
            <div className={styles.userDate}>
              <RecipeIcon />
              {formatDateLong(item.date)}
            </div>
          </div>
        </Link>
      </div>

      <div className={styles.activityBanner} data-type="recipe">
        <span className={styles.activityIcon}>👨‍🍳</span>
        <div>
          <div className={styles.activityLabel}>A créé une recette</div>
          <div className={styles.activityTitle}>{d.title}</div>
          {d.totalTime > 0 && <div className={styles.activitySub}>{d.totalTime} min · {d.servings} portions</div>}
        </div>
      </div>

      {d.image && (
        <div className={styles.recipeImageWrap}>
          <img src={d.image} alt={d.title} className={styles.recipeImage} />
        </div>
      )}

      {d.nutrition && (
        <div className={styles.statsRow}>
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Calories</div>
            <div className={styles.statValue}>{Math.round(d.nutrition.calories)} kcal</div>
          </div>
          {d.nutrition.proteins > 0 && <>
            <div className={styles.statDivider} />
            <div className={styles.statCell}>
              <div className={styles.statLabel}>Protéines</div>
              <div className={styles.statValue}>{Math.round(d.nutrition.proteins)}g</div>
            </div>
          </>}
          {d.nutrition.carbs > 0 && <>
            <div className={styles.statDivider} />
            <div className={styles.statCell}>
              <div className={styles.statLabel}>Glucides</div>
              <div className={styles.statValue}>{Math.round(d.nutrition.carbs)}g</div>
            </div>
          </>}
        </div>
      )}

      {d.tags?.length > 0 && (
        <div className={styles.muscleTags} style={{ marginTop: 8 }}>
          {d.tags.slice(0, 3).map((t, i) => (
            <span key={i} className={styles.muscleTag}
              style={{ color: '#E89A6F', background: '#E89A6F18', borderColor: '#E89A6F40' }}>
              {RECIPE_TAGS[t] || t}
            </span>
          ))}
        </div>
      )}

      <button className={styles.viewRecipeBtn} onClick={() => navigate(`/recettes/${d.slug}`)}>
        Voir la recette →
      </button>
      <ReactionBar itemId={item._id} targetType="recipe" isLiked={item.data.isLiked} likesCount={item.data.likesCount} commentsCount={item.data.commentsCount || 0} />
    </article>
  );
}
