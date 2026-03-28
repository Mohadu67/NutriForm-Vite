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

import { theme } from '../../theme';
import social from '../../api/social';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Type mappings ──────────────────────────────────────────────────────────

const TYPE_COLORS = {
  workout:   theme.colors.primary,   // #F7B186
  meal:      theme.colors.success,   // #4CAF50
  recipe:    theme.colors.info,      // #2196F3
  challenge: theme.colors.warning,   // #FFC107
};

const TYPE_ICONS = {
  workout:   'barbell-outline',
  meal:      'nutrition-outline',
  recipe:    'book-outline',
  challenge: 'trophy-outline',
};

const TYPE_LABELS = {
  workout:   'Séance',
  meal:      'Repas',
  recipe:    'Recette',
  challenge: 'Défi',
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
  'Pectoraux': '#E8895A', 'Dos': '#7B9CFF', 'Biceps': '#FF6B8A',
  'Triceps': '#A78BFA', 'Épaules': '#34D399', 'Jambes': '#FBBF24',
  'Abdos': '#60A5FA', 'Mollets': '#F87171', 'Cardio': '#22D3EE',
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
      colors={[theme.colors.primary, '#F9C4A3']}
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
  const color = MUSCLE_COLORS[muscle] || theme.colors.primary;
  return (
    <View style={[styles.muscleTag, { backgroundColor: `${color}18`, borderColor: `${color}40`, borderWidth: 1 }]}>
      <Text style={[styles.muscleTagText, { color }]}>{muscle}</Text>
    </View>
  );
}

