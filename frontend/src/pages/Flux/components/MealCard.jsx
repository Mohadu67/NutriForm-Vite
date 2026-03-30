import { Link } from 'react-router-dom';
import { getInitials, formatDateLong } from '../utils';
import { NutritionIcon } from './Icons';
import ReactionBar from './ReactionBar';
import styles from '../FluxPage.module.css';

const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export default function MealCard({ item }) {
  const user = item.user || {};
  const d = item.data;

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
              <NutritionIcon />
              {formatDateLong(item.date)}
            </div>
          </div>
        </Link>
      </div>

      <div className={styles.activityBanner} data-type="meal">
        <span className={styles.activityIcon}>{MEAL_ICONS[d.mealType] || '🍽️'}</span>
        <div>
          <div className={styles.activityLabel}>{d.mealLabel}</div>
          <div className={styles.activityTitle}>{d.name}</div>
          {d.recipeTitle && d.recipeTitle !== d.name && (
            <div className={styles.activitySub}>via {d.recipeTitle}</div>
          )}
        </div>
      </div>

      {d.nutrition && (
        <div className={`${styles.statsRow} ${styles.statsRowSpaced}`}>
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

      {d.notes && <div className={styles.cardNotes}>"{d.notes}"</div>}
      <ReactionBar itemId={item._id} targetType="meal" isLiked={item.data.isLiked} likesCount={item.data.likesCount} commentsCount={item.data.commentsCount || 0} />
    </article>
  );
}
