import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import { getConversations, getUnreadCount } from '../../api/matchChat';
import { getMutualMatches, getMatchSuggestions, likeProfile, rejectProfile } from '../../api/matching';
import ProfileModal from '../../components/matching/ProfileModal';
import useSwipeGesture from '../../hooks/useSwipeGesture';
import logger from '../../services/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Onglets
const TABS = [
  { key: 'messages', label: 'Messages', icon: 'chatbubbles' },
  { key: 'discover', label: 'Découvrir', icon: 'people' },
];

const FITNESS_LEVELS = {
  beginner: { label: 'Débutant', color: '#22C55E', gradient: ['#22C55E', '#16A34A'] },
  intermediate: { label: 'Intermédiaire', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
  advanced: { label: 'Avancé', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] },
};

const WORKOUT_TYPE_ICONS = {
  'muscu': 'barbell',
  'cardio': 'heart',
  'crossfit': 'fitness',
  'yoga': 'flower',
  'running': 'walk',
  'cycling': 'bicycle',
  'swimming': 'water',
  'hiking': 'trail-sign',
  'boxing': 'hand-left',
  'dance': 'musical-notes',
};

export default function MatchingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const matchModalScale = useRef(new Animated.Value(0)).current;
  const matchModalRotate = useRef(new Animated.Value(0)).current;
  const heartBeatAnim = useRef(new Animated.Value(1)).current;

  const [activeTab, setActiveTab] = useState('messages');
  const [conversations, setConversations] = useState([]);
  const [mutualMatches, setMutualMatches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingSuggestions, setPendingSuggestions] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [newMatch, setNewMatch] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Initial animations
  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Tab indicator animation
  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'messages' ? 0 : 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  // Match modal animation
  useEffect(() => {
    if (showMatchModal) {
      matchModalScale.setValue(0);
      matchModalRotate.setValue(0);
      Animated.parallel([
        Animated.spring(matchModalScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(matchModalRotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Heart beat animation
      const heartBeat = Animated.loop(
        Animated.sequence([
          Animated.timing(heartBeatAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(heartBeatAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      heartBeat.start();
      return () => heartBeat.stop();
    }
  }, [showMatchModal]);

  // Swipe gesture hook
  const {
    panResponder,
    position,
    nextCardScale,
    nextCardOpacity,
    swipeRight,
    swipeLeft,
  } = useSwipeGesture({
    items: suggestions,
    currentIndex,
    onSwipeRight: async (profile) => {
      try {
        const result = await likeProfile(profile.user._id);
        if (result?.match?.isMutual) {
          setNewMatch(profile);
          setShowMatchModal(true);
          setMutualMatches(prev => [{ ...profile, _id: result.match._id }, ...prev]);
        }
      } catch (err) {
        logger.matching.error('Like error', err);
      }
    },
    onSwipeLeft: async (profile) => {
      try {
        await rejectProfile(profile.user._id);
      } catch (err) {
        logger.matching.error('Reject error', err);
      }
    },
    onNextCard: () => {
      setCurrentIndex(prev => prev + 1);
    },
  });

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);

      const [convRes, matchesRes, suggestionsRes, unreadRes] = await Promise.all([
        getConversations(),
        getMutualMatches(),
        getMatchSuggestions({ limit: 20 }),
        getUnreadCount(),
      ]);

      if (convRes?.success && convRes.conversations) {
        setConversations(convRes.conversations);
        logger.matching.info('Conversations chargées:', convRes.conversations.length);
      }

      if (matchesRes?.matches) {
        setMutualMatches(matchesRes.matches);
        logger.matching.info('Matchs mutuels chargés:', matchesRes.matches.length);
      }

      if (suggestionsRes?.matches) {
        const filtered = suggestionsRes.matches.filter(s => !s.hasLiked && !s.isMutual);
        setSuggestions(filtered);
        setPendingSuggestions(filtered.length);
        logger.matching.info('Suggestions chargées:', filtered.length);
      }

      if (unreadRes?.success) {
        setUnreadCount(unreadRes.count || 0);
      }
    } catch (err) {
      logger.matching.error('Error loading data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentIndex(0);
    loadData();
  }, []);

  const handleCardPress = (profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Render conversation item with glassmorphism
  const renderConversationItem = ({ item, index }) => {
    const otherUser = item.otherUser;
    const hasUnread = item.unreadCount > 0;
    const itemAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={{
          opacity: itemAnim,
          transform: [{
            translateX: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-30, 0],
            }),
          }],
        }}
      >
        <TouchableOpacity
          style={[styles.conversationItem, isDark && styles.conversationItemDark]}
          onPress={() => navigation.navigate('ChatDetail', {
            conversationId: item._id,
            matchId: item.matchId,
            otherUser
          })}
          activeOpacity={0.7}
        >
          <View style={styles.conversationAvatarWrapper}>
            <LinearGradient
              colors={hasUnread ? ['#22C55E', '#16A34A'] : ['#E5E7EB', '#D1D5DB']}
              style={styles.avatarGradientRing}
            >
              {otherUser?.photo ? (
                <Image source={{ uri: otherUser.photo }} style={styles.conversationAvatar} />
              ) : (
                <View style={[styles.conversationAvatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={24} color="#CCC" />
                </View>
              )}
            </LinearGradient>
            {hasUnread && (
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
              </View>
            )}
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.conversationName, isDark && styles.textLight, hasUnread && styles.textBold]}>
                {otherUser?.pseudo || otherUser?.prenom || 'Utilisateur'}
              </Text>
              <Text style={[styles.conversationTime, isDark && styles.textMuted]}>
                {formatRelativeTime(item.lastMessage?.createdAt)}
              </Text>
            </View>
            <Text
              style={[
                styles.conversationPreview,
                isDark && styles.textMuted,
                hasUnread && styles.conversationPreviewUnread
              ]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'Commencez la conversation !'}
            </Text>
          </View>

          {hasUnread && (
            <LinearGradient
              colors={[theme.colors.primary, '#16A34A']}
              style={styles.unreadBadge}
            >
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </LinearGradient>
          )}

          <Ionicons
            name="chevron-forward"
            size={18}
            color={isDark ? '#555' : '#CCC'}
            style={styles.chevron}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render new matches (conversations non commencées)
  const renderNewMatches = () => {
    const matchesWithoutConvo = mutualMatches.filter(
      match => !conversations.some(c => c.matchId === match._id)
    );

    if (matchesWithoutConvo.length === 0) return null;

    return (
      <View style={styles.newMatchesSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrapper}>
            <LinearGradient
              colors={['#EC4899', '#F43F5E']}
              style={styles.sectionIcon}
            >
              <Ionicons name="sparkles" size={12} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Nouveaux matchs</Text>
          </View>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{matchesWithoutConvo.length}</Text>
          </View>
        </View>
        <FlatList
          horizontal
          data={matchesWithoutConvo}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.newMatchesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.newMatchItem}
              onPress={() => navigation.navigate('ChatDetail', { matchId: item._id, otherUser: item.user })}
            >
              <LinearGradient
                colors={['#EC4899', '#F43F5E']}
                style={styles.newMatchGradientRing}
              >
                {item.user?.photo ? (
                  <Image source={{ uri: item.user.photo }} style={styles.newMatchAvatar} />
                ) : (
                  <View style={[styles.newMatchAvatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={28} color="#CCC" />
                  </View>
                )}
              </LinearGradient>
              <View style={styles.newMatchBadge}>
                <Text style={styles.newMatchBadgeText}>NEW</Text>
              </View>
              <Text style={[styles.newMatchName, isDark && styles.textLight]} numberOfLines={1}>
                {item.user?.username}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // Render empty messages state
  const renderEmptyMessages = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.emptyIconContainer}
      >
        <LinearGradient
          colors={[theme.colors.primary, '#16A34A']}
          style={styles.emptyIconInner}
        >
          <Ionicons name="chatbubbles" size={40} color="#FFF" />
        </LinearGradient>
      </LinearGradient>
      <Text style={[styles.emptyTitle, isDark && styles.textLight]}>Pas encore de messages</Text>
      <Text style={[styles.emptyText, isDark && styles.textMuted]}>
        Swipez sur des profils pour trouver des partenaires de sport et commencer à discuter !
      </Text>
      <TouchableOpacity
        style={styles.ctaButtonWrapper}
        onPress={() => setActiveTab('discover')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.colors.primary, '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Ionicons name="people" size={20} color="#FFF" />
          <Text style={styles.ctaButtonText}>Découvrir des profils</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render messages tab
  const renderMessagesTab = () => (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item._id}
      renderItem={renderConversationItem}
      ListHeaderComponent={renderNewMatches}
      ListEmptyComponent={!loading && renderEmptyMessages}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
      contentContainerStyle={[
        styles.messagesListContent,
        conversations.length === 0 && styles.emptyListContainer
      ]}
      showsVerticalScrollIndicator={false}
    />
  );

  // Card styles for discover
  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-15deg', '0deg', '15deg'],
    });

    return {
      transform: [
        { translateX: position.x },
        { translateY: position.y },
        { rotate },
      ],
    };
  };

  const getLikeOpacity = () => {
    return position.x.interpolate({
      inputRange: [0, SWIPE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  };

  const getNopeOpacity = () => {
    return position.x.interpolate({
      inputRange: [-SWIPE_THRESHOLD, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
  };

  // Render single card with enhanced design
  const renderCard = (profile, index) => {
    if (index < currentIndex) return null;

    const isCurrentCard = index === currentIndex;
    const isNextCard = index === currentIndex + 1;

    if (!isCurrentCard && !isNextCard) return null;

    const user = profile.user;
    const fitnessLevel = FITNESS_LEVELS[user.fitnessLevel] || FITNESS_LEVELS.intermediate;

    if (isCurrentCard) {
      return (
        <Animated.View
          key={profile.matchId || user._id}
          style={[styles.card, isDark && styles.cardDark, getCardStyle()]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.cardInner}
            activeOpacity={0.95}
            onPress={() => handleCardPress(profile)}
          >
            <View style={styles.photoContainer}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Ionicons name="person" size={80} color="#CCC" />
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.photoGradient}
              />

              {/* Like overlay */}
              <Animated.View style={[styles.likeOverlay, { opacity: getLikeOpacity() }]}>
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={styles.swipeLabel}
                >
                  <Ionicons name="heart" size={24} color="#FFF" />
                  <Text style={styles.swipeLabelText}>LIKE</Text>
                </LinearGradient>
              </Animated.View>

              {/* Nope overlay */}
              <Animated.View style={[styles.nopeOverlay, { opacity: getNopeOpacity() }]}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.swipeLabel}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                  <Text style={styles.swipeLabelText}>NOPE</Text>
                </LinearGradient>
              </Animated.View>

              {/* Match score badge */}
              <View style={styles.matchScoreBadgeOverlay}>
                <LinearGradient
                  colors={['#EC4899', '#F43F5E']}
                  style={styles.matchScoreBadge}
                >
                  <Ionicons name="heart" size={12} color="#FFF" />
                  <Text style={styles.matchScoreText}>{profile.matchScore}%</Text>
                </LinearGradient>
              </View>

              {/* User info */}
              <View style={styles.photoInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.username}</Text>
                  {user.age && <Text style={styles.userAge}>, {user.age}</Text>}
                  {user.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    </View>
                  )}
                </View>
                {user.location?.city && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.locationText}>
                      {user.location.city}{profile.distance > 0 && ` • ${profile.distance} km`}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Info section */}
            <View style={[styles.cardInfo, isDark && styles.cardInfoDark]}>
              <View style={styles.cardInfoHeader}>
                <LinearGradient
                  colors={fitnessLevel.gradient}
                  style={styles.levelBadge}
                >
                  <Ionicons name="fitness" size={12} color="#FFF" />
                  <Text style={styles.levelText}>{fitnessLevel.label}</Text>
                </LinearGradient>
              </View>

              {user.bio && (
                <Text style={[styles.bio, isDark && styles.bioDark]} numberOfLines={2}>
                  {user.bio}
                </Text>
              )}

              {user.workoutTypes?.length > 0 && (
                <View style={styles.workoutTypes}>
                  {user.workoutTypes.slice(0, 4).map((type, i) => (
                    <View key={i} style={[styles.workoutChip, isDark && styles.workoutChipDark]}>
                      <Ionicons
                        name={WORKOUT_TYPE_ICONS[type] || 'fitness'}
                        size={12}
                        color={theme.colors.primary}
                      />
                      <Text style={[styles.workoutChipText, isDark && styles.workoutChipTextDark]}>
                        {type}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Next card
    return (
      <Animated.View
        key={profile.matchId || user._id}
        style={[
          styles.card,
          styles.cardBehind,
          isDark && styles.cardDark,
          {
            transform: [{ scale: nextCardScale }],
            opacity: nextCardOpacity,
          },
        ]}
      >
        <View style={styles.cardInner}>
          <View style={styles.photoContainer}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons name="person" size={80} color="#CCC" />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.photoGradient}
            />
            <View style={styles.photoInfo}>
              <Text style={styles.userName}>{user.username}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render action buttons with enhanced design
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.actionButtonWrapper}
        onPress={swipeLeft}
        disabled={currentIndex >= suggestions.length}
        activeOpacity={0.8}
      >
        <View style={[styles.actionButton, styles.rejectButton]}>
          <Ionicons name="close" size={32} color="#EF4444" />
        </View>
        <Text style={[styles.actionButtonLabel, isDark && styles.textMuted]}>Passer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButtonWrapper}
        onPress={swipeRight}
        disabled={currentIndex >= suggestions.length}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          style={[styles.actionButton, styles.likeButton]}
        >
          <Ionicons name="heart" size={32} color="#FFF" />
        </LinearGradient>
        <Text style={[styles.actionButtonLabel, isDark && styles.textMuted]}>J'aime</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty discover state
  const renderEmptyDiscover = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.emptyIconContainer}
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          style={styles.emptyIconInner}
        >
          <Ionicons name="people" size={40} color="#FFF" />
        </LinearGradient>
      </LinearGradient>
      <Text style={[styles.emptyTitle, isDark && styles.textLight]}>Plus de profils</Text>
      <Text style={[styles.emptyText, isDark && styles.textMuted]}>
        Tu as vu tous les profils disponibles. Reviens plus tard !
      </Text>
      <TouchableOpacity
        style={styles.ctaButtonWrapper}
        onPress={onRefresh}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.ctaButtonText}>Actualiser</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render discover tab
  const renderDiscoverTab = () => (
    <View style={styles.discoverContainer}>
      <View style={styles.cardsContainer}>
        {currentIndex >= suggestions.length ? (
          renderEmptyDiscover()
        ) : (
          suggestions.map((profile, index) => renderCard(profile, index)).reverse()
        )}
      </View>
      {currentIndex < suggestions.length && renderActionButtons()}
    </View>
  );

  // Match modal with enhanced animations
  const renderMatchModal = () => {
    const modalRotation = matchModalRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Modal
        visible={showMatchModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowMatchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.matchModalContent,
              isDark && styles.modalContentDark,
              {
                transform: [{ scale: matchModalScale }],
              },
            ]}
          >
            {/* Confetti decoration */}
            <View style={styles.confettiContainer}>
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.confetti,
                    {
                      left: `${(i * 8) + 4}%`,
                      backgroundColor: ['#EC4899', '#F43F5E', '#22C55E', '#3B82F6'][i % 4],
                      transform: [{ rotate: `${i * 30}deg` }],
                    },
                  ]}
                />
              ))}
            </View>

            {/* Animated heart icon */}
            <Animated.View
              style={[
                styles.matchModalIconWrapper,
                {
                  transform: [
                    { scale: heartBeatAnim },
                    { rotate: modalRotation },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#EC4899', '#F43F5E']}
                style={styles.matchModalIcon}
              >
                <Ionicons name="heart" size={48} color="#FFF" />
              </LinearGradient>
            </Animated.View>

            <Text style={[styles.matchModalTitle, isDark && styles.textLight]}>
              C'est un match !
            </Text>
            <Text style={[styles.matchModalText, isDark && styles.textMuted]}>
              Toi et {newMatch?.user?.username} vous êtes mutuellement likés
            </Text>

            {/* User avatars */}
            <View style={styles.matchAvatars}>
              <View style={styles.matchAvatarWrapper}>
                <LinearGradient
                  colors={[theme.colors.primary, '#16A34A']}
                  style={styles.matchAvatarGradient}
                >
                  <View style={[styles.matchAvatarPlaceholder, isDark && styles.matchAvatarPlaceholderDark]}>
                    <Ionicons name="person" size={24} color={isDark ? '#666' : '#CCC'} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.matchHeartIcon}>
                <Ionicons name="heart" size={20} color="#EC4899" />
              </View>
              <View style={styles.matchAvatarWrapper}>
                <LinearGradient
                  colors={['#EC4899', '#F43F5E']}
                  style={styles.matchAvatarGradient}
                >
                  {newMatch?.user?.photo ? (
                    <Image source={{ uri: newMatch.user.photo }} style={styles.matchAvatar} />
                  ) : (
                    <View style={[styles.matchAvatarPlaceholder, isDark && styles.matchAvatarPlaceholderDark]}>
                      <Ionicons name="person" size={24} color={isDark ? '#666' : '#CCC'} />
                    </View>
                  )}
                </LinearGradient>
              </View>
            </View>

            <View style={styles.matchModalButtons}>
              <TouchableOpacity
                style={[styles.matchModalButton, styles.matchModalButtonOutline, isDark && styles.matchModalButtonOutlineDark]}
                onPress={() => setShowMatchModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.matchModalButtonOutlineText, isDark && styles.textLight]}>Continuer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.matchModalButtonGradientWrapper}
                onPress={() => {
                  setShowMatchModal(false);
                  navigation.navigate('ChatDetail', { matchId: newMatch?._id });
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary, '#16A34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.matchModalButtonGradient}
                >
                  <Ionicons name="chatbubble" size={18} color="#FFF" />
                  <Text style={styles.matchModalButtonPrimaryText}>Envoyer un message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, isDark && styles.textMuted]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Gradient Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            }],
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#1A1D24', '#12151A'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={[theme.colors.primary, '#16A34A']}
                style={styles.headerIconBg}
              >
                <Ionicons name="people" size={20} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.title, isDark && styles.textLight]}>Social</Text>
            </View>
            <TouchableOpacity
              style={[styles.settingsButton, isDark && styles.settingsButtonDark]}
              onPress={() => navigation.navigate('ProfileTab', { screen: 'ProfileSetup' })}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={22} color={isDark ? '#FFF' : '#374151'} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Modern Tabs */}
      <View style={[styles.tabsContainer, isDark && styles.tabsContainerDark]}>
        <View style={styles.tabsWrapper}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{
                  translateX: tabIndicatorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (SCREEN_WIDTH - 48) / 2],
                  }),
                }],
              },
            ]}
          >
            <LinearGradient
              colors={[theme.colors.primary, '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabIndicatorGradient}
            />
          </Animated.View>

          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={activeTab === tab.key ? (isDark ? '#FFF' : '#1F2937') : (isDark ? '#6B7280' : '#9CA3AF')}
                />
                <Text
                  style={[
                    styles.tabText,
                    isDark && styles.tabTextDark,
                    activeTab === tab.key && styles.tabTextActive,
                    activeTab === tab.key && isDark && styles.tabTextActiveDark,
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.key === 'messages' && unreadCount > 0 && (
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.tabBadge}
                  >
                    <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                  </LinearGradient>
                )}
                {tab.key === 'discover' && pendingSuggestions > 0 && (
                  <LinearGradient
                    colors={['#22C55E', '#16A34A']}
                    style={styles.tabBadge}
                  >
                    <Text style={styles.tabBadgeText}>{pendingSuggestions}</Text>
                  </LinearGradient>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'messages' ? renderMessagesTab() : renderDiscoverTab()}
      </View>

      {/* Modals */}
      {renderMatchModal()}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={selectedProfile}
        onSwipeLeft={swipeLeft}
        onSwipeRight={swipeRight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#12151A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Header
  header: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textMuted: {
    color: '#6B7280',
  },
  textBold: {
    fontWeight: '600',
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContainerDark: {
    borderBottomColor: '#1F2937',
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    paddingRight: 8,
  },
  tabIndicatorGradient: {
    flex: 1,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextDark: {
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  tabTextActiveDark: {
    color: '#FFF',
  },
  tabBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  content: {
    flex: 1,
  },
  messagesListContent: {
    paddingTop: 8,
  },

  // New matches section
  newMatchesSection: {
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionBadge: {
    backgroundColor: '#EC4899',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  newMatchesList: {
    paddingHorizontal: 16,
  },
  newMatchItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
  },
  newMatchGradientRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMatchAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFF',
  },
  newMatchBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  newMatchBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
  },
  newMatchName: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    color: '#374151',
    fontWeight: '500',
  },

  // Conversations
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  conversationItemDark: {
    backgroundColor: '#1A1D24',
    shadowOpacity: 0,
  },
  conversationAvatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
  },
  avatarPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  conversationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  conversationPreview: {
    fontSize: 14,
    color: '#6B7280',
  },
  conversationPreviewUnread: {
    color: '#374151',
    fontWeight: '500',
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  ctaButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 10,
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Discover
  discoverContainer: {
    flex: 1,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.58,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#1A1D24',
  },
  cardBehind: {
    top: 8,
  },
  cardInner: {
    flex: 1,
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
  },
  userAge: {
    fontSize: 24,
    fontWeight: '400',
    color: '#FFF',
  },
  verifiedBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginLeft: 4,
  },
  matchScoreBadgeOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  swipeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  swipeLabelText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  likeOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  nopeOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  cardInfo: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  cardInfoDark: {
    backgroundColor: '#1A1D24',
  },
  cardInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  bio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  bioDark: {
    color: '#9CA3AF',
  },
  workoutTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  workoutChipDark: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  workoutChipText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  workoutChipTextDark: {
    color: '#D1D5DB',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    paddingBottom: 24,
    paddingTop: 16,
  },
  actionButtonWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  rejectButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  likeButton: {
    // gradient applied via LinearGradient
  },
  actionButtonLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  matchModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: '#1A1D24',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 20,
    borderRadius: 4,
    top: -10,
  },
  matchModalIconWrapper: {
    marginBottom: 20,
    marginTop: 20,
  },
  matchModalIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  matchModalText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  matchAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  matchAvatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  matchAvatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF',
  },
  matchAvatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchAvatarPlaceholderDark: {
    backgroundColor: '#2A2E36',
  },
  matchHeartIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  matchModalButtons: {
    width: '100%',
    gap: 12,
  },
  matchModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  matchModalButtonOutline: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  matchModalButtonOutlineDark: {
    borderColor: '#374151',
  },
  matchModalButtonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  matchModalButtonGradientWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  matchModalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  matchModalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
