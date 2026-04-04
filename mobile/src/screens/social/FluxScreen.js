import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  TextInput, Modal, ActivityIndicator, RefreshControl,
  useColorScheme, Animated, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

import social from '../../api/social';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Type mappings ──────────────────────────────────────────────────────────

const TYPE_COLORS = {
  workout:        '#f0a47a',
  meal:           '#72baa1',
  recipe:         '#8b7fc7',
  challenge:      '#d4a96a',
  shared_session: '#72baa1',
};

const TYPE_ICONS = {
  workout:        'barbell-outline',
  meal:           'nutrition-outline',
  recipe:         'book-outline',
  challenge:      'trophy-outline',
  shared_session: 'flash-outline',
};

const TYPE_LABELS = {
  workout:        'Séance',
  meal:           'Repas',
  recipe:         'Recette',
  challenge:      'Défi',
  shared_session: 'Séance Duo',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDuration = (sec) => {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`.trim();
  return `${s}s`;
};

const formatVolume = (kg) => {
  if (!kg) return '—';
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.', ',')} t`;
  return `${kg.toLocaleString('fr-FR')} kg`;
};

const formatDateRelative = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMin = Math.floor((now - d) / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `${diffD}j`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getInitials = (prenom, pseudo) => (prenom || pseudo || '?').charAt(0).toUpperCase();

const MUSCLE_COLORS = {
  'Pectoraux': '#72baa1', 'Dos': '#f0a47a', 'Biceps': '#e8829b',
  'Triceps': '#8b7fc7', 'Épaules': '#72baa1', 'Jambes': '#d4a96a',
  'Abdos': '#f0a47a', 'Mollets': '#c9a88c', 'Cardio': '#72baa1',
};

const CHALLENGE_LABELS = {
  sessions: 'Séances', streak: 'Streak', calories: 'Calories', duration: 'Minutes',
  max_pushups: 'Max Pompes', max_pullups: 'Max Tractions',
  max_bench: 'Développé couché', max_squat: 'Squat', max_deadlift: 'Soulevé de terre',
  max_burpees: 'Max Burpees',
};

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

// ─── Composants partagés ────────────────────────────────────────────────────

function Avatar({ user, size = 44 }) {
  if (user?.photo) {
    return <Image source={{ uri: user.photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <LinearGradient
      colors={['#72baa1', '#a8d8c8']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#FFF' }}>
        {getInitials(user?.prenom, user?.pseudo)}
      </Text>
    </LinearGradient>
  );
}

function MuscleTag({ muscle, isDark }) {
  const color = MUSCLE_COLORS[muscle] || '#72baa1';
  return (
    <View style={[styles.muscleTag, { backgroundColor: `${color}18`, borderColor: `${color}40`, borderWidth: 1 }]}>
      <Text style={[styles.muscleTagText, { color }]}>{muscle}</Text>
    </View>
  );
}

function CardHeader({ user, date, type, isDark, onUserPress }) {
  const color = TYPE_COLORS[type] || '#72baa1';
  return (
    <View style={styles.cardHeader}>
      <TouchableOpacity style={styles.userRow} onPress={() => onUserPress(user?._id)} activeOpacity={0.7}>
        <Avatar user={user} />
        <View style={styles.userMeta}>
          <Text style={[styles.userName, isDark && styles.textLight]} numberOfLines={1}>
            {user?.prenom || user?.pseudo || 'Utilisateur'}
          </Text>
          <Text style={[styles.dateText, isDark && styles.textMuted]}>{formatDateRelative(date)}</Text>
        </View>
      </TouchableOpacity>
      <View style={[styles.typeBadge, { backgroundColor: `${color}15` }]}>
        <Ionicons name={TYPE_ICONS[type]} size={12} color={color} />
        <Text style={[styles.typeBadgeText, { color }]}>{TYPE_LABELS[type]}</Text>
      </View>
    </View>
  );
}

// ─── Comment Section ────────────────────────────────────────────────────────

function CommentSection({ postId, postType, isDark, onCountChange, myId }) {
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await social.getComments(postId);
      setComments(res.data?.comments || []);
    } catch (err) {
      console.warn('[CommentSection] Erreur chargement commentaires:', err?.message || err);
    }
    setLoaded(true);
  }, [postId]);

  React.useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const res = await social.addComment(postId, text, postType);
      const newComment = res.data?.comment;
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        onCountChange?.(comments.length + 1);
      }
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await social.deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      onCountChange?.(Math.max(0, comments.length - 1));
    } catch {}
  };

  return (
    <View style={[styles.commentSection, isDark && styles.commentSectionDark]}>
      {!loaded && <ActivityIndicator size="small" color="#72baa1" style={{ marginVertical: 8 }} />}

      {comments.map(c => (
        <View key={c._id} style={styles.commentRow}>
          <View style={[styles.commentAvatar, isDark && styles.commentAvatarDark]}>
            {c.userAvatar
              ? <Image source={{ uri: c.userAvatar }} style={styles.commentAvatarImg} />
              : <Text style={[styles.commentAvatarLetter, { color: '#72baa1' }]}>
                  {(c.userName || '?').charAt(0).toUpperCase()}
                </Text>
            }
          </View>
          <View style={styles.commentBubble}>
            <View style={[styles.commentBubbleInner, isDark && styles.commentBubbleInnerDark]}>
              <Text style={[styles.commentAuthor, isDark && styles.textLight]}>{c.userName}</Text>
              <Text style={[styles.commentContent, isDark && styles.textMuted]}>{c.content}</Text>
            </View>
            {myId && c.userId?.toString() === myId?.toString() && (
              <TouchableOpacity onPress={() => handleDelete(c._id)} style={styles.commentDeleteBtn} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={13} color={isDark ? '#7a7a88' : '#a8a29e'} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.commentInputRow, isDark && styles.commentInputRowDark]}>
          <TextInput
            style={[styles.commentInput, isDark && styles.commentInputDark]}
            placeholder="Ajouter un commentaire…"
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
            value={input}
            onChangeText={setInput}
            maxLength={300}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={[styles.commentSendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
            activeOpacity={0.7}
          >
            {sending
              ? <ActivityIndicator size="small" color="#72baa1" />
              : <Ionicons name="send" size={18} color="#72baa1" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Reaction Bar ───────────────────────────────────────────────────────────

function ReactionBar({ targetId, targetType, initialLiked, initialCount, initialCommentsCount, isDark }) {
  const { user: me } = useAuth();
  const [liked, setLiked] = useState(initialLiked || false);
  const [count, setCount] = useState(initialCount || 0);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount || 0);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount(c => wasLiked ? c - 1 : c + 1);
    try {
      if (wasLiked) await social.unlikePost(targetId);
      else await social.likePost(targetId, targetType);
    } catch {
      setLiked(wasLiked);
      setCount(c => wasLiked ? c + 1 : c - 1);
    }
  };

  return (
    <View>
      <View style={[styles.reactionBar, isDark && styles.reactionBarDark]}>
        <View style={styles.reactionLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.reactionBtn} activeOpacity={0.7}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? '#ef4444' : (isDark ? '#7a7a88' : '#a8a29e')}
            />
            {count > 0 && (
              <Text style={[styles.reactionCount, isDark && styles.textMuted]}>{count}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowComments(s => !s)} style={styles.reactionBtn} activeOpacity={0.7}>
            <Ionicons
              name={showComments ? 'chatbubble' : 'chatbubble-outline'}
              size={20}
              color={showComments ? '#72baa1' : (isDark ? '#7a7a88' : '#a8a29e')}
            />
            {commentsCount > 0 && (
              <Text style={[styles.reactionCount, isDark && styles.textMuted]}>{commentsCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {showComments && (
        <CommentSection
          postId={targetId}
          postType={targetType}
          isDark={isDark}
          onCountChange={setCommentsCount}
          myId={me?._id}
        />
      )}
    </View>
  );
}

// ─── Card : Séance ──────────────────────────────────────────────────────────

function WorkoutCard({ item, isDark, onUserPress }) {
  const d = item.data;
  const [showAllMuscles, setShowAllMuscles] = useState(false);
  const muscles = d.muscleGroups || [];
  const visibleMuscles = showAllMuscles ? muscles : muscles.slice(0, 4);
  const remaining = muscles.length - 4;

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={{ height: 3, backgroundColor: TYPE_COLORS.workout, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
      <View style={styles.cardInner}>
        <CardHeader user={item.user} date={item.date} type="workout" isDark={isDark} onUserPress={onUserPress} />

        <Text style={[styles.workoutName, isDark && styles.textLight]} numberOfLines={2}>{d.name || 'Séance'}</Text>

        <View style={[styles.statsRow, isDark && styles.statsRowDark]}>
          <View style={styles.statCell}>
            <Text style={[styles.statLabel, isDark && styles.textMuted]}>DURÉE</Text>
            <Text style={[styles.statValue, isDark && styles.textLight]}>{formatDuration(d.durationSec)}</Text>
          </View>
          {d.volumeKg > 0 && <>
            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>VOLUME</Text>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{formatVolume(d.volumeKg)}</Text>
            </View>
          </>}
          {d.calories > 0 && <>
            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>CALORIES</Text>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{d.calories} kcal</Text>
            </View>
          </>}
        </View>

        {d.highlights?.length > 0 && (
          <View style={styles.highlightsSection}>
            {d.highlights.map((h, i) => (
              <View key={i} style={[styles.prRow, isDark && styles.prRowDark]}>
                <Ionicons name="trophy" size={14} color="#72baa1" />
                <Text style={styles.prLabel}>PR</Text>
                <Text style={[styles.prExercise, isDark && styles.textLight]} numberOfLines={1}>{h.exerciseName}</Text>
                <Text style={styles.prValue}>
                  {h.weight ? `${h.weight}kg` : ''}{h.weight && h.reps ? ' · ' : ''}{h.reps ? `${h.reps} reps` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {muscles.length > 0 && (
          <View style={styles.musclesRow}>
            {visibleMuscles.map((m, i) => <MuscleTag key={i} muscle={m} isDark={isDark} />)}
            {!showAllMuscles && remaining > 0 && (
              <TouchableOpacity onPress={() => setShowAllMuscles(true)}
                style={[styles.muscleTagMore, isDark && styles.muscleTagMoreDark]}>
                <Text style={[styles.muscleTagMoreText, isDark && styles.textMuted]}>+{remaining}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <ReactionBar targetId={item._id} targetType="workout" initialLiked={d.isLiked} initialCount={d.likesCount} initialCommentsCount={d.commentsCount || 0} isDark={isDark} />
      </View>
    </View>
  );
}

// ─── Card : Repas ───────────────────────────────────────────────────────────

function MealCard({ item, isDark, onUserPress }) {
  const d = item.data;
  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={{ height: 3, backgroundColor: TYPE_COLORS.meal, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
      <View style={styles.cardInner}>
        <CardHeader user={item.user} date={item.date} type="meal" isDark={isDark} onUserPress={onUserPress} />

        <View style={[styles.activityBanner, { backgroundColor: isDark ? '#1f1f26' : '#f5f5f4' }]}>
          <Text style={styles.activityEmoji}>{MEAL_ICONS[d.mealType] || '🍽️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activityLabel, { color: '#72baa1' }]}>{d.mealLabel || d.mealType}</Text>
            <Text style={[styles.activityTitle, isDark && styles.textLight]} numberOfLines={2}>{d.name}</Text>
            {d.recipeTitle && d.recipeTitle !== d.name && (
              <Text style={[styles.activitySub, isDark && styles.textMuted]}>via {d.recipeTitle}</Text>
            )}
          </View>
        </View>

        {d.nutrition && (
          <View style={[styles.statsRow, isDark && styles.statsRowDark]}>
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>CALORIES</Text>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{Math.round(d.nutrition.calories)} kcal</Text>
            </View>
            {d.nutrition.proteins > 0 && <>
              <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
              <View style={styles.statCell}>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>PROTÉINES</Text>
                <Text style={[styles.statValue, isDark && styles.textLight]}>{Math.round(d.nutrition.proteins)}g</Text>
              </View>
            </>}
            {d.nutrition.carbs > 0 && <>
              <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
              <View style={styles.statCell}>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>GLUCIDES</Text>
                <Text style={[styles.statValue, isDark && styles.textLight]}>{Math.round(d.nutrition.carbs)}g</Text>
              </View>
            </>}
          </View>
        )}

        {d.notes ? <Text style={[styles.cardNotes, isDark && styles.cardNotesDark]}>"{d.notes}"</Text> : null}
        <ReactionBar targetId={item._id} targetType="meal" initialLiked={d.isLiked} initialCount={d.likesCount || 0} initialCommentsCount={d.commentsCount || 0} isDark={isDark} />
      </View>
    </View>
  );
}

// ─── Card : Recette ─────────────────────────────────────────────────────────

const RECIPE_TAGS = {
  high_protein: 'Haute protéine', low_carb: 'Low carb', quick: 'Rapide',
  no_sugar: 'Sans sucre', meal_prep: 'Meal prep', budget_friendly: 'Éco',
};

function RecipeCard({ item, isDark, onUserPress }) {
  const d = item.data;
  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={{ height: 3, backgroundColor: TYPE_COLORS.recipe, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
      <View style={styles.cardInner}>
        <CardHeader user={item.user} date={item.date} type="recipe" isDark={isDark} onUserPress={onUserPress} />

        <View style={[styles.activityBanner, { backgroundColor: isDark ? '#1f1f26' : '#f5f5f4' }]}>
          <Text style={styles.activityEmoji}>👨‍🍳</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activityLabel, { color: '#8b7fc7' }]}>A créé une recette</Text>
            <Text style={[styles.activityTitle, isDark && styles.textLight]} numberOfLines={2}>{d.title}</Text>
            {d.totalTime > 0 && (
              <Text style={[styles.activitySub, isDark && styles.textMuted]}>
                {d.totalTime} min · {d.servings} portion{d.servings > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        {d.image ? (
          <Image source={{ uri: d.image }} style={styles.recipeImage} resizeMode="cover" />
        ) : null}

        {d.nutrition && (
          <View style={[styles.statsRow, isDark && styles.statsRowDark]}>
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>CALORIES</Text>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{Math.round(d.nutrition.calories)} kcal</Text>
            </View>
            {d.nutrition.proteins > 0 && <>
              <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
              <View style={styles.statCell}>
                <Text style={[styles.statLabel, isDark && styles.textMuted]}>PROTÉINES</Text>
                <Text style={[styles.statValue, isDark && styles.textLight]}>{Math.round(d.nutrition.proteins)}g</Text>
              </View>
            </>}
          </View>
        )}

        {d.tags?.length > 0 && (
          <View style={styles.musclesRow}>
            {d.tags.slice(0, 3).map((t, i) => (
              <View key={i} style={[styles.muscleTag, { backgroundColor: 'rgba(139,127,199,0.1)', borderColor: 'rgba(139,127,199,0.25)', borderWidth: 1 }]}>
                <Text style={[styles.muscleTagText, { color: '#8b7fc7' }]}>{RECIPE_TAGS[t] || t}</Text>
              </View>
            ))}
          </View>
        )}

        <ReactionBar targetId={item._id} targetType="recipe" initialLiked={d.isLiked} initialCount={d.likesCount || 0} initialCommentsCount={d.commentsCount || 0} isDark={isDark} />
      </View>
    </View>
  );
}

// ─── Card : Défi terminé ────────────────────────────────────────────────────

function ChallengeCard({ item, isDark, onUserPress }) {
  const d = item.data;
  const challenger = d.challenger || {};
  const challenged = d.challenged || {};

  const formatScore = (score, unit) => {
    if (score == null) return '—';
    if (unit === 'kg') return `${score} kg`;
    return `${score} reps`;
  };

  const isMax = d.challengeCategory === 'max';
  const label = CHALLENGE_LABELS[d.challengeType] || d.challengeType;

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={{ height: 3, backgroundColor: TYPE_COLORS.challenge, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
      <View style={styles.cardInner}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeBadge}>
            <Ionicons name="flash" size={12} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.challengeBadgeText}>Défi terminé</Text>
          </View>
          <Text style={[styles.challengeLabel, isDark && styles.textMuted]}>{label}</Text>
        </View>

        <View style={styles.challengeVS}>
          <TouchableOpacity
            style={[styles.vsPlayer, isDark && styles.vsPlayerDark, d.winnerId && challenger._id?.toString() === d.winnerId?.toString() && styles.vsWinner]}
            onPress={() => onUserPress(challenger._id)} activeOpacity={0.8}
          >
            <Avatar user={challenger} size={52} />
            <Text style={[styles.vsName, isDark && styles.textLight]} numberOfLines={1}>
              {challenger.prenom || challenger.pseudo || '?'}
            </Text>
            <Text style={[styles.vsScore, isDark && styles.textLight]}>
              {isMax ? formatScore(d.challengerResult, d.resultUnit) : (d.challengerScore ?? '—')}
            </Text>
            {d.winnerId && challenger._id?.toString() === d.winnerId?.toString() && (
              <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={11} color="#F59E0B" />
                <Text style={styles.winnerBadgeText}>Vainqueur</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.vsCenter}>
            <View style={[styles.vsLine, isDark && styles.vsLineDark]} />
            <Text style={[styles.vsLabel, isDark && styles.textMuted]}>VS</Text>
            <View style={[styles.vsLine, isDark && styles.vsLineDark]} />
          </View>

          <TouchableOpacity
            style={[styles.vsPlayer, isDark && styles.vsPlayerDark, d.winnerId && challenged._id?.toString() === d.winnerId?.toString() && styles.vsWinner]}
            onPress={() => onUserPress(challenged._id)} activeOpacity={0.8}
          >
            <Avatar user={challenged} size={52} />
            <Text style={[styles.vsName, isDark && styles.textLight]} numberOfLines={1}>
              {challenged.prenom || challenged.pseudo || '?'}
            </Text>
            <Text style={[styles.vsScore, isDark && styles.textLight]}>
              {isMax ? formatScore(d.challengedResult, d.resultUnit) : (d.challengedScore ?? '—')}
            </Text>
            {d.winnerId && challenged._id?.toString() === d.winnerId?.toString() && (
              <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={11} color="#F59E0B" />
                <Text style={styles.winnerBadgeText}>Vainqueur</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!d.winnerId && <Text style={[styles.drawText, isDark && styles.textMuted]}>Égalité parfaite</Text>}
        {d.rewardXp > 0 && d.winnerId && (
          <Text style={styles.rewardText}>+{d.rewardXp} XP remportés</Text>
        )}
        <ReactionBar targetId={item._id} targetType="challenge" initialLiked={d.isLiked} initialCount={d.likesCount || 0} initialCommentsCount={d.commentsCount || 0} isDark={isDark} />
      </View>
    </View>
  );
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

function SharedSessionCard({ item, isDark, onUserPress }) {
  const d = item.data;
  const initiator = d.initiator || {};
  const partner = d.partner || {};
  const bg = isDark ? '#18181d' : '#fff';
  const textColor = isDark ? '#f3f3f6' : '#1c1917';
  const mutedColor = isDark ? '#7a7a88' : '#a8a29e';

  return (
    <View style={[styles.card, isDark && styles.cardDark, { padding: 16 }]}>
      {/* Header — dual avatars */}
      <View style={[styles.cardHeader, { paddingHorizontal: 0 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => onUserPress(initiator._id)}>
            {initiator.photo
              ? <Image source={{ uri: initiator.photo }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              : <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(114,186,161,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#72baa1', fontWeight: '700' }}>{(initiator.prenom || initiator.pseudo || '?')[0]}</Text>
                </View>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onUserPress(partner._id)} style={{ marginLeft: -10 }}>
            {partner.photo
              ? <Image source={{ uri: partner.photo }} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: bg }} />
              : <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(240,164,122,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: bg }}>
                  <Text style={{ color: '#f0a47a', fontWeight: '700' }}>{(partner.prenom || partner.pseudo || '?')[0]}</Text>
                </View>
            }
          </TouchableOpacity>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[styles.userName, isDark && styles.textLight]} numberOfLines={1}>
              {initiator.prenom || initiator.pseudo || '?'} & {partner.prenom || partner.pseudo || '?'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="flash-outline" size={12} color="#72baa1" />
              <Text style={{ fontSize: 12, color: mutedColor }}>Séance duo</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', paddingBottom: 12, gap: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[{ fontSize: 16, fontWeight: '800', color: textColor }]}>{d.exerciseCount || 0}</Text>
          <Text style={{ fontSize: 11, color: mutedColor }}>exos</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[{ fontSize: 16, fontWeight: '800', color: textColor }]}>{formatDuration(d.durationSec)}</Text>
          <Text style={{ fontSize: 11, color: mutedColor }}>durée</Text>
        </View>
        {d.totalVolume > 0 && (
          <View style={{ alignItems: 'center' }}>
            <Text style={[{ fontSize: 16, fontWeight: '800', color: textColor }]}>{formatVolume(d.totalVolume)}</Text>
            <Text style={{ fontSize: 11, color: mutedColor }}>volume</Text>
          </View>
        )}
      </View>

      {/* Exercise chips */}
      {d.exercises?.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 4, gap: 4 }}>
          {d.exercises.map((name, i) => (
            <View key={i} style={{ backgroundColor: 'rgba(114,186,161,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#72baa1' }}>{name}</Text>
            </View>
          ))}
        </View>
      )}

      <ReactionBar targetId={item._id} targetType="shared_session" initialLiked={d.isLiked} initialCount={d.likesCount || 0} initialCommentsCount={d.commentsCount || 0} isDark={isDark} />
    </View>
  );
}

function FeedCard({ item, isDark, onUserPress }) {
  switch (item.type) {
    case 'workout':        return <WorkoutCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    case 'meal':           return <MealCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    case 'recipe':         return <RecipeCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    case 'challenge':      return <ChallengeCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    case 'shared_session': return <SharedSessionCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    default:               return null;
  }
}

// ─── Search Modal ───────────────────────────────────────────────────────────

function SearchModal({ visible, onClose, isDark }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingState, setFollowingState] = useState({});
  const navigation = useNavigation();
  const debounceRef = useRef(null);

  const handleSearch = useCallback((text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await social.searchUsers(text.trim());
        const users = res.data.users || [];
        setResults(users);
        const state = {};
        users.forEach(u => { state[u._id] = u.isFollowing; });
        setFollowingState(state);
      } catch { /* noop */ }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const handleFollow = async (userId) => {
    const was = followingState[userId];
    setFollowingState(prev => ({ ...prev, [userId]: !was }));
    try {
      if (was) await social.unfollow(userId);
      else await social.follow(userId);
    } catch {
      setFollowingState(prev => ({ ...prev, [userId]: was }));
    }
  };

  const handleUserPress = (userId) => {
    onClose();
    setTimeout(() => navigation.navigate('UserPublicProfile', { userId }), 300);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalSafe, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, isDark && styles.textLight]}>Trouver des sportifs</Text>
          <TouchableOpacity onPress={onClose} style={[styles.modalCloseBtn, isDark && styles.modalCloseBtnDark]}>
            <Ionicons name="close" size={20} color={isDark ? '#c1c1cb' : '#78716c'} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchInputWrapper, isDark && styles.searchInputWrapperDark]}>
          <Ionicons name="search-outline" size={18} color={isDark ? '#7a7a88' : '#a8a29e'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.textLight]}
            placeholder="Pseudo, prénom..."
            placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
            value={query}
            onChangeText={handleSearch}
            autoFocus autoCapitalize="none" returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={isDark ? '#7a7a88' : '#a8a29e'} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color="#72baa1" />
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.searchResults}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const following = followingState[item._id];
              return (
                <TouchableOpacity style={[styles.resultRow, isDark && styles.resultRowDark]}
                  onPress={() => handleUserPress(item._id)} activeOpacity={0.75}>
                  <Avatar user={item} size={46} />
                  <View style={styles.resultMeta}>
                    <Text style={[styles.resultName, isDark && styles.textLight]}>{item.prenom || item.pseudo}</Text>
                    {item.pseudo ? <Text style={[styles.resultPseudo, isDark && styles.textMuted]}>@{item.pseudo}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => handleFollow(item._id)}
                    style={[styles.followChip, following && styles.followingChip, isDark && following && styles.followingChipDark]} activeOpacity={0.8}>
                    <Text style={[styles.followChipText, following && styles.followingChipText]}>
                      {following ? 'Suivi' : 'Suivre'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              query.length >= 2 ? (
                <View style={styles.emptySearch}>
                  <Ionicons name="search-outline" size={40} color={isDark ? '#7a7a88' : '#a8a29e'} />
                  <Text style={[styles.emptySearchText, isDark && styles.textMuted]}>Aucun résultat</Text>
                </View>
              ) : (
                <View style={styles.emptySearch}>
                  <Ionicons name="people-outline" size={48} color={isDark ? '#7a7a88' : '#a8a29e'} />
                  <Text style={[styles.emptySearchText, isDark && styles.textMuted]}>
                    Recherchez des amis par pseudo ou prénom
                  </Text>
                </View>
              )
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyFeed({ isDark, onSearch }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
        <View style={styles.emptyIconWrap}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people" size={32} color="#a8a29e" />
          </View>
        </View>
        <Text style={[styles.emptyTitle, isDark && styles.textLight]}>Votre flux est vide</Text>
        <Text style={[styles.emptySubtitle, isDark && styles.textMuted]}>
          Suivez des amis pour voir leurs séances, repas, recettes et défis ici
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={onSearch} activeOpacity={0.85}>
          <View style={styles.emptyBtnInner}>
            <Ionicons name="person-add-outline" size={18} color="#FFF" />
            <Text style={styles.emptyBtnText}>Trouver des sportifs</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main FluxScreen ────────────────────────────────────────────────────────

export default function FluxScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const { unreadCount } = useChat();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

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
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [page]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadFeed(true);
  }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(true);
  }, []);

  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    loadFeed(false);
  }, [hasMore, loadingMore, loadFeed]);

  const handleUserPress = (userId) => {
    if (!userId) return;
    navigation.navigate('UserPublicProfile', { userId });
  };

  const headerBg = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centered]}>
        <ActivityIndicator size="large" color="#72baa1" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <SafeAreaView edges={['top']} style={styles.headerWrapper}>
        <Animated.View style={[styles.headerBlurBg, isDark && styles.headerBlurBgDark, { opacity: headerBg }]} />

        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textLight]}>Flux</Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={[styles.iconBtn, isDark && styles.iconBtnDark]} onPress={() => setSearchVisible(true)} activeOpacity={0.75}>
              <Ionicons name="person-add-outline" size={20} color={isDark ? '#f3f3f6' : '#1c1917'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, isDark && styles.iconBtnDark]} onPress={() => navigation.navigate('HomeTab', { screen: 'Notifications' })} activeOpacity={0.75}>
              <Ionicons name="notifications-outline" size={20} color={isDark ? '#f3f3f6' : '#1c1917'} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.quickCard, isDark && styles.quickCardDark]} onPress={() => navigation.navigate('Matching')} activeOpacity={0.8}>
          <View style={styles.quickCardInner}>
            <View style={[styles.quickIcon, { backgroundColor: 'rgba(114,186,161,0.12)' }]}>
              <Ionicons name="chatbubbles" size={16} color="#72baa1" />
            </View>
            <View style={styles.quickText}>
              <Text style={[styles.quickTitle, isDark && styles.textLight]}>Chat & Matching</Text>
              <Text style={[styles.quickSub, isDark && styles.textMuted]}>
                {unreadCount > 0
                  ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`
                  : 'Mes conversations et partenaires'}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#7a7a88' : '#a8a29e'} />
            )}
          </View>
        </TouchableOpacity>

        <View style={[styles.separator, isDark && styles.separatorDark]} />
      </SafeAreaView>

      <Animated.FlatList
        data={items}
        keyExtractor={item => `${item.type}-${item._id}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <FeedCard item={item} isDark={isDark} onUserPress={handleUserPress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#72baa1" colors={['#72baa1']} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMore}><ActivityIndicator color="#72baa1" /></View>
          ) : !hasMore && items.length > 0 ? (
            <View style={styles.endFooter}>
              <View style={[styles.endLine, isDark && styles.endLineDark]} />
              <Text style={[styles.endText, isDark && styles.textMuted]}>À jour</Text>
              <View style={[styles.endLine, isDark && styles.endLineDark]} />
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyFeed isDark={isDark} onSearch={() => setSearchVisible(true)} />}
        showsVerticalScrollIndicator={false}
      />

      <SearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} isDark={isDark} />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  containerDark: { backgroundColor: '#0e0e11' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  textLight: { color: '#f3f3f6' },
  textMuted: { color: '#7a7a88' },

  // ── Header
  headerWrapper: { backgroundColor: 'transparent', zIndex: 10 },
  headerBlurBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(252,251,249,0.95)' },
  headerBlurBgDark: { backgroundColor: 'rgba(14,14,17,0.95)' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1c1917', letterSpacing: -0.5 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#efedea',
  },
  iconBtnDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },

  // ── Quick Card
  quickCard: {
    marginHorizontal: 16, borderRadius: 14, backgroundColor: '#fff',
    overflow: 'hidden', marginBottom: 14,
    borderWidth: 1, borderColor: '#efedea',
  },
  quickCardDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  quickCardInner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 13, fontWeight: '700', color: '#1c1917' },
  quickSub: { fontSize: 11, color: '#a8a29e', marginTop: 1 },
  unreadPill: { backgroundColor: '#72baa1', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadPillText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  // ── Separator
  separator: { height: 1, backgroundColor: '#efedea', marginHorizontal: 16, marginBottom: 8 },
  separatorDark: { backgroundColor: 'rgba(255,255,255,0.06)' },

  // ── List
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 180 },
  loadMore: { paddingVertical: 24, alignItems: 'center' },
  endFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 },
  endLine: { height: 1, width: 40, backgroundColor: '#efedea' },
  endLineDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  endText: { fontSize: 12, fontWeight: '600', color: '#a8a29e', letterSpacing: 0.5 },

  // ── Card base
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#efedea',
  },
  cardDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  cardInner: { padding: 16 },

  // ── Card Header
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  userMeta: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#1c1917' },
  dateText: { fontSize: 12, color: '#a8a29e', marginTop: 2 },

  // ── Type Badge
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },

  // ── Workout
  workoutName: { fontSize: 17, fontWeight: '800', color: '#1c1917', marginBottom: 10, letterSpacing: -0.3 },

  // ── Stats row
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#efedea', borderRadius: 12,
    padding: 10, marginBottom: 10,
  },
  statsRowDark: { borderColor: 'rgba(255,255,255,0.06)' },
  statCell: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#a8a29e', letterSpacing: 0.5, marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: '800', color: '#1c1917' },
  statDivider: { width: 1, height: 32, backgroundColor: '#efedea' },
  statDividerDark: { backgroundColor: 'rgba(255,255,255,0.06)' },

  // ── PRs
  highlightsSection: { gap: 5, marginBottom: 10 },
  prRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(114,186,161,0.08)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7, gap: 6,
    borderWidth: 1, borderColor: 'rgba(114,186,161,0.15)',
  },
  prRowDark: { backgroundColor: 'rgba(114,186,161,0.08)', borderColor: 'rgba(114,186,161,0.12)' },
  prLabel: { fontSize: 10, fontWeight: '700', color: '#72baa1', letterSpacing: 0.5 },
  prExercise: { flex: 1, fontSize: 12, fontWeight: '600', color: '#78716c' },
  prValue: { fontSize: 12, fontWeight: '700', color: '#72baa1' },

  // ── Muscles
  musclesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  muscleTag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  muscleTagText: { fontSize: 11, fontWeight: '600' },
  muscleTagMore: { backgroundColor: '#f5f5f4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  muscleTagMoreDark: { backgroundColor: '#1f1f26' },
  muscleTagMoreText: { fontSize: 11, fontWeight: '600', color: '#78716c' },

  // ── Reaction bar
  reactionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: '#efedea',
  },
  reactionBarDark: { borderTopColor: 'rgba(255,255,255,0.06)' },
  reactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 19 },
  reactionCount: { fontSize: 12, fontWeight: '700', color: '#78716c' },

  // ── Comments
  commentSection: { borderTopWidth: 1, borderTopColor: '#efedea', paddingTop: 10, paddingHorizontal: 4, marginTop: 4 },
  commentSectionDark: { borderTopColor: 'rgba(255,255,255,0.06)' },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  commentAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(114,186,161,0.12)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  commentAvatarDark: { backgroundColor: 'rgba(114,186,161,0.18)' },
  commentAvatarImg: { width: 30, height: 30, borderRadius: 15 },
  commentAvatarLetter: { fontSize: 13, fontWeight: '800' },
  commentBubble: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  commentBubbleInner: { flex: 1, backgroundColor: '#f5f5f4', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  commentBubbleInnerDark: { backgroundColor: '#1f1f26' },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: '#1c1917', marginBottom: 2 },
  commentContent: { fontSize: 13, color: '#78716c', lineHeight: 18 },
  commentDeleteBtn: { padding: 6, marginTop: 2 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6,
    backgroundColor: '#f5f5f4', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 6,
  },
  commentInputRowDark: { backgroundColor: '#1f1f26' },
  commentInput: { flex: 1, fontSize: 14, color: '#1c1917', paddingVertical: 0 },
  commentInputDark: { color: '#f3f3f6' },
  commentSendBtn: { padding: 4 },

  // ── Activity banner (meal / recipe)
  activityBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, borderRadius: 12, marginBottom: 10,
  },
  activityEmoji: { fontSize: 28, lineHeight: 32 },
  activityLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  activityTitle: { fontSize: 15, fontWeight: '800', color: '#1c1917' },
  activitySub: { fontSize: 11, color: '#a8a29e', marginTop: 2 },
  cardNotes: { fontSize: 13, color: '#78716c', fontStyle: 'italic', padding: 10, backgroundColor: '#f5f5f4', borderRadius: 10, marginBottom: 8 },
  cardNotesDark: { backgroundColor: '#1f1f26', color: '#c1c1cb' },

  // ── Recipe image
  recipeImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 10 },

  // ── Challenge
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  challengeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#d4a96a', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  challengeBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  challengeLabel: { fontSize: 13, fontWeight: '700', color: '#78716c', flex: 1 },

  challengeVS: { flexDirection: 'row', alignItems: 'stretch', gap: 0, marginBottom: 8 },
  vsPlayer: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 12,
    backgroundColor: '#f5f5f4',
  },
  vsPlayerDark: { backgroundColor: '#1f1f26' },
  vsWinner: { backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#F59E0B' },
  vsName: { fontSize: 12, fontWeight: '700', color: '#1c1917', marginTop: 6, marginBottom: 4, textAlign: 'center' },
  vsScore: { fontSize: 20, fontWeight: '800', color: '#1c1917' },
  vsCenter: { alignItems: 'center', justifyContent: 'center', width: 36 },
  vsLine: { height: 18, width: 1, backgroundColor: '#efedea' },
  vsLineDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  vsLabel: { fontSize: 13, fontWeight: '900', color: '#a8a29e', paddingVertical: 6 },
  winnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  winnerBadgeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  drawText: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#78716c', paddingTop: 8 },
  rewardText: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#72baa1', paddingTop: 6 },

  // ── Empty state
  emptyContainer: { paddingHorizontal: 16, paddingTop: 20 },
  emptyCard: {
    borderRadius: 20, padding: 32, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#efedea',
  },
  emptyCardDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  emptyIconWrap: { marginBottom: 20 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1c1917', marginBottom: 10, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, color: '#a8a29e', textAlign: 'center', lineHeight: 21, marginBottom: 24, paddingHorizontal: 10 },
  emptyBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  emptyBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: '#72baa1' },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // ── Search Modal
  modalSafe: { flex: 1, backgroundColor: '#fcfbf9' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#efedea', alignSelf: 'center', marginTop: 8, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1c1917', letterSpacing: -0.4 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  modalCloseBtnDark: { backgroundColor: '#1f1f26' },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
    borderWidth: 1, borderColor: '#efedea',
  },
  searchInputWrapperDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  searchInput: { flex: 1, fontSize: 15, color: '#1c1917', padding: 0 },
  searchResults: { paddingHorizontal: 16, paddingBottom: 180 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: '#efedea',
  },
  resultRowDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  resultMeta: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: '#1c1917' },
  resultPseudo: { fontSize: 13, color: '#a8a29e', marginTop: 2 },
  followChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#72baa1' },
  followingChip: { backgroundColor: '#f5f5f4' },
  followingChipDark: { backgroundColor: '#1f1f26' },
  followChipText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  followingChipText: { color: '#78716c' },
  emptySearch: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  emptySearchText: { fontSize: 14, color: '#a8a29e', textAlign: 'center', paddingHorizontal: 40, lineHeight: 21 },
});
