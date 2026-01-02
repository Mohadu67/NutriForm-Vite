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

import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme, colors } from '../../theme';
import { getConversations, getUnreadCount } from '../../api/matchChat';
import { getMutualMatches, getMatchSuggestions, likeProfile, rejectProfile } from '../../api/matching';
import ProfileModal from '../../components/matching/ProfileModal';
import useSwipeGesture from '../../hooks/useSwipeGesture';
import logger from '../../services/logger';
import websocketService from '../../services/websocket';

const DEFAULT_BOT_NAME = 'Assistant Harmonith';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Onglets
const TABS = [
  { key: 'messages', label: 'Messages', icon: 'chatbubbles' },
  { key: 'discover', label: 'Découvrir', icon: 'people' },
];

// Fitness levels with theme-consistent colors
const FITNESS_LEVELS = {
  beginner: { label: 'Débutant', color: colors.success, gradient: [colors.success, '#3D9140'] },
  intermediate: { label: 'Intermédiaire', color: colors.warning, gradient: [colors.warning, '#E0A800'] },
  advanced: { label: 'Avancé', color: colors.accent, gradient: [colors.accent, '#E55A5A'] },
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

// Theme colors helper
const THEME_COLORS = {
  primaryGradient: [colors.primary, colors.primaryDark],
  secondaryGradient: [colors.secondary, colors.secondaryDark],
  accentGradient: [colors.accent, '#E55A5A'],
  warmGradient: colors.gradients.warm,
};

// Separate component for conversation item to use hooks properly
const ConversationItem = React.memo(({ item, index, isDark, navigation, formatRelativeTime, onlineUsers, onAvatarPress }) => {
  const otherUser = item.otherUser;
  const hasUnread = item.unreadCount > 0;
  const itemAnim = useRef(new Animated.Value(0)).current;

  // Vérifier si l'utilisateur est en ligne (API ou WebSocket temps réel)
  const otherUserId = otherUser?._id?.toString();
  const isOnline = item.otherUserOnline || onlineUsers?.has(otherUserId);

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
        <TouchableOpacity
          style={styles.conversationAvatarWrapper}
          onPress={() => onAvatarPress?.(otherUser)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={hasUnread ? THEME_COLORS.primaryGradient : (isDark ? [colors.dark.border, colors.dark.borderDark] : [colors.light.border, colors.light.borderDark])}
            style={styles.avatarGradientRing}
          >
            {otherUser?.photo ? (
              <Image source={{ uri: otherUser.photo }} style={styles.conversationAvatar} />
            ) : (
              <View style={[styles.conversationAvatar, styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
                <Ionicons name="person" size={24} color={isDark ? colors.dark.textTertiary : colors.light.textTertiary} />
              </View>
            )}
          </LinearGradient>
          {/* Indicateur en ligne (vert) */}
          {isOnline && (
            <View style={[styles.onlineIndicator, isDark && styles.onlineIndicatorDark]}>
              <View style={styles.onlineDot} />
            </View>
          )}
          {/* Indicateur hors ligne (gris) - optionnel */}
          {!isOnline && (
            <View style={[styles.onlineIndicator, isDark && styles.onlineIndicatorDark]}>
              <View style={[styles.onlineDot, styles.offlineDot]} />
            </View>
          )}
        </TouchableOpacity>

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
            colors={THEME_COLORS.primaryGradient}
            style={styles.unreadBadge}
          >
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </LinearGradient>
        )}

        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDark ? colors.dark.textTertiary : colors.light.textTertiary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

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
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [newMatch, setNewMatch] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isRefreshAnimating, setIsRefreshAnimating] = useState(false);
  const [botName, setBotName] = useState(DEFAULT_BOT_NAME);

  // Card refresh animation
  const cardRefreshAnim = useRef(new Animated.Value(1)).current;

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
  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // S'abonner aux changements de statut en ligne
  useEffect(() => {
    const unsubscribe = websocketService.onOnlineStatusChange((userId, isOnline) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Charger le nom du bot
      const loadBotName = async () => {
        try {
          const savedName = await AsyncStorage.getItem('@ai_chat_bot_name');
          if (savedName) setBotName(savedName);
        } catch (error) {
          console.error('Failed to load bot name:', error);
        }
      };
      loadBotName();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentIndex(0);
    loadData();
  }, []);

  // Animated refresh for discover tab
  const handleDiscoverRefresh = useCallback(() => {
    setIsRefreshAnimating(true);

    // Animate cards out
    Animated.sequence([
      Animated.timing(cardRefreshAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset index and reload
      setCurrentIndex(0);
      setRefreshing(true);
      loadData().finally(() => {
        // Animate cards back in
        Animated.spring(cardRefreshAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start(() => {
          setIsRefreshAnimating(false);
        });
      });
    });
  }, [cardRefreshAnim]);

  const handleCardPress = (profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const handleAvatarPress = (user) => {
    if (user) {
      navigation.navigate('UserProfile', { user });
    }
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

  // Render conversation item wrapper
  const renderConversationItem = useCallback(({ item, index }) => (
    <ConversationItem
      item={item}
      index={index}
      isDark={isDark}
      navigation={navigation}
      formatRelativeTime={formatRelativeTime}
      onlineUsers={onlineUsers}
      onAvatarPress={handleAvatarPress}
    />
  ), [isDark, navigation, onlineUsers]);

  // Render new matches (conversations non commencées)
  const renderNewMatches = () => {
    const matchesWithoutConvo = mutualMatches.filter(
      match => !conversations.some(c => c.matchId === match._id)
    );

    if (matchesWithoutConvo.length === 0) return null;

    return (
      <View style={[styles.newMatchesSection, isDark && styles.newMatchesSectionDark]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrapper}>
            <LinearGradient
              colors={THEME_COLORS.warmGradient}
              style={styles.sectionIcon}
            >
              <Ionicons name="sparkles" size={12} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Nouveaux matchs</Text>
          </View>
          <View style={[styles.sectionBadge, { backgroundColor: colors.accent }]}>
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
              onPress={() => handleAvatarPress(item.user)}
            >
              <LinearGradient
                colors={THEME_COLORS.warmGradient}
                style={styles.newMatchGradientRing}
              >
                {item.user?.photo ? (
                  <Image source={{ uri: item.user.photo }} style={styles.newMatchAvatar} />
                ) : (
                  <View style={[styles.newMatchAvatar, styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
                    <Ionicons name="person" size={28} color={isDark ? colors.dark.textTertiary : colors.light.textTertiary} />
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

  // Render AI Chat Card
  const renderAIChatCard = () => (
    <TouchableOpacity
      style={[styles.aiChatCard, isDark && styles.aiChatCardDark]}
      onPress={() => navigation.navigate('AIChat')}
      activeOpacity={0.8}
    >
      <View style={styles.aiChatContent}>
        <LinearGradient
          colors={THEME_COLORS.primaryGradient}
          style={styles.aiAvatar}
        >
          <Ionicons name="sparkles" size={24} color="#FFF" />
        </LinearGradient>
        <View style={styles.aiChatInfo}>
          <View style={styles.aiChatHeader}>
            <Text style={[styles.aiChatName, isDark && styles.textLight]}>{botName}</Text>
            <View style={styles.aiOnlineBadge}>
              <View style={styles.aiOnlineDot} />
              <Text style={styles.aiOnlineText}>En ligne</Text>
            </View>
          </View>
          <Text style={[styles.aiChatDescription, isDark && styles.textMuted]} numberOfLines={1}>
            Pose tes questions sur l'entrainement, nutrition...
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  // Render messages header (AI card + new matches)
  const renderMessagesHeader = () => (
    <View>
      {renderAIChatCard()}
      {renderNewMatches()}
    </View>
  );

  // Render empty messages state
  const renderEmptyMessages = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={isDark ? [colors.dark.backgroundSecondary, colors.dark.backgroundTertiary] : [colors.light.backgroundSecondary, colors.light.backgroundTertiary]}
        style={styles.emptyIconContainer}
      >
        <LinearGradient
          colors={THEME_COLORS.primaryGradient}
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
          colors={THEME_COLORS.primaryGradient}
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
      ListHeaderComponent={renderMessagesHeader}
      ListEmptyComponent={!loading && renderEmptyMessages}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
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
                  <Ionicons name="person" size={80} color={colors.light.textTertiary} />
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.photoGradient}
              />

              {/* Like overlay */}
              <Animated.View style={[styles.likeOverlay, { opacity: getLikeOpacity() }]}>
                <LinearGradient
                  colors={[colors.success, '#3D9140']}
                  style={styles.swipeLabel}
                >
                  <Ionicons name="heart" size={24} color="#FFF" />
                  <Text style={styles.swipeLabelText}>LIKE</Text>
                </LinearGradient>
              </Animated.View>

              {/* Nope overlay */}
              <Animated.View style={[styles.nopeOverlay, { opacity: getNopeOpacity() }]}>
                <LinearGradient
                  colors={[colors.error, '#D32F2F']}
                  style={styles.swipeLabel}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                  <Text style={styles.swipeLabelText}>NOPE</Text>
                </LinearGradient>
              </Animated.View>

              {/* Match score badge */}
              <View style={styles.matchScoreBadgeOverlay}>
                <LinearGradient
                  colors={THEME_COLORS.warmGradient}
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
                      <Ionicons name="checkmark-circle" size={20} color={colors.info} />
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
                        color={colors.primary}
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
                <Ionicons name="person" size={80} color={colors.light.textTertiary} />
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
        <View style={[styles.actionButton, styles.rejectButton, isDark && styles.rejectButtonDark]}>
          <Ionicons name="close" size={32} color={colors.error} />
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
          colors={THEME_COLORS.primaryGradient}
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
    <Animated.View
      style={[
        styles.emptyState,
        {
          opacity: cardRefreshAnim,
          transform: [{
            scale: cardRefreshAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          }],
        },
      ]}
    >
      <LinearGradient
        colors={isDark ? [colors.dark.backgroundSecondary, colors.dark.backgroundTertiary] : [colors.light.backgroundSecondary, colors.light.backgroundTertiary]}
        style={styles.emptyIconContainer}
      >
        <LinearGradient
          colors={THEME_COLORS.secondaryGradient}
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
        onPress={handleDiscoverRefresh}
        disabled={isRefreshAnimating}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={THEME_COLORS.secondaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.ctaButton, isRefreshAnimating && styles.ctaButtonDisabled]}
        >
          {isRefreshAnimating ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.ctaButtonText}>Actualiser</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render discover tab
  const renderDiscoverTab = () => (
    <View style={styles.discoverContainer}>
      <Animated.View
        style={[
          styles.cardsContainer,
          {
            opacity: cardRefreshAnim,
            transform: [{
              scale: cardRefreshAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
              }),
            }],
          },
        ]}
      >
        {currentIndex >= suggestions.length ? (
          renderEmptyDiscover()
        ) : (
          suggestions.map((profile, index) => renderCard(profile, index)).reverse()
        )}
      </Animated.View>
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
                      backgroundColor: [colors.primary, colors.accent, colors.secondary, colors.warning][i % 4],
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
                colors={THEME_COLORS.warmGradient}
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
                  colors={THEME_COLORS.primaryGradient}
                  style={styles.matchAvatarGradient}
                >
                  <View style={[styles.matchAvatarPlaceholder, isDark && styles.matchAvatarPlaceholderDark]}>
                    <Ionicons name="person" size={24} color={isDark ? colors.dark.textTertiary : colors.light.textTertiary} />
                  </View>
                </LinearGradient>
              </View>
              <View style={[styles.matchHeartIcon, isDark && styles.matchHeartIconDark]}>
                <Ionicons name="heart" size={20} color={colors.accent} />
              </View>
              <View style={styles.matchAvatarWrapper}>
                <LinearGradient
                  colors={THEME_COLORS.warmGradient}
                  style={styles.matchAvatarGradient}
                >
                  {newMatch?.user?.photo ? (
                    <Image source={{ uri: newMatch.user.photo }} style={styles.matchAvatar} />
                  ) : (
                    <View style={[styles.matchAvatarPlaceholder, isDark && styles.matchAvatarPlaceholderDark]}>
                      <Ionicons name="person" size={24} color={isDark ? colors.dark.textTertiary : colors.light.textTertiary} />
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
                  colors={THEME_COLORS.primaryGradient}
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
          <ActivityIndicator size="large" color={colors.primary} />
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
          colors={isDark ? [colors.dark.backgroundSecondary, colors.dark.background] : [colors.light.background, colors.light.backgroundSecondary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={THEME_COLORS.primaryGradient}
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
              <Ionicons name="options-outline" size={22} color={isDark ? colors.dark.text : colors.light.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Modern Tabs */}
      <View style={[styles.tabsContainer, isDark && styles.tabsContainerDark]}>
        <View style={[styles.tabsWrapper, isDark && styles.tabsWrapperDark]}>
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
              colors={THEME_COLORS.primaryGradient}
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
                  color={activeTab === tab.key ? (isDark ? colors.dark.text : colors.light.text) : (isDark ? colors.dark.textTertiary : colors.light.textTertiary)}
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
                    colors={[colors.accent, '#E55A5A']}
                    style={styles.tabBadge}
                  >
                    <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                  </LinearGradient>
                )}
                {tab.key === 'discover' && pendingSuggestions > 0 && (
                  <LinearGradient
                    colors={THEME_COLORS.primaryGradient}
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
    backgroundColor: colors.light.background,
  },
  containerDark: {
    backgroundColor: colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.light.textSecondary,
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
    color: colors.light.text,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonDark: {
    backgroundColor: colors.dark.backgroundTertiary,
  },
  textLight: {
    color: colors.dark.text,
  },
  textMuted: {
    color: colors.dark.textTertiary,
  },
  textBold: {
    fontWeight: '600',
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  tabsContainerDark: {
    borderBottomColor: colors.dark.border,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.light.backgroundTertiary,
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tabsWrapperDark: {
    backgroundColor: colors.dark.backgroundTertiary,
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
    color: colors.light.textTertiary,
  },
  tabTextDark: {
    color: colors.dark.textTertiary,
  },
  tabTextActive: {
    color: colors.light.text,
    fontWeight: '600',
  },
  tabTextActiveDark: {
    color: colors.dark.text,
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

  // AI Chat Card
  aiChatCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${colors.primary}30`,
  },
  aiChatCardDark: {
    backgroundColor: `${colors.primary}15`,
    borderColor: `${colors.primary}40`,
  },
  aiChatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  aiAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiChatInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  aiChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiChatName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.light.text,
  },
  aiOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  aiOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  aiOnlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  aiChatDescription: {
    fontSize: 14,
    marginTop: 4,
    color: colors.light.textSecondary,
  },

  // New matches section
  newMatchesSection: {
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  newMatchesSectionDark: {
    borderBottomColor: colors.dark.border,
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
    color: colors.light.text,
  },
  sectionBadge: {
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
    backgroundColor: colors.light.background,
  },
  newMatchBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.light.background,
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
    color: colors.light.text,
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
    backgroundColor: colors.light.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  conversationItemDark: {
    backgroundColor: colors.dark.surface,
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
    backgroundColor: colors.light.background,
  },
  avatarPlaceholder: {
    backgroundColor: colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: colors.dark.backgroundTertiary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicatorDark: {
    backgroundColor: colors.dark.background,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success, // Vert pour en ligne
  },
  offlineDot: {
    backgroundColor: colors.light.textTertiary, // Gris pour hors ligne
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
    color: colors.light.text,
  },
  conversationTime: {
    fontSize: 12,
    color: colors.light.textTertiary,
  },
  conversationPreview: {
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  conversationPreviewUnread: {
    color: colors.light.text,
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
    color: colors.light.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.light.textSecondary,
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
  ctaButtonDisabled: {
    opacity: 0.7,
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
    backgroundColor: colors.light.surface,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: colors.dark.surface,
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
    backgroundColor: colors.light.backgroundTertiary,
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
    backgroundColor: colors.light.surface,
  },
  cardInfoDark: {
    backgroundColor: colors.dark.surface,
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
    color: colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  bioDark: {
    color: colors.dark.textSecondary,
  },
  workoutTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  workoutChipDark: {
    backgroundColor: `${colors.primary}30`,
  },
  workoutChipText: {
    fontSize: 12,
    color: colors.light.text,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  workoutChipTextDark: {
    color: colors.dark.text,
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
    backgroundColor: colors.light.surface,
    borderWidth: 2,
    borderColor: colors.error,
  },
  rejectButtonDark: {
    backgroundColor: colors.dark.surface,
  },
  likeButton: {
    // gradient applied via LinearGradient
  },
  actionButtonLabel: {
    fontSize: 12,
    color: colors.light.textSecondary,
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
    backgroundColor: colors.light.surface,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: colors.dark.surface,
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
    color: colors.light.text,
    marginBottom: 8,
  },
  matchModalText: {
    fontSize: 15,
    color: colors.light.textSecondary,
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
    backgroundColor: colors.light.background,
  },
  matchAvatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.light.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchAvatarPlaceholderDark: {
    backgroundColor: colors.dark.backgroundTertiary,
  },
  matchHeartIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  matchHeartIconDark: {
    backgroundColor: `${colors.accent}30`,
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
    borderColor: colors.light.border,
  },
  matchModalButtonOutlineDark: {
    borderColor: colors.dark.border,
  },
  matchModalButtonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
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
