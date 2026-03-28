import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import social from '../../shared/api/social.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './FluxPage.module.css';
import bodySvgMarkup from '../../components/Exercice/DynamiChoice/BodyPicker/body.svg?raw';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDuration = (sec) => {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`;
  return `${s}s`;
};

const formatVolume = (kg) => {
  if (!kg) return null;
  return kg >= 1000
    ? `${(kg / 1000).toFixed(1).replace('.', ',')} t`
    : `${kg.toLocaleString('fr-FR')} kg`;
};

const formatDateLong = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).replace(',', ' à');
};

const formatDateRelative = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMin = Math.floor((now - d) / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD}j`;
  return formatDateLong(date);
};

const getInitials = (prenom, pseudo) => (prenom || pseudo || '?').charAt(0).toUpperCase();

const MUSCLE_COLORS = {
  'Pectoraux': '#E8895A',
  'Dos': '#7B9CFF',
  'Biceps': '#FF6B8A',
  'Triceps': '#A78BFA',
  'Épaules': '#34D399',
  'Jambes': '#FBBF24',
  'Abdos': '#60A5FA',
  'Mollets': '#F87171',
  'Cardio': '#22D3EE',
};

const CHALLENGE_LABELS = {
  sessions: 'Nombre de séances',
  streak: 'Jours de streak',
  calories: 'Calories brûlées',
  duration: 'Minutes d\'entraînement',
  max_pushups: 'Max Pompes',
  max_pullups: 'Max Tractions',
  max_bench: 'Développé Couché — Max',
  max_squat: 'Squat — Max',
  max_deadlift: 'Soulevé de terre — Max',
  max_burpees: 'Max Burpees',
};

// ─── SVG Diagramme musculaire (body.svg réel) ────────────────────────────────

const FEED_ZONE_MAP = {
  'Pectoraux': 'pectoraux', 'Épaules': 'epaules', 'Biceps': 'biceps',
  'Triceps': 'triceps', 'Abdos': 'abdos-centre', 'Dos': 'dos-inferieur',
  'Jambes': 'cuisses-externes', 'Mollets': 'mollets', 'Cardio': 'abdos-centre',
};

const FEED_INACTIVE_FILL = 'rgba(52,72,94,0.08)';
const FEED_INACTIVE_STROKE = 'rgba(38,48,68,0.2)';

function getZoneName(raw) {
  if (!raw) return null;
  const l = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s._-]+/g, '');
  if (l.includes('pec') || l.includes('chest') || l.includes('pectoraux')) return 'pectoraux';
  if (l.includes('shoulder') || l.includes('epaule') || l.includes('deltoid')) return 'epaules';
  if (l.includes('oblique')) return 'abdos-lateraux';
  if (l.includes('abs') || l.includes('abdo')) return 'abdos-centre';
  if (l.includes('bicep')) return 'biceps';
  if (l.includes('tricep')) return 'triceps';
  if (l.includes('forearm') || l.includes('avantbras')) return 'avant-bras';
  if (l.includes('quad') || l.includes('cuisse') || l.includes('jambe')) return 'cuisses-externes';
  if (l.includes('hamstring') || l.includes('ischio')) return 'cuisses-internes';
  if (l.includes('calf') || l.includes('calves') || l.includes('mollet')) return 'mollets';
  if (l.includes('glute') || l.includes('fess')) return 'fessiers';
  if (l.includes('trap')) return 'dos-superieur';
  if (l.includes('back') || l.includes('dos') || l.includes('lat')) return 'dos-inferieur';
  return null;
}

function FeedBodyDiagram({ muscles }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    host.innerHTML = bodySvgMarkup;
    const svg = host.querySelector('svg');
    if (!svg) return;

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const activeZones = new Set((muscles || []).map(m => FEED_ZONE_MAP[m] || getZoneName(m)).filter(Boolean));

    svg.querySelectorAll('[data-elem]').forEach(node => {
      const zone = getZoneName(node.getAttribute('data-elem') || '');
      if (zone && activeZones.has(zone)) {
        const color = Object.entries(FEED_ZONE_MAP).find(([, z]) => z === zone)?.[0];
        const hex = (color && MUSCLE_COLORS[color]) || '#E89A6F';
        node.style.setProperty('fill', hex + 'CC', 'important');
        node.style.setProperty('stroke', hex, 'important');
        node.style.setProperty('stroke-width', '1.5', 'important');
      } else {
        node.style.setProperty('fill', FEED_INACTIVE_FILL, 'important');
        node.style.setProperty('stroke', FEED_INACTIVE_STROKE, 'important');
        node.style.setProperty('stroke-width', '0.5', 'important');
      }
    });

    return () => { host.innerHTML = ''; };
  }, [muscles]);

  return (
    <div className={styles.bodyDiagram}>
      <div ref={containerRef} className={styles.bodySvg} />
    </div>
  );
}

