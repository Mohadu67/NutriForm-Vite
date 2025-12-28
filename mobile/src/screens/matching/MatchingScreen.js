import React, { useState, useEffect, useCallback } from 'react';
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
  beginner: { label: 'Débutant', color: '#22C55E' },
  intermediate: { label: 'Intermédiaire', color: '#F59E0B' },
  advanced: { label: 'Avancé', color: '#EF4444' },
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

      // getConversations retourne { success, conversations }
      if (convRes?.success && convRes.conversations) {
        setConversations(convRes.conversations);
        logger.matching.info('Conversations chargées:', convRes.conversations.length);
      }

      // getMutualMatches retourne { matches: [...] }
      if (matchesRes?.matches) {
        setMutualMatches(matchesRes.matches);
        logger.matching.info('Matchs mutuels chargés:', matchesRes.matches.length);
      }

      // getMatchSuggestions retourne { matches: [...] }
      if (suggestionsRes?.matches) {
        const filtered = suggestionsRes.matches.filter(s => !s.hasLiked && !s.isMutual);
        setSuggestions(filtered);
        setPendingSuggestions(filtered.length);
        logger.matching.info('Suggestions chargées:', filtered.length);
      }

      // getUnreadCount retourne { success, count }
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

  // Rafraîchir quand l'écran est focus
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

  // Formatage de la date relative
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

  // Render conversation item
  const renderConversationItem = ({ item }) => {
    const otherUser = item.otherUser;
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, isDark && styles.conversationItemDark]}
        onPress={() => navigation.navigate('ChatDetail', {
          conversationId: item._id,
          matchId: item.matchId,
          otherUser
        })}
        activeOpacity={0.7}
      >
        <View style={styles.conversationAvatar}>
          {otherUser?.photo ? (
            <Image source={{ uri: otherUser.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#CCC" />
            </View>
          )}
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, isDark && styles.textDark, hasUnread && styles.textBold]}>
              {otherUser?.pseudo || otherUser?.prenom || 'Utilisateur'}
            </Text>
            <Text style={[styles.conversationTime, isDark && styles.textMutedDark]}>
              {formatRelativeTime(item.lastMessage?.createdAt)}
            </Text>
          </View>
          <Text
            style={[
              styles.conversationPreview,
              isDark && styles.textMutedDark,
              hasUnread && styles.textBold
            ]}
            numberOfLines={1}
          >
            {item.lastMessage?.content || 'Commencez la conversation !'}
          </Text>
        </View>

        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render new matches (conversations non commencées)
  const renderNewMatches = () => {
    // Matches sans conversation
    const matchesWithoutConvo = mutualMatches.filter(
      match => !conversations.some(c => c.matchId === match._id)
    );

    if (matchesWithoutConvo.length === 0) return null;

    return (
      <View style={styles.newMatchesSection}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Nouveaux matchs</Text>
        <FlatList
          horizontal
          data={matchesWithoutConvo}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.newMatchItem}
              onPress={() => navigation.navigate('ChatDetail', { matchId: item._id, otherUser: item.user })}
            >
              <View style={styles.newMatchAvatarContainer}>
                {item.user?.photo ? (
                  <Image source={{ uri: item.user.photo }} style={styles.newMatchAvatar} />
                ) : (
                  <View style={[styles.newMatchAvatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={28} color="#CCC" />
                  </View>
                )}
                <View style={styles.newMatchBadge}>
                  <Text style={styles.newMatchBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={[styles.newMatchName, isDark && styles.textDark]} numberOfLines={1}>
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
      <View style={[styles.emptyIcon, isDark && styles.emptyIconDark]}>
        <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.textDark]}>Pas encore de messages</Text>
      <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
        Swipez sur des profils pour trouver des partenaires de sport et commencer à discuter !
      </Text>
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => setActiveTab('discover')}
      >
        <Ionicons name="people" size={20} color="#FFF" />
        <Text style={styles.ctaButtonText}>Découvrir des profils</Text>
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
      contentContainerStyle={conversations.length === 0 && styles.emptyListContainer}
      showsVerticalScrollIndicator={false}
    />
  );

  // Card styles for discover
  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-20deg', '0deg', '20deg'],
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

  // Render single card
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
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.photoGradient}
              />

              {/* Like/Nope overlays */}
              <Animated.View style={[styles.likeOverlay, { opacity: getLikeOpacity() }]}>
                <Text style={styles.likeText}>LIKE</Text>
              </Animated.View>
              <Animated.View style={[styles.nopeOverlay, { opacity: getNopeOpacity() }]}>
                <Text style={styles.nopeText}>NOPE</Text>
              </Animated.View>

              {/* User info */}
              <View style={styles.photoInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.username}</Text>
                  {user.age && <Text style={styles.userAge}>, {user.age}</Text>}
                  {user.isVerified && (
                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={{ marginLeft: 6 }} />
                  )}
                </View>
                {user.location?.city && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#FFF" />
                    <Text style={styles.locationText}>
                      {user.location.city}{profile.distance > 0 && ` • ${profile.distance} km`}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Info section */}
            <View style={styles.cardInfo}>
              <View style={styles.matchScoreContainer}>
                <View style={styles.matchScoreBadge}>
                  <Ionicons name="heart" size={16} color="#EF4444" />
                  <Text style={styles.matchScoreText}>{profile.matchScore}% compatible</Text>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: `${fitnessLevel.color}20` }]}>
                  <Text style={[styles.levelText, { color: fitnessLevel.color }]}>{fitnessLevel.label}</Text>
                </View>
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
                        size={14}
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

  // Render action buttons
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.rejectButton]}
        onPress={swipeLeft}
        disabled={currentIndex >= suggestions.length}
      >
        <Ionicons name="close" size={32} color="#EF4444" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.likeButton]}
        onPress={swipeRight}
        disabled={currentIndex >= suggestions.length}
      >
        <Ionicons name="heart" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // Render empty discover state
  const renderEmptyDiscover = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, isDark && styles.emptyIconDark]}>
        <Ionicons name="people-outline" size={64} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.textDark]}>Plus de profils</Text>
      <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
        Tu as vu tous les profils disponibles. Reviens plus tard !
      </Text>
      <TouchableOpacity style={styles.ctaButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={20} color="#FFF" />
        <Text style={styles.ctaButtonText}>Actualiser</Text>
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

  // Match modal
  const renderMatchModal = () => (
    <Modal
      visible={showMatchModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMatchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.matchModalContent, isDark && styles.modalContentDark]}>
          <View style={styles.matchModalIcon}>
            <Ionicons name="heart" size={48} color="#EF4444" />
          </View>
          <Text style={[styles.matchModalTitle, isDark && styles.textDark]}>
            C'est un match !
          </Text>
          <Text style={[styles.matchModalText, isDark && styles.textMutedDark]}>
            Toi et {newMatch?.user?.username} vous êtes mutuellement likés
          </Text>

          <View style={styles.matchModalButtons}>
            <TouchableOpacity
              style={[styles.matchModalButton, styles.matchModalButtonOutline]}
              onPress={() => setShowMatchModal(false)}
            >
              <Text style={styles.matchModalButtonOutlineText}>Continuer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.matchModalButton, styles.matchModalButtonPrimary]}
              onPress={() => {
                setShowMatchModal(false);
                navigation.navigate('ChatDetail', { matchId: newMatch?._id });
              }}
            >
              <Ionicons name="chatbubble" size={18} color="#FFF" />
              <Text style={styles.matchModalButtonPrimaryText}>Envoyer un message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>Social</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'EditProfile' })}
        >
          <Ionicons name="settings-outline" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? theme.colors.primary : (isDark ? '#888' : '#666')}
              />
              <Text
                style={[
                  styles.tabText,
                  isDark && styles.textMutedDark,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
              {tab.key === 'messages' && unreadCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                </View>
              )}
              {tab.key === 'discover' && pendingSuggestions > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: '#22C55E' }]}>
                  <Text style={styles.tabBadgeText}>{pendingSuggestions}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
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
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#888',
  },
  textBold: {
    fontWeight: '600',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  content: {
    flex: 1,
  },

  // New matches section
  newMatchesSection: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 12,
  },
  newMatchItem: {
    alignItems: 'center',
    marginLeft: theme.spacing.lg,
    width: 70,
  },
  newMatchAvatarContainer: {
    position: 'relative',
  },
  newMatchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  newMatchBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newMatchBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
  },
  newMatchName: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },

  // Conversations
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  conversationItemDark: {
    borderBottomColor: '#333',
  },
  conversationAvatar: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFF',
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
    color: theme.colors.text.primary,
  },
  conversationTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  conversationPreview: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: theme.spacing.sm,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
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
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconDark: {
    backgroundColor: '#333',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
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
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  cardBehind: {
    top: 10,
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
    height: 150,
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  userAge: {
    fontSize: 22,
    fontWeight: '400',
    color: '#FFF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 4,
  },
  likeOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    borderWidth: 4,
    borderColor: '#22C55E',
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '-20deg' }],
  },
  likeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#22C55E',
  },
  nopeOverlay: {
    position: 'absolute',
    top: 50,
    right: 20,
    borderWidth: 4,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '20deg' }],
  },
  nopeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EF4444',
  },
  cardInfo: {
    padding: 16,
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  matchScoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  bioDark: {
    color: '#AAA',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  workoutChipDark: {
    backgroundColor: '#333',
  },
  workoutChipText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
  },
  workoutChipTextDark: {
    color: '#DDD',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: 20,
    paddingTop: 10,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  rejectButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  likeButton: {
    backgroundColor: '#22C55E',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  matchModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalContentDark: {
    backgroundColor: '#2A2A2A',
  },
  matchModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchModalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  matchModalText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  matchModalButtons: {
    width: '100%',
    gap: 12,
  },
  matchModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  matchModalButtonOutline: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  matchModalButtonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  matchModalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  matchModalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
