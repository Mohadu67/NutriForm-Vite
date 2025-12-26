import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import { getMutualMatches } from '../../api/matching';
import ProfileModal from '../../components/matching/ProfileModal';

const FITNESS_LEVELS = {
  beginner: { label: 'Debutant', color: '#22C55E' },
  intermediate: { label: 'Intermediaire', color: '#F59E0B' },
  advanced: { label: 'Avance', color: '#EF4444' },
};

export default function MatchesListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const route = useRoute();

  const [matches, setMatches] = useState(route.params?.matches || []);
  const [loading, setLoading] = useState(!route.params?.matches);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    if (!route.params?.matches) {
      loadMatches();
    }
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const result = await getMutualMatches();
      if (result?.matches) {
        setMatches(result.matches);
      }
    } catch (err) {
      console.log('[MATCHES LIST] Error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMatches();
  }, []);

  const handleMatchPress = (match) => {
    setSelectedProfile({
      matchId: match._id,
      user: match.user,
      matchScore: match.matchScore,
      distance: match.distance,
      isMutualMatch: true
    });
    setShowProfileModal(true);
  };

  const renderMatch = ({ item }) => {
    const user = item.user;
    const fitnessLevel = FITNESS_LEVELS[user?.fitnessLevel] || FITNESS_LEVELS.intermediate;
    const matchDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    }) : '';

    return (
      <TouchableOpacity
        style={[styles.matchCard, isDark && styles.matchCardDark]}
        onPress={() => handleMatchPress(item)}
        activeOpacity={0.7}
      >
        {/* Photo */}
        <View style={styles.photoContainer}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="person" size={32} color="#CCC" />
            </View>
          )}
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.matchInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.matchName, isDark && styles.textDark]} numberOfLines={1}>
              {user?.username || 'Utilisateur'}
            </Text>
            {user?.age && (
              <Text style={[styles.matchAge, isDark && styles.textMutedDark]}>, {user.age}</Text>
            )}
          </View>

          {user?.location?.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={isDark ? '#888' : '#666'} />
              <Text style={[styles.locationText, isDark && styles.textMutedDark]} numberOfLines={1}>
                {user.location.city}
                {item.distance > 0 && ` • ${item.distance} km`}
              </Text>
            </View>
          )}

          <View style={styles.tagsRow}>
            <View style={[styles.levelTag, { backgroundColor: `${fitnessLevel.color}20` }]}>
              <Text style={[styles.levelTagText, { color: fitnessLevel.color }]}>
                {fitnessLevel.label}
              </Text>
            </View>
            {item.matchScore && (
              <View style={styles.scoreTag}>
                <Ionicons name="heart" size={12} color="#EF4444" />
                <Text style={styles.scoreTagText}>{item.matchScore}%</Text>
              </View>
            )}
          </View>

          {user?.workoutTypes?.length > 0 && (
            <Text style={[styles.workoutTypesText, isDark && styles.textMutedDark]} numberOfLines={1}>
              {user.workoutTypes.slice(0, 3).join(' • ')}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleMatchPress(item)}
          >
            <Ionicons name="chatbubble" size={20} color="#FFF" />
          </TouchableOpacity>
          {matchDate && (
            <Text style={[styles.matchDate, isDark && styles.textMutedDark]}>{matchDate}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, isDark && styles.emptyIconDark]}>
        <Ionicons name="heart-outline" size={64} color={isDark ? '#555' : '#CCC'} />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.textDark]}>Pas encore de matchs</Text>
      <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
        Continue a swiper pour trouver des partenaires de sport !
      </Text>
      <TouchableOpacity
        style={styles.discoverButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="people" size={20} color="#FFF" />
        <Text style={styles.discoverButtonText}>Decouvrir des profils</Text>
      </TouchableOpacity>
    </View>
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
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.textDark]}>Mes matchs</Text>
        <View style={styles.matchCount}>
          <Text style={styles.matchCountText}>{matches.length}</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={matches}
        keyExtractor={(item) => item._id}
        renderItem={renderMatch}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={selectedProfile}
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
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#888',
  },
  matchCount: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchCountText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  matchCardDark: {
    backgroundColor: '#2A2A2A',
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  photoPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 2,
  },
  matchInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  matchName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  matchAge: {
    fontSize: 15,
    color: theme.colors.text.secondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  levelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  scoreTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  workoutTypesText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 6,
    textTransform: 'capitalize',
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchDate: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconDark: {
    backgroundColor: '#333',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  discoverButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