// ─── Section commentaires ─────────────────────────────────────────────────────

function CommentSection({ postId, postType, onCountChange, myId }) {
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    social.getComments(postId)
      .then(res => { setComments(res.data?.comments || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [postId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const res = await social.addComment(postId, text, postType);
      const newComment = res.data?.comment;
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        onCountChange?.(prev => prev + 1);
      }
    } catch { setInput(text); }
    finally { setSending(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await social.deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      onCountChange?.(prev => Math.max(0, prev - 1));
    } catch {}
  };

  if (!loaded) return <div className={styles.commentsLoading}>Chargement…</div>;

  return (
    <div className={styles.commentSection}>
      {comments.map(c => (
        <div key={c._id} className={styles.commentRow}>
          <div className={styles.commentAvatar}>
            {c.userAvatar
              ? <img src={c.userAvatar} alt="" className={styles.commentAvatarImg} />
              : <span className={styles.commentAvatarLetter}>{(c.userName || '?').charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className={styles.commentBubble}>
            <span className={styles.commentAuthor}>{c.userName}</span>
            <span className={styles.commentContent}>{c.content}</span>
          </div>
          {myId && (c.userId === myId || c.userId?.toString() === myId?.toString()) && (
            <button className={styles.commentDeleteBtn} onClick={() => handleDelete(c._id)} title="Supprimer">✕</button>
          )}
        </div>
      ))}
      <form className={styles.commentForm} onSubmit={handleSend}>
        <input
          className={styles.commentInput}
          placeholder="Ajouter un commentaire…"
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={300}
          disabled={sending}
        />
        <button type="submit" className={styles.commentSendBtn} disabled={!input.trim() || sending}>
          {sending ? '…' : '↑'}
        </button>
      </form>
    </div>
  );
}

// ─── Barre de réactions partagée ─────────────────────────────────────────────

function ReactionBar({ itemId, targetType, isLiked, likesCount, commentsCount: initialCommentsCount }) {
  const { user: me } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [count, setCount] = useState(likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount || 0);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount(c => wasLiked ? c - 1 : c + 1);
    try {
      if (wasLiked) await social.unlikePost(itemId);
      else await social.likePost(itemId, targetType);
    } catch {
      setLiked(wasLiked);
      setCount(c => wasLiked ? c + 1 : c - 1);
    }
  };

  return (
    <div>
      <div className={styles.reactionBar}>
        <button
          className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
          onClick={handleLike}
          aria-label={liked ? 'Retirer le j\'aime' : 'J\'aime'}
        >
          <HeartIcon filled={liked} />
          <span className={styles.likeBtnCount}>{count > 0 ? count : ''}</span>
        </button>
        <button
          className={`${styles.commentBtn} ${showComments ? styles.commentBtnActive : ''}`}
          onClick={(e) => { e.stopPropagation(); setShowComments(s => !s); }}
          aria-label="Commentaires"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={showComments ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className={styles.likeBtnCount}>{commentsCount > 0 ? commentsCount : ''}</span>
        </button>
      </div>
      {showComments && (
        <CommentSection
          postId={itemId}
          postType={targetType}
          onCountChange={setCommentsCount}
          myId={me?._id}
        />
      )}
    </div>
  );
}

// ─── Card : Séance d'entraînement ─────────────────────────────────────────────

function WorkoutCard({ item }) {
  const user = item.user || {};
  const d = item.data;
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const muscles = d.muscleGroups || [];
  const primary = muscles.slice(0, 3);
  const secondary = muscles.slice(3);

  return (
    <article className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <Link to={`/social/u/${user._id}`} className={styles.userRow}>
          {user.photo
            ? <img src={user.photo} alt="" className={styles.avatar} />
            : <div className={styles.avatarPlaceholder}>{getInitials(user.prenom, user.pseudo)}</div>
          }
          <div className={styles.userMeta}>
            <div className={styles.userName}>{user.prenom || user.pseudo || 'Utilisateur'}</div>
            <div className={styles.userDate}>
              <WorkoutIcon />
              {formatDateLong(item.date)}
            </div>
          </div>
        </Link>
        <button className={styles.menuBtn} onClick={() => navigate(`/social/u/${user._id}`)}>
          <DotsIcon />
        </button>
      </div>

      {/* Titre */}
      <div className={styles.workoutName}>{d.name}</div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCell}>
          <div className={styles.statLabel}>Durée</div>
          <div className={styles.statValue}>{formatDuration(d.durationSec)}</div>
        </div>
        {d.volumeKg > 0 && <>
          <div className={styles.statDivider} />
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Volume</div>
            <div className={styles.statValue}>{formatVolume(d.volumeKg)}</div>
          </div>
        </>}
        {d.calories > 0 && <>
          <div className={styles.statDivider} />
          <div className={styles.statCell}>
            <div className={styles.statLabel}>Calories</div>
            <div className={styles.statValue}>{d.calories} kcal</div>
          </div>
        </>}
      </div>

      {/* Bloc muscles + diagramme */}
      {muscles.length > 0 && (
        <div className={styles.muscleBlock}>
          <div className={styles.muscleLegend}>
            {primary.length > 0 && (
              <>
                <div className={styles.muscleSection}>Principal</div>
                <div className={styles.muscleTags}>
                  {primary.map((m, i) => {
                    const color = MUSCLE_COLORS[m] || '#E89A6F';
                    return (
                      <span key={i} className={styles.muscleTag}
                        style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
                        {m}
                      </span>
                    );
                  })}
                  {!expanded && secondary.length > 0 && (
                    <button className={styles.muscleTagMore} onClick={() => setExpanded(true)}>
                      + {secondary.length} Plus
                    </button>
                  )}
                </div>
              </>
            )}
            {expanded && secondary.length > 0 && (
              <>
                <div className={styles.muscleSection} style={{ marginTop: 8 }}>Secondaire</div>
                <div className={styles.muscleTags}>
                  {secondary.map((m, i) => {
                    const color = MUSCLE_COLORS[m] || '#E89A6F';
                    return (
                      <span key={i} className={styles.muscleTag}
                        style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
                        {m}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <FeedBodyDiagram muscles={muscles} />
        </div>
      )}

      {/* PRs */}
      {d.highlights?.length > 0 && (
        <div className={styles.highlights}>
          {d.highlights.map((h, i) => (
            <div key={i} className={styles.prRow}>
              <TrophyIcon />
              <span className={styles.prLabel}>PR</span>
              <span className={styles.prExercise}>{h.exerciseName}</span>
              <span className={styles.prValue}>
                {h.weight ? `${h.weight}kg` : ''}{h.weight && h.reps ? ' · ' : ''}{h.reps ? `${h.reps} reps` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <ReactionBar itemId={item._id} targetType="workout" isLiked={d.isLiked} likesCount={d.likesCount} commentsCount={d.commentsCount || 0} />
    </article>
  );
}

// ─── Card : Repas ─────────────────────────────────────────────────────────────

const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

function MealCard({ item }) {
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
        <div className={styles.statsRow} style={{ marginTop: 8 }}>
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

// ─── Card : Recette ───────────────────────────────────────────────────────────

const RECIPE_TAGS = {
  high_protein: 'Haute protéine',
  low_carb: 'Low carb',
  quick: 'Rapide',
  no_sugar: 'Sans sucre',
  meal_prep: 'Meal prep',
  budget_friendly: 'Éco',
};

function RecipeCard({ item }) {
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

// ─── Card : Défi terminé ──────────────────────────────────────────────────────

function ChallengeCard({ item }) {
  const d = item.data;
  const challenger = d.challenger || {};
  const challenged = d.challenged || {};
  const winnerId = d.winnerId;

  const isMax = d.challengeCategory === 'max';
  const label = CHALLENGE_LABELS[d.challengeType] || d.challengeType;

  const formatScore = (score, unit) => {
    if (score == null) return '—';
    if (unit === 'kg') return `${score} kg`;
    if (unit === 'reps') return `${score} reps`;
    if (unit === 'sec') return `${score}s`;
    return String(score);
  };

  return (
    <article className={styles.card}>
      <div className={styles.challengeHeader}>
        <span className={styles.challengeBadge}>⚡ Défi terminé</span>
        <span className={styles.challengeLabel}>{label}</span>
      </div>

      <div className={styles.challengeVS}>
        {/* Challenger */}
        <div className={`${styles.vsPlayer} ${winnerId && challenger._id?.toString() === winnerId.toString() ? styles.vsWinner : ''}`}>
          <Link to={`/social/u/${challenger._id}`}>
            {challenger.photo
              ? <img src={challenger.photo} alt="" className={styles.vsAvatar} />
              : <div className={styles.vsAvatarPlaceholder}>{getInitials(challenger.prenom, challenger.pseudo)}</div>
            }
          </Link>
          <div className={styles.vsName}>{challenger.prenom || challenger.pseudo || '?'}</div>
          <div className={styles.vsScore}>
            {isMax ? formatScore(d.challengerResult, d.resultUnit) : d.challengerScore ?? '—'}
          </div>
          {winnerId && challenger._id?.toString() === winnerId.toString() && (
            <div className={styles.winnerBadge}>🏆 Vainqueur</div>
          )}
        </div>

        <div className={styles.vsLabel}>VS</div>

        {/* Challenged */}
        <div className={`${styles.vsPlayer} ${winnerId && challenged._id?.toString() === winnerId.toString() ? styles.vsWinner : ''}`}>
          <Link to={`/social/u/${challenged._id}`}>
            {challenged.photo
              ? <img src={challenged.photo} alt="" className={styles.vsAvatar} />
              : <div className={styles.vsAvatarPlaceholder}>{getInitials(challenged.prenom, challenged.pseudo)}</div>
            }
          </Link>
          <div className={styles.vsName}>{challenged.prenom || challenged.pseudo || '?'}</div>
          <div className={styles.vsScore}>
            {isMax ? formatScore(d.challengedResult, d.resultUnit) : d.challengedScore ?? '—'}
          </div>
          {winnerId && challenged._id?.toString() === winnerId.toString() && (
            <div className={styles.winnerBadge}>🏆 Vainqueur</div>
          )}
        </div>
      </div>

      {!winnerId && (
        <div className={styles.drawResult}>🤝 Égalité parfaite !</div>
      )}

      {d.rewardXp > 0 && winnerId && (
        <div className={styles.rewardInfo}>+{d.rewardXp} XP remportés</div>
      )}
      <ReactionBar itemId={item._id} targetType="challenge" isLiked={item.data.isLiked} likesCount={item.data.likesCount} commentsCount={item.data.commentsCount || 0} />
    </article>
  );
}

// ─── Dispatcher de cards ──────────────────────────────────────────────────────

function FeedCard({ item }) {
  switch (item.type) {
    case 'workout': return <WorkoutCard item={item} />;
    case 'meal':    return <MealCard item={item} />;
    case 'recipe':  return <RecipeCard item={item} />;
    case 'challenge': return <ChallengeCard item={item} />;
    default: return null;
  }
}

// ─── Recherche partagée (hook) ────────────────────────────────────────────────

function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [followState, setFollowState] = useState({});
  const debounceRef = useRef(null);

  const search = useCallback((text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await social.searchUsers(text.trim());
        const users = res.data.users || [];
        setResults(users);
        const state = {};
        users.forEach(u => { state[u._id] = u.isFollowing; });
        setFollowState(state);
      } catch { /* noop */ }
      finally { setSearching(false); }
    }, 300);
  }, []);

  const handleFollow = async (e, userId) => {
    e.preventDefault(); e.stopPropagation();
    const was = followState[userId];
    setFollowState(prev => ({ ...prev, [userId]: !was }));
    try {
      if (was) await social.unfollow(userId);
      else await social.follow(userId);
    } catch { setFollowState(prev => ({ ...prev, [userId]: was })); }
  };

  return { query, results, searching, followState, search, handleFollow };
}

// ─── Résultats de recherche partagés ─────────────────────────────────────────

function SearchResults({ results, searching, query, followState, handleFollow }) {
  return (
    <>
      {searching && <div style={{ textAlign: 'center', padding: '8px 0' }}><div className={styles.spinner} /></div>}
      {results.map(user => (
        <Link key={user._id} to={`/social/u/${user._id}`} className={styles.resultRow}>
          {user.photo
            ? <img src={user.photo} alt="" className={styles.resultAvatar} />
            : <div className={styles.resultAvatarPlaceholder}>{getInitials(user.prenom, user.pseudo)}</div>
          }
          <div className={styles.resultMeta}>
            <div className={styles.resultName}>{user.prenom || user.pseudo}</div>
            {user.pseudo && <div className={styles.resultPseudo}>@{user.pseudo}</div>}
          </div>
          <button
            className={`${styles.followBtn} ${followState[user._id] ? styles.followBtnFollowing : styles.followBtnFollow}`}
            onClick={(e) => handleFollow(e, user._id)}
          >
            {followState[user._id] ? '✓ Suivi' : '+ Suivre'}
          </button>
        </Link>
      ))}
      {query.length >= 2 && !searching && results.length === 0 && (
        <p style={{ color: '#AAA', fontSize: 13, textAlign: 'center', padding: '12px 0', margin: 0 }}>Aucun résultat</p>
      )}
    </>
  );
}

// ─── Recherche inline (mobile/tablette, en tête du feed) ──────────────────────

function InlineSearch() {
  const { query, results, searching, followState, search, handleFollow } = useSearch();
  return (
    <div className={styles.inlineSearch}>
      <div className={styles.inlineSearchInner}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Rechercher des sportifs..."
          value={query}
          onChange={e => search(e.target.value)}
          autoComplete="off"
        />
      </div>
      {(query.length >= 2 || searching) && (
        <div className={styles.inlineSearchResults}>
          <SearchResults results={results} searching={searching} query={query} followState={followState} handleFollow={handleFollow} />
        </div>
      )}
    </div>
  );
}

// ─── Sidebar desktop ──────────────────────────────────────────────────────────

function Sidebar() {
  const { query, results, searching, followState, search, handleFollow } = useSearch();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sideCard}>
        <div className={styles.sideTitle}>Trouver des sportifs</div>
        <div className={styles.searchBar}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Pseudo, prénom..."
            value={query}
            onChange={e => search(e.target.value)}
            autoComplete="off"
          />
        </div>
        <SearchResults results={results} searching={searching} query={query} followState={followState} handleFollow={handleFollow} />
        {query.length === 0 && (
          <p style={{ color: '#BBB', fontSize: 13, textAlign: 'center', padding: '8px 0', margin: 0 }}>Recherchez par pseudo ou prénom</p>
        )}
      </div>
    </aside>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function FluxPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const res = await social.getFeed(currentPage);
      const { items: newItems, hasMore: more } = res.data;
      if (reset) {
        setItems(newItems || []);
        setPage(2);
      } else {
        setItems(prev => [...prev, ...(newItems || [])]);
        setPage(p => p + 1);
      }
      setHasMore(more);
    } catch { /* noop */ }
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => { loadFeed(true); }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled >= total - 400) {
        setLoadingMore(true);
        loadFeed(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, loadFeed]);

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.layout}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Flux</h1>
          <p className={styles.pageSubtitle}>Séances, repas, recettes et défis de ceux que vous suivez</p>
        </div>

        {/* Recherche en tête — visible sur mobile/tablette, masquée sur desktop (remplacée par sidebar) */}
        <InlineSearch />

        <main className={styles.feed}>
          {loading ? (
            <div className={styles.loader}><div className={styles.spinner} /></div>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <div className={styles.emptyTitle}>Votre flux est vide</div>
              <div className={styles.emptySubtitle}>
                Suivez des sportifs pour voir leurs séances, repas, recettes et défis ici.
              </div>
            </div>
          ) : (
            <>
              {items.map(item => <FeedCard key={`${item.type}-${item._id}`} item={item} />)}
              {loadingMore && <div className={styles.loadMore}><div className={styles.spinner} /></div>}
              {!hasMore && items.length > 0 && (
                <div className={styles.endOfFeed}>Vous êtes à jour ✓</div>
              )}
            </>
          )}
        </main>

        <Sidebar />
      </div>
      <Footer />
    </div>
  );
}

// ─── Icônes inline ────────────────────────────────────────────────────────────

function WorkoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6.5 6.5h11M6 12h12"/><rect x="2" y="10" width="3" height="4" rx="1"/><rect x="19" y="10" width="3" height="4" rx="1"/>
    </svg>
  );
}
function NutritionIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 2l1.5 1.5M3 6l1.5-1.5M5 4H3M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
function RecipeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/>
    </svg>
  );
}
function TrophyIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
}
function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#E89A6F' : 'none'} stroke={filled ? '#E89A6F' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
    </svg>
  );
}
function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