function CardHeader({ user, date, type, isDark, onUserPress }) {
  const color = TYPE_COLORS[type] || theme.colors.primary;
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
      {!loaded && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 8 }} />}

      {comments.map(c => (
        <View key={c._id} style={styles.commentRow}>
          <View style={[styles.commentAvatar, isDark && styles.commentAvatarDark]}>
            {c.userAvatar
              ? <Image source={{ uri: c.userAvatar }} style={styles.commentAvatarImg} />
              : <Text style={[styles.commentAvatarLetter, { color: theme.colors.primary }]}>
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
                <Ionicons name="trash-outline" size={13} color={isDark ? '#555' : '#CCC'} />
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
            placeholderTextColor={isDark ? '#555' : '#BBB'}
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
              ? <ActivityIndicator size="small" color={theme.colors.primary} />
              : <Ionicons name="send" size={18} color={theme.colors.primary} />
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
              color={liked ? '#E89A6F' : (isDark ? '#555' : '#AAA')}
            />
            {count > 0 && (
              <Text style={[styles.reactionCount, isDark && styles.textMuted]}>{count}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowComments(s => !s)} style={styles.reactionBtn} activeOpacity={0.7}>
            <Ionicons
              name={showComments ? 'chatbubble' : 'chatbubble-outline'}
              size={20}
              color={showComments ? theme.colors.primary : (isDark ? '#555' : '#AAA')}
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
      <LinearGradient
        colors={['transparent', `${theme.colors.primary}50`, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.cardTopLine}
      />
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
                <Ionicons name="trophy" size={14} color="#C9A84C" />
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
      <LinearGradient
        colors={['transparent', `${theme.colors.success}50`, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.cardTopLine}
      />
      <View style={styles.cardInner}>
        <CardHeader user={item.user} date={item.date} type="meal" isDark={isDark} onUserPress={onUserPress} />

        <View style={[styles.activityBanner, { backgroundColor: isDark ? '#0D2B1E' : '#EDFBF4' }]}>
          <Text style={styles.activityEmoji}>{MEAL_ICONS[d.mealType] || '🍽️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activityLabel, { color: theme.colors.success }]}>{d.mealLabel || d.mealType}</Text>
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
      <LinearGradient
        colors={['transparent', `${theme.colors.info}50`, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.cardTopLine}
      />
      <View style={styles.cardInner}>
        <CardHeader user={item.user} date={item.date} type="recipe" isDark={isDark} onUserPress={onUserPress} />

        <View style={[styles.activityBanner, { backgroundColor: isDark ? '#0D1126' : '#F0F0FF' }]}>
          <Text style={styles.activityEmoji}>👨‍🍳</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activityLabel, { color: theme.colors.info }]}>A créé une recette</Text>
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
              <View key={i} style={[styles.muscleTag, { backgroundColor: `${theme.colors.info}18`, borderColor: `${theme.colors.info}40`, borderWidth: 1 }]}>
                <Text style={[styles.muscleTagText, { color: theme.colors.info }]}>{RECIPE_TAGS[t] || t}</Text>
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
      <LinearGradient
        colors={['transparent', `${theme.colors.warning}50`, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.cardTopLine}
      />
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

function FeedCard({ item, isDark, onUserPress }) {
  switch (item.type) {
    case 'workout':   return <WorkoutCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    case 'meal':      return <MealCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    case 'recipe':    return <RecipeCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    case 'challenge': return <ChallengeCard item={item} isDark={isDark} onUserPress={onUserPress} />;
    default:          return null;
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
            <Ionicons name="close" size={20} color={isDark ? '#CCC' : '#555'} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchInputWrapper, isDark && styles.searchInputWrapperDark]}>
          <Ionicons name="search-outline" size={18} color={isDark ? '#666' : '#AAA'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.textLight]}
            placeholder="Pseudo, prénom..."
            placeholderTextColor={isDark ? '#555' : '#BBB'}
            value={query}
            onChangeText={handleSearch}
            autoFocus autoCapitalize="none" returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={isDark ? '#555' : '#CCC'} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={theme.colors.primary} />
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
                  <Ionicons name="search-outline" size={40} color={isDark ? '#333' : '#DDD'} />
                  <Text style={[styles.emptySearchText, isDark && styles.textMuted]}>Aucun résultat</Text>
                </View>
              ) : (
                <View style={styles.emptySearch}>
                  <Ionicons name="people-outline" size={48} color={isDark ? '#333' : '#DDD'} />
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
      <LinearGradient
        colors={isDark ? ['#1E2228', '#1A1D24'] : ['#FFF5EE', '#FFFFFF']}
        style={styles.emptyCard}
      >
        <View style={styles.emptyIconWrap}>
          <LinearGradient colors={[theme.colors.primary, '#F9C4A3']} style={styles.emptyIconGradient}>
            <Ionicons name="people" size={32} color="#FFF" />
          </LinearGradient>
        </View>
        <Text style={[styles.emptyTitle, isDark && styles.textLight]}>Votre flux est vide</Text>
        <Text style={[styles.emptySubtitle, isDark && styles.textMuted]}>
          Suivez des amis pour voir leurs séances, repas, recettes et défis ici
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={onSearch} activeOpacity={0.85}>
          <LinearGradient colors={[theme.colors.primary, '#F9C4A3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGradient}>
            <Ionicons name="person-add-outline" size={18} color="#FFF" />
            <Text style={styles.emptyBtnText}>Trouver des sportifs</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
              <Ionicons name="person-add-outline" size={20} color={isDark ? '#E0E0E0' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, isDark && styles.iconBtnDark]} onPress={() => navigation.navigate('HomeTab', { screen: 'Notifications' })} activeOpacity={0.75}>
              <Ionicons name="notifications-outline" size={20} color={isDark ? '#E0E0E0' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.quickCard, isDark && styles.quickCardDark]} onPress={() => navigation.navigate('Matching')} activeOpacity={0.8}>
          <LinearGradient
            colors={isDark ? ['rgba(232,137,90,0.15)', 'rgba(232,137,90,0.05)'] : ['rgba(232,137,90,0.1)', 'rgba(249,196,163,0.05)']}
            style={styles.quickCardInner}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="chatbubbles" size={16} color={theme.colors.primary} />
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
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#444' : '#CCC'} />
            )}
          </LinearGradient>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMore}><ActivityIndicator color={theme.colors.primary} /></View>
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
  container: { flex: 1, backgroundColor: '#F2F3F7' },
  containerDark: { backgroundColor: '#111318' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  textLight: { color: '#FFFFFF' },
  textMuted: { color: '#7A7D85' },

  // ── Header
  headerWrapper: { backgroundColor: 'transparent', zIndex: 10 },
  headerBlurBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(242,243,247,0.95)' },
  headerBlurBgDark: { backgroundColor: 'rgba(17,19,24,0.95)' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#111', letterSpacing: -0.8 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  iconBtnDark: { backgroundColor: '#1E2228' },

  // ── Quick Card
  quickCard: {
    marginHorizontal: 16, borderRadius: 14, backgroundColor: '#FFF',
    overflow: 'hidden', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  quickCardDark: { backgroundColor: '#1A1D24' },
  quickCardInner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  quickSub: { fontSize: 11, color: '#999', marginTop: 1 },
  unreadPill: { backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadPillText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  // ── Separator
  separator: { height: 1, backgroundColor: '#E8E9EE', marginHorizontal: 16, marginBottom: 8 },
  separatorDark: { backgroundColor: '#22262E' },

  // ── List
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 180 },
  loadMore: { paddingVertical: 24, alignItems: 'center' },
  endFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 },
  endLine: { height: 1, width: 40, backgroundColor: '#E0E0E0' },
  endLineDark: { backgroundColor: '#2A2E36' },
  endText: { fontSize: 12, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },

  // ── Card base
  card: {
    backgroundColor: '#FFF', borderRadius: 20, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  cardDark: { backgroundColor: '#1A1D24' },
  cardTopLine: { height: 2 },
  cardInner: { padding: 16 },

  // ── Card Header
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  userMeta: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#111' },
  dateText: { fontSize: 12, color: '#AAA', marginTop: 2 },

  // ── Type Badge
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },

  // ── Workout
  workoutName: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10, letterSpacing: -0.3 },

  // ── Stats row
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#EDEEF2', borderRadius: 12,
    padding: 10, marginBottom: 10,
  },
  statsRowDark: { borderColor: '#2A2E36' },
  statCell: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#AAA', letterSpacing: 0.5, marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: '800', color: '#111' },
  statDivider: { width: 1.5, height: 32, backgroundColor: '#EDEEF2' },
  statDividerDark: { backgroundColor: '#2A2E36' },

  // ── PRs
  highlightsSection: { gap: 5, marginBottom: 10 },
  prRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBF2', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7, gap: 6,
    borderWidth: 1, borderColor: '#F0E4C0',
  },
  prRowDark: { backgroundColor: '#22200A', borderColor: '#3A3010' },
  prLabel: { fontSize: 10, fontWeight: '700', color: '#C9A84C', letterSpacing: 0.5 },
  prExercise: { flex: 1, fontSize: 12, fontWeight: '600', color: '#555' },
  prValue: { fontSize: 12, fontWeight: '700', color: '#C9A84C' },

  // ── Muscles
  musclesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  muscleTag: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  muscleTagText: { fontSize: 11, fontWeight: '600' },
  muscleTagMore: { backgroundColor: '#F4F5F8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  muscleTagMoreDark: { backgroundColor: '#22262E' },
  muscleTagMoreText: { fontSize: 11, fontWeight: '600', color: '#888' },

  // ── Reaction bar
  reactionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, marginTop: 4, borderTopWidth: 1.5, borderTopColor: '#F0F1F5',
  },
  reactionBarDark: { borderTopColor: '#22262E' },
  reactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 19 },
  reactionCount: { fontSize: 12, fontWeight: '700', color: '#666' },

  // ── Comments
  commentSection: { borderTopWidth: 1, borderTopColor: '#F0F1F5', paddingTop: 10, paddingHorizontal: 4, marginTop: 4 },
  commentSectionDark: { borderTopColor: '#22262E' },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  commentAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: `${theme.colors.primary}20`,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  commentAvatarDark: { backgroundColor: `${theme.colors.primary}30` },
  commentAvatarImg: { width: 30, height: 30, borderRadius: 15 },
  commentAvatarLetter: { fontSize: 13, fontWeight: '800' },
  commentBubble: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  commentBubbleInner: { flex: 1, backgroundColor: '#F5F6FA', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  commentBubbleInnerDark: { backgroundColor: '#252830' },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: '#111', marginBottom: 2 },
  commentContent: { fontSize: 13, color: '#444', lineHeight: 18 },
  commentDeleteBtn: { padding: 6, marginTop: 2 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6,
    backgroundColor: '#F5F6FA', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 6,
  },
  commentInputRowDark: { backgroundColor: '#252830' },
  commentInput: { flex: 1, fontSize: 14, color: '#111', paddingVertical: 0 },
  commentInputDark: { color: '#FFF' },
  commentSendBtn: { padding: 4 },

  // ── Activity banner (meal / recipe)
  activityBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, borderRadius: 12, marginBottom: 10,
  },
  activityEmoji: { fontSize: 28, lineHeight: 32 },
  activityLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  activityTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  activitySub: { fontSize: 11, color: '#AAA', marginTop: 2 },
  cardNotes: { fontSize: 13, color: '#666', fontStyle: 'italic', padding: 10, backgroundColor: '#FAFAFA', borderRadius: 10, marginBottom: 8 },
  cardNotesDark: { backgroundColor: '#22262E', color: '#999' },

  // ── Recipe image
  recipeImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 10 },

  // ── Challenge
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  challengeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.warning, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  challengeBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  challengeLabel: { fontSize: 13, fontWeight: '700', color: '#333', flex: 1 },

  challengeVS: { flexDirection: 'row', alignItems: 'stretch', gap: 0, marginBottom: 8 },
  vsPlayer: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 12,
    backgroundColor: '#F7F8FB',
  },
  vsPlayerDark: { backgroundColor: '#22262E' },
  vsWinner: { backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#F59E0B' },
  vsName: { fontSize: 12, fontWeight: '700', color: '#333', marginTop: 6, marginBottom: 4, textAlign: 'center' },
  vsScore: { fontSize: 20, fontWeight: '800', color: '#111' },
  vsCenter: { alignItems: 'center', justifyContent: 'center', width: 36 },
  vsLine: { height: 18, width: 1, backgroundColor: '#E0E0E0' },
  vsLineDark: { backgroundColor: '#2A2E36' },
  vsLabel: { fontSize: 13, fontWeight: '900', color: '#CCC', paddingVertical: 6 },
  winnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  winnerBadgeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  drawText: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#6B7280', paddingTop: 8 },
  rewardText: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: theme.colors.primary, paddingTop: 6 },

  // ── Empty state
  emptyContainer: { paddingHorizontal: 16, paddingTop: 20 },
  emptyCard: { borderRadius: 24, padding: 32, alignItems: 'center' },
  emptyIconWrap: { marginBottom: 20 },
  emptyIconGradient: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 10, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 21, marginBottom: 24, paddingHorizontal: 10 },
  emptyBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // ── Search Modal
  modalSafe: { flex: 1, backgroundColor: '#F2F3F7' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginTop: 8, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: -0.4 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#ECECEC', alignItems: 'center', justifyContent: 'center' },
  modalCloseBtnDark: { backgroundColor: '#2A2E36' },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  searchInputWrapperDark: { backgroundColor: '#1E2228' },
  searchInput: { flex: 1, fontSize: 15, color: '#111', padding: 0 },
  searchResults: { paddingHorizontal: 16, paddingBottom: 180 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, padding: 12, marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  resultRowDark: { backgroundColor: '#1A1D24' },
  resultMeta: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: '#111' },
  resultPseudo: { fontSize: 13, color: '#AAA', marginTop: 2 },
  followChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.primary },
  followingChip: { backgroundColor: '#F0F0F0' },
  followingChipDark: { backgroundColor: '#2A2E36' },
  followChipText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  followingChipText: { color: '#666' },
  emptySearch: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  emptySearchText: { fontSize: 14, color: '#AAA', textAlign: 'center', paddingHorizontal: 40, lineHeight: 21 },
});
