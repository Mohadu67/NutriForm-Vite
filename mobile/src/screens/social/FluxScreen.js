import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

import { theme } from '../../theme';
import social from '../../api/social';
import { useChat } from '../../contexts/ChatContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDuration = (sec) => {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s > 0 ? ` ${s}s` : ''}`.trim();
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
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getInitials = (prenom, pseudo) =>
  (prenom || pseudo || '?').charAt(0).toUpperCase();

// ─── Workout Card ─────────────────────────────────────────────────────────────

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

function MuscleTag({ muscle, isDark }) {
  const color = MUSCLE_COLORS[muscle] || theme.colors.primary;
  return (
    <View style={[styles.muscleTag, { backgroundColor: `${color}18`, borderColor: `${color}40`, borderWidth: 1 }]}>
      <Text style={[styles.muscleTagText, { color }]}>{muscle}</Text>
    </View>
  );
}

function WorkoutCard({ session, isDark, onUserPress }) {
  const user = session.userId || {};
  const [showAllMuscles, setShowAllMuscles] = useState(false);

  const muscles = session.muscleGroups || [];
  const visibleMuscles = showAllMuscles ? muscles : muscles.slice(0, 4);
  const remaining = muscles.length - 4;

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      {/* Accent bar */}
      <View style={styles.cardAccent}>
        <LinearGradient
          colors={[theme.colors.primary, '#F9C4A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.cardInner}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => onUserPress(user._id)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary, '#F9C4A3']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitial}>
                    {getInitials(user.prenom, user.pseudo)}
                  </Text>
                </LinearGradient>
              )}
              <View style={styles.activityDot} />
            </View>
            <View style={styles.userMeta}>
              <Text style={[styles.userName, isDark && styles.textLight]} numberOfLines={1}>
                {user.prenom || user.pseudo || 'Utilisateur'}
              </Text>
              <View style={styles.dateRow}>
                {user.pseudo ? (
                  <Text style={[styles.userPseudo, isDark && styles.textMuted]}>@{user.pseudo} · </Text>
                ) : null}
                <Text style={[styles.dateText, isDark && styles.textMuted]}>
                  {formatDateRelative(session.endedAt)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {session.isOwnSession && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>Moi</Text>
            </View>
          )}
        </View>

        {/* Workout name */}
        <Text style={[styles.workoutName, isDark && styles.textLight]} numberOfLines={2}>
          {session.name || 'Séance'}
        </Text>

        {/* Stats pills */}
        <View style={styles.statsPills}>
          <View style={[styles.statPill, isDark && styles.statPillDark]}>
            <Ionicons name="time-outline" size={13} color={theme.colors.primary} />
            <Text style={[styles.statPillText, isDark && styles.textLight]}>
              {formatDuration(session.durationSec)}
            </Text>
          </View>
          {session.volumeKg > 0 && (
            <View style={[styles.statPill, isDark && styles.statPillDark]}>
              <Ionicons name="barbell-outline" size={13} color="#7B9CFF" />
              <Text style={[styles.statPillText, isDark && styles.textLight]}>
                {formatVolume(session.volumeKg)}
              </Text>
            </View>
          )}
          {session.calories > 0 && (
            <View style={[styles.statPill, isDark && styles.statPillDark]}>
              <Ionicons name="flame-outline" size={13} color="#EF4444" />
              <Text style={[styles.statPillText, isDark && styles.textLight]}>
                {session.calories} kcal
              </Text>
            </View>
          )}
        </View>

        {/* PRs / Highlights */}
        {session.highlights?.length > 0 && (
          <View style={styles.highlightsSection}>
            {session.highlights.map((h, i) => (
              <View key={i} style={[styles.prRow, isDark && styles.prRowDark]}>
                <View style={styles.prLeft}>
                  <Ionicons name="trophy" size={14} color="#C9A84C" />
                  <Text style={[styles.prLabel, isDark && styles.textMuted]}>PR</Text>
                </View>
                <Text style={[styles.prExercise, isDark && styles.textLight]} numberOfLines={1}>
                  {h.exerciseName}
                </Text>
                <Text style={styles.prValue}>
                  {h.weight ? `${h.weight}kg` : ''}{h.weight && h.reps ? ' · ' : ''}{h.reps ? `${h.reps} reps` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Muscle groups */}
        {muscles.length > 0 && (
          <View style={styles.musclesSection}>
            <View style={styles.muscleTagsRow}>
              {visibleMuscles.map((m, i) => (
                <MuscleTag key={i} muscle={m} isDark={isDark} />
              ))}
              {!showAllMuscles && remaining > 0 && (
                <TouchableOpacity
                  onPress={() => setShowAllMuscles(true)}
                  style={[styles.muscleTagMore, isDark && styles.muscleTagMoreDark]}
                >
                  <Text style={[styles.muscleTagMoreText, isDark && styles.textMuted]}>
                    +{remaining}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────

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
        {/* Handle bar */}
        <View style={styles.modalHandle} />

        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, isDark && styles.textLight]}>Trouver des sportifs</Text>
          <TouchableOpacity onPress={onClose} style={[styles.modalCloseBtn, isDark && styles.modalCloseBtnDark]}>
            <Ionicons name="close" size={20} color={isDark ? '#CCC' : '#555'} />
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View style={[styles.searchInputWrapper, isDark && styles.searchInputWrapperDark]}>
          <Ionicons name="search-outline" size={18} color={isDark ? '#666' : '#AAA'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.textLight]}
            placeholder="Pseudo, prénom..."
            placeholderTextColor={isDark ? '#555' : '#BBB'}
            value={query}
            onChangeText={handleSearch}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
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
                <TouchableOpacity
                  style={[styles.resultRow, isDark && styles.resultRowDark]}
                  onPress={() => handleUserPress(item._id)}
                  activeOpacity={0.75}
                >
                  {item.photo ? (
                    <Image source={{ uri: item.photo }} style={styles.resultAvatar} />
                  ) : (
                    <LinearGradient
                      colors={[theme.colors.primary, '#F9C4A3']}
                      style={styles.resultAvatarPlaceholder}
                    >
                      <Text style={styles.resultAvatarText}>{getInitials(item.prenom, item.pseudo)}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.resultMeta}>
                    <Text style={[styles.resultName, isDark && styles.textLight]}>
                      {item.prenom || item.pseudo}
                    </Text>
                    {item.pseudo ? (
                      <Text style={[styles.resultPseudo, isDark && styles.textMuted]}>@{item.pseudo}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleFollow(item._id)}
                    style={[styles.followChip, following && styles.followingChip]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.followChipText, following && styles.followingChipText]}>
                      {following ? '✓ Suivi' : '+ Suivre'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              query.length >= 2 ? (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={40} color={isDark ? '#333' : '#DDD'} />
                  <Text style={[styles.noResultsText, isDark && styles.textMuted]}>Aucun résultat</Text>
                </View>
              ) : query.length === 0 ? (
                <View style={styles.searchHint}>
                  <Ionicons name="people-outline" size={48} color={isDark ? '#333' : '#DDD'} />
                  <Text style={[styles.searchHintText, isDark && styles.textMuted]}>
                    Recherchez des amis par pseudo ou prénom
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyFeed({ isDark, onSearch }) {
  return (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={isDark ? ['#1E2228', '#1A1D24'] : ['#FFF5EE', '#FFFFFF']}
        style={styles.emptyCard}
      >
        <View style={styles.emptyIconWrap}>
          <LinearGradient
            colors={[theme.colors.primary, '#F9C4A3']}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="people" size={32} color="#FFF" />
          </LinearGradient>
        </View>
        <Text style={[styles.emptyTitle, isDark && styles.textLight]}>
          Votre flux est vide
        </Text>
        <Text style={[styles.emptySubtitle, isDark && styles.textMuted]}>
          Suivez des amis pour voir leurs séances, records et défis ici
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={onSearch} activeOpacity={0.85}>
          <LinearGradient
            colors={[theme.colors.primary, '#F9C4A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emptyBtnGradient}
          >
            <Ionicons name="person-add-outline" size={18} color="#FFF" />
            <Text style={styles.emptyBtnText}>Trouver des sportifs</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

// ─── Main FluxScreen ──────────────────────────────────────────────────────────

export default function FluxScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const { unreadCount } = useChat();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [sessions, setSessions] = useState([]);
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
      const { sessions: newSessions, hasMore: more } = res.data;
      if (reset) {
        setSessions(newSessions);
        setPage(2);
      } else {
        setSessions(prev => [...prev, ...newSessions]);
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

  // Header opacity on scroll
  const headerBg = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header fixe avec blur au scroll */}
      <SafeAreaView edges={['top']} style={styles.headerWrapper}>
        <Animated.View
          style={[
            styles.headerBlurBg,
            isDark && styles.headerBlurBgDark,
            { opacity: headerBg },
          ]}
        />
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textLight]}>Flux</Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.iconBtn, isDark && styles.iconBtnDark]}
              onPress={() => setSearchVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="person-add-outline" size={20} color={isDark ? '#E0E0E0' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, isDark && styles.iconBtnDark]}
              onPress={() => navigation.navigate('HomeTab', { screen: 'Notifications' })}
              activeOpacity={0.75}
            >
              <Ionicons name="notifications-outline" size={20} color={isDark ? '#E0E0E0' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Accès rapide Chat & Matching */}
        <TouchableOpacity
          style={[styles.quickCard, isDark && styles.quickCardDark]}
          onPress={() => navigation.navigate('Matching')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isDark ? ['rgba(232,137,90,0.15)', 'rgba(232,137,90,0.05)'] : ['rgba(232,137,90,0.1)', 'rgba(249,196,163,0.05)']}
            style={styles.quickCardGrad}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="chatbubbles" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.quickText}>
              <Text style={[styles.quickTitle, isDark && styles.textLight]}>Chat & Matching</Text>
              <Text style={[styles.quickSub, isDark && styles.textMuted]}>
                {unreadCount > 0 ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}` : 'Mes conversations et partenaires'}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#444' : '#CCC'} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Séparateur */}
        <View style={[styles.separator, isDark && styles.separatorDark]} />
      </SafeAreaView>

      {/* Feed */}
      <Animated.FlatList
        data={sessions}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <WorkoutCard session={item} isDark={isDark} onUserPress={handleUserPress} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMore}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : hasMore ? null : sessions.length > 0 ? (
            <Text style={[styles.endText, isDark && styles.textMuted]}>Vous êtes à jour ✓</Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyFeed isDark={isDark} onSearch={() => setSearchVisible(true)} />
        }
        showsVerticalScrollIndicator={false}
      />

      <SearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} isDark={isDark} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F7' },
  containerDark: { backgroundColor: '#111318' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  textLight: { color: '#FFFFFF' },
  textMuted: { color: '#7A7D85' },

  // ── Header
  headerWrapper: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerBlurBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242,243,247,0.95)',
  },
  headerBlurBgDark: { backgroundColor: 'rgba(17,19,24,0.95)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.8,
  },
  headerBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBtnDark: { backgroundColor: '#1E2228' },

  // ── Quick Row
  quickCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickCardDark: { backgroundColor: '#1A1D24' },
  quickCardGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  quickSub: { fontSize: 11, color: '#999', marginTop: 1 },
  unreadPill: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadPillText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  separator: {
    height: 1,
    backgroundColor: '#E8E9EE',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  separatorDark: { backgroundColor: '#22262E' },

  // ── Feed list
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 50,
  },
  loadMore: { paddingVertical: 24, alignItems: 'center' },
  endText: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 13,
    paddingVertical: 20,
  },

  // ── Workout Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDark: { backgroundColor: '#1A1D24' },
  cardAccent: { width: 4, borderRadius: 4 },
  cardInner: { flex: 1, padding: 14 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  activityDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#34D399',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  userMeta: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#111' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  userPseudo: { fontSize: 12, color: '#AAA' },
  dateText: { fontSize: 12, color: '#AAA' },
  ownerBadge: {
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ownerBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },

  workoutName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  // ── Stats pills
  statsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4F5F8',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statPillDark: { backgroundColor: '#22262E' },
  statPillText: { fontSize: 12, fontWeight: '600', color: '#333' },

  // ── PRs
  highlightsSection: { gap: 5, marginBottom: 10 },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0E4C0',
  },
  prRowDark: { backgroundColor: '#22200A', borderColor: '#3A3010' },
  prLeft: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  prLabel: { fontSize: 10, fontWeight: '700', color: '#C9A84C', letterSpacing: 0.5 },
  prExercise: { flex: 1, fontSize: 12, fontWeight: '600', color: '#555' },
  prValue: { fontSize: 12, fontWeight: '700', color: '#C9A84C' },

  // ── Muscles
  musclesSection: { marginTop: 2 },
  muscleTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleTag: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muscleTagText: { fontSize: 11, fontWeight: '600' },
  muscleTagMore: {
    backgroundColor: '#F4F5F8',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muscleTagMoreDark: { backgroundColor: '#22262E' },
  muscleTagMoreText: { fontSize: 11, fontWeight: '600', color: '#888' },

  // ── Empty state
  emptyContainer: { paddingHorizontal: 16, paddingTop: 20 },
  emptyCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  emptyIconWrap: { marginBottom: 20 },
  emptyIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  emptyBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // ── Search Modal
  modalSafe: { flex: 1, backgroundColor: '#F2F3F7' },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: -0.4 },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnDark: { backgroundColor: '#2A2E36' },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInputWrapperDark: { backgroundColor: '#1E2228' },
  searchInput: { flex: 1, fontSize: 15, color: '#111', padding: 0 },
  searchResults: { paddingHorizontal: 16, paddingBottom: 40 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  resultRowDark: { backgroundColor: '#1A1D24' },
  resultAvatar: { width: 46, height: 46, borderRadius: 23 },
  resultAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  resultMeta: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: '#111' },
  resultPseudo: { fontSize: 13, color: '#AAA', marginTop: 2 },
  followChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
  },
  followingChip: { backgroundColor: '#F0F0F0' },
  followChipText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  followingChipText: { color: '#666' },
  noResults: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  noResultsText: { fontSize: 14, color: '#AAA' },
  searchHint: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  searchHintText: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 21,
  },
});
