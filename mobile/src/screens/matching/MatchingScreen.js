import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import { getMatchSuggestions, likeProfile, rejectProfile, getMutualMatches } from '../../api/matching';
import ProfileModal from '../../components/matching/ProfileModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

const FITNESS_LEVELS = {
  beginner: { label: 'Debutant', color: '#22C55E' },
  intermediate: { label: 'Intermediaire', color: '#F59E0B' },
  advanced: { label: 'Avance', color: '#EF4444' },
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

  const [suggestions, setSuggestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [mutualMatches, setMutualMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [newMatch, setNewMatch] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const nextCardScale = useRef(new Animated.Value(0.92)).current;
  const nextCardOpacity = useRef(new Animated.Value(0.7)).current;

  // Refs for PanResponder to avoid stale closure
  const actionLoadingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const suggestionsLengthRef = useRef(0);
  const swipeRightRef = useRef(null);
  const swipeLeftRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    actionLoadingRef.current = actionLoading;
  }, [actionLoading]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    suggestionsLengthRef.current = suggestions.length;
  }, [suggestions]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        console.log('[SWIPE] onStartShouldSetPanResponder - actionLoading:', actionLoadingRef.current, 'currentIndex:', currentIndexRef.current, 'suggestionsLength:', suggestionsLengthRef.current);
        return !actionLoadingRef.current && currentIndexRef.current < suggestionsLengthRef.current;
      },
      onMoveShouldSetPanResponder: () => !actionLoadingRef.current && currentIndexRef.current < suggestionsLengthRef.current,
      onPanResponderMove: (_, gesture) => {
        if (actionLoadingRef.current) return;
        position.setValue({ x: gesture.dx, y: gesture.dy });
        // Scale up next card as current card moves
        const progress = Math.min(Math.abs(gesture.dx) / SWIPE_THRESHOLD, 1);
        nextCardScale.setValue(0.92 + (0.08 * progress));
        nextCardOpacity.setValue(0.7 + (0.3 * progress));
      },
      onPanResponderRelease: (_, gesture) => {
        console.log('[SWIPE] onPanResponderRelease - dx:', gesture.dx, 'actionLoading:', actionLoadingRef.current, 'currentIndex:', currentIndexRef.current, 'suggestionsLength:', suggestionsLengthRef.current);
        if (actionLoadingRef.current || currentIndexRef.current >= suggestionsLengthRef.current) {
          console.log('[SWIPE] Resetting position - action in progress or no more cards');
          resetPosition();
          return;
        }
        if (gesture.dx > SWIPE_THRESHOLD) {
          console.log('[SWIPE] Swipe RIGHT detected');
          if (swipeRightRef.current) {
            swipeRightRef.current();
          } else {
            console.log('[SWIPE] ERROR: swipeRightRef.current is null!');
          }
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          console.log('[SWIPE] Swipe LEFT detected');
          if (swipeLeftRef.current) {
            swipeLeftRef.current();
          } else {
            console.log('[SWIPE] ERROR: swipeLeftRef.current is null!');
          }
        } else {
          console.log('[SWIPE] Swipe not far enough, resetting');
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        console.log('[SWIPE] onPanResponderTerminate - gesture was terminated');
        resetPosition();
      },
    })
  ).current;

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [suggestionsRes, matchesRes] = await Promise.all([
        getMatchSuggestions({ limit: 20 }),
        getMutualMatches(),
      ]);

      console.log('[MATCHING] Suggestions response:', suggestionsRes);
      console.log('[MATCHING] Mutual matches response:', matchesRes);

      if (suggestionsRes?.matches) {
        // Filtrer les profils déjà likés ou mutuels (ils sont déjà dans la liste des matches)
        const filteredSuggestions = suggestionsRes.matches.filter(s => {
          const shouldShow = !s.hasLiked && !s.isMutual;
          console.log('[MATCHING] Filter check -', s.user?.username, ': hasLiked=', s.hasLiked, 'isMutual=', s.isMutual, 'shouldShow=', shouldShow);
          return shouldShow;
        });
        setSuggestions(filteredSuggestions);
        console.log('[MATCHING] Loaded', filteredSuggestions.length, 'suggestions (filtered from', suggestionsRes.matches.length, ')');
      } else {
        setSuggestions([]);
        console.log('[MATCHING] No suggestions found');
      }

      if (matchesRes?.matches) {
        setMutualMatches(matchesRes.matches);
        console.log('[MATCHING] Loaded', matchesRes.matches.length, 'mutual matches');
      } else {
        setMutualMatches([]);
      }
    } catch (err) {
      console.log('[MATCHING] Error:', err.message, err);
      setError(err.message || 'Erreur lors du chargement des profils');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentIndex(0);
    loadData();
  }, []);

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
    nextCardScale.setValue(0.92);
    nextCardOpacity.setValue(0.7);
  };

  const swipeRight = useCallback(async () => {
    console.log('[SWIPE] swipeRight called - actionLoading:', actionLoadingRef.current, 'currentIndex:', currentIndexRef.current);
    if (actionLoadingRef.current || currentIndexRef.current >= suggestionsLengthRef.current) {
      console.log('[SWIPE] swipeRight early return');
      return;
    }

    const currentProfile = suggestions[currentIndexRef.current];
    if (!currentProfile) {
      console.log('[SWIPE] No current profile found');
      return;
    }

    console.log('[SWIPE] Starting swipeRight animation for profile:', currentProfile.user.username);
    actionLoadingRef.current = true;
    setActionLoading(true);

    // Start animation
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      console.log('[SWIPE] swipeRight animation completed');
      goToNextCard();
      actionLoadingRef.current = false;
      setActionLoading(false);
    });

    // Call API in parallel
    try {
      const result = await likeProfile(currentProfile.user._id);
      if (result?.match?.isMutual) {
        setNewMatch(currentProfile);
        setShowMatchModal(true);
        setMutualMatches(prev => [{ ...currentProfile, _id: result.match._id }, ...prev]);
      }
    } catch (err) {
      console.log('[MATCHING] Like error:', err.message);
    }
  }, [suggestions, position]);

  // Update ref when function changes
  useEffect(() => {
    swipeRightRef.current = swipeRight;
  }, [swipeRight]);

  const swipeLeft = useCallback(async () => {
    console.log('[SWIPE] swipeLeft called - actionLoading:', actionLoadingRef.current, 'currentIndex:', currentIndexRef.current);
    if (actionLoadingRef.current || currentIndexRef.current >= suggestionsLengthRef.current) {
      console.log('[SWIPE] swipeLeft early return');
      return;
    }

    const currentProfile = suggestions[currentIndexRef.current];
    if (!currentProfile) {
      console.log('[SWIPE] No current profile found');
      return;
    }

    console.log('[SWIPE] Starting swipeLeft animation for profile:', currentProfile.user.username);
    actionLoadingRef.current = true;
    setActionLoading(true);

    // Start animation
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      console.log('[SWIPE] swipeLeft animation completed');
      goToNextCard();
      actionLoadingRef.current = false;
      setActionLoading(false);
    });

    // Call API in parallel
    try {
      await rejectProfile(currentProfile.user._id);
    } catch (err) {
      console.log('[MATCHING] Reject error:', err.message);
    }
  }, [suggestions, position]);

  // Update ref when function changes
  useEffect(() => {
    swipeLeftRef.current = swipeLeft;
  }, [swipeLeft]);

  const goToNextCard = () => {
    setCurrentIndex(prev => prev + 1);
    position.setValue({ x: 0, y: 0 });
    nextCardScale.setValue(0.92);
    nextCardOpacity.setValue(0.7);
  };

  const handleCardPress = (profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

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
            {/* Photo */}
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

              {/* User info on photo */}
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
                      {user.location.neighborhood ? `${user.location.neighborhood}, ` : ''}{user.location.city}
                      {profile.distance > 0 && ` • ${profile.distance} km`}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Info section */}
            <View style={styles.cardInfo}>
              {/* Match score */}
              <View style={styles.matchScoreContainer}>
                <View style={styles.matchScoreBadge}>
                  <Ionicons name="heart" size={16} color="#EF4444" />
                  <Text style={styles.matchScoreText}>{profile.matchScore}% compatible</Text>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: `${fitnessLevel.color}20` }]}>
                  <Text style={[styles.levelText, { color: fitnessLevel.color }]}>{fitnessLevel.label}</Text>
                </View>
              </View>

              {/* Bio */}
              {user.bio && (
                <Text style={[styles.bio, isDark && styles.bioDark]} numberOfLines={2}>
                  {user.bio}
                </Text>
              )}

              {/* Workout types */}
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

    // Next card (behind current)
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
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.username}</Text>
                {user.age && <Text style={styles.userAge}>, {user.age}</Text>}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.rejectButton]}
        onPress={swipeLeft}
        disabled={actionLoading || currentIndex >= suggestions.length}
      >
        <Ionicons name="close" size={32} color="#EF4444" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.likeButton]}
        onPress={swipeRight}
        disabled={actionLoading || currentIndex >= suggestions.length}
      >
        <Ionicons name="heart" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, isDark && styles.emptyIconDark]}>
        <Ionicons name="people" size={64} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
        {suggestions.length === 0 && currentIndex === 0 ? 'Aucun profil disponible' : 'Plus de profils'}
      </Text>
      <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
        {suggestions.length === 0 && currentIndex === 0
          ? 'Assure-toi que ton profil est completé avec ta localisation et que le matching est activé dans les paramètres.'
          : 'Tu as vu tous les profils disponibles. Reviens plus tard pour en decouvrir de nouveaux !'}
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={20} color="#FFF" />
        <Text style={styles.refreshButtonText}>Actualiser</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary, marginTop: 12 }]}
        onPress={() => navigation.navigate('ProfileTab', { screen: 'EditProfile' })}
      >
        <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.refreshButtonText, { color: theme.colors.primary }]}>Configurer mon profil</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMutualMatchesList = () => {
    if (mutualMatches.length === 0) return null;

    return (
      <View style={styles.matchesSection}>
        <View style={styles.matchesHeader}>
          <Text style={[styles.matchesSectionTitle, isDark && styles.textDark]}>
            Mes matchs ({mutualMatches.length})
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('MatchesList', { matches: mutualMatches })}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchesScroll}>
          {mutualMatches.slice(0, 10).map((match) => (
            <TouchableOpacity
              key={match._id}
              style={styles.matchItem}
              onPress={() => handleCardPress({
                matchId: match._id,
                user: match.user,
                matchScore: match.matchScore,
                distance: match.distance,
                isMutualMatch: true
              })}
            >
              {match.user?.photo ? (
                <Image source={{ uri: match.user.photo }} style={styles.matchPhoto} />
              ) : (
                <View style={[styles.matchPhoto, styles.matchPhotoPlaceholder]}>
                  <Ionicons name="person" size={24} color="#CCC" />
                </View>
              )}
              <Text style={[styles.matchName, isDark && styles.textDark]} numberOfLines={1}>
                {match.user?.username || 'Utilisateur'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

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
            Toi et {newMatch?.user?.username} vous etes mutuellement aimes
          </Text>

          <View style={styles.matchModalPhotos}>
            <View style={styles.matchModalPhotoContainer}>
              <View style={[styles.matchModalPhoto, styles.matchModalPhotoPlaceholder]}>
                <Ionicons name="person" size={32} color="#CCC" />
              </View>
            </View>
            <View style={styles.matchModalHeart}>
              <Ionicons name="heart" size={24} color="#EF4444" />
            </View>
            {newMatch?.user?.photo ? (
              <Image source={{ uri: newMatch.user.photo }} style={styles.matchModalPhoto} />
            ) : (
              <View style={[styles.matchModalPhoto, styles.matchModalPhotoPlaceholder]}>
                <Ionicons name="person" size={32} color="#CCC" />
              </View>
            )}
          </View>

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
                navigation.navigate('Chat', {
                  screen: 'ChatConversation',
                  params: { matchId: newMatch?._id, user: newMatch?.user }
                });
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


  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, isDark && styles.textMutedDark]}>
            Recherche de partenaires...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={[styles.errorTitle, isDark && styles.textDark]}>Oups !</Text>
          <Text style={[styles.errorText, isDark && styles.textMutedDark]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, isDark && styles.textDark]}>Matching</Text>
          <Text style={[styles.subtitle, isDark && styles.textMutedDark]}>
            Trouve ton partenaire sport
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ProfileTab', { screen: 'EditProfile' })}
          >
            <Ionicons name="settings-outline" size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          {mutualMatches.length > 0 && (
            <TouchableOpacity
              style={styles.matchesButton}
              onPress={() => navigation.navigate('MatchesList', { matches: mutualMatches })}
            >
              <Ionicons name="heart" size={20} color="#FFF" />
              <Text style={styles.matchesButtonText}>{mutualMatches.length}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mutual matches horizontal list */}
      {renderMutualMatchesList()}

      {/* Cards container */}
      <View style={styles.cardsContainer}>
        {currentIndex >= suggestions.length ? (
          renderEmptyState()
        ) : (
          <>
            {suggestions.map((profile, index) => renderCard(profile, index)).reverse()}
          </>
        )}
      </View>

      {/* Action buttons */}
      {currentIndex < suggestions.length && renderActionButtons()}

      {/* Loading overlay */}
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#888',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  matchesButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Matches section
  matchesSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  matchesScroll: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  matchItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  matchPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  matchPhotoPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchName: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },

  // Cards
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.58,
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

  // Like/Nope overlays
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

  // Card info
  cardInfo: {
    padding: 16,
    backgroundColor: 'transparent',
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

  // Action buttons
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

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Match modal
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
  matchModalPhotos: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  matchModalPhotoContainer: {},
  matchModalPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  matchModalPhotoPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModalHeart: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -10,
    zIndex: 1,
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

  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
