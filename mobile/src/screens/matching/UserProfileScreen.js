import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme, colors } from '../../theme';
import { getUserProfile } from '../../api/matching';

const FITNESS_LEVELS = {
  beginner: { label: 'Debutant', color: colors.success, gradient: [colors.success, '#3D9140'] },
  intermediate: { label: 'Intermediaire', color: colors.warning, gradient: [colors.warning, '#E0A800'] },
  advanced: { label: 'Avance', color: colors.accent, gradient: [colors.accent, '#E55A5A'] },
};

const WORKOUT_TYPE_ICONS = {
  'muscu': 'barbell',
  'musculation': 'barbell',
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

export default function UserProfileScreen({ route, navigation }) {
  const { userId, user: userParam } = route.params || {};
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const targetUserId = userId || userParam?._id;

      // Toujours charger le profil complet via l'API si on a un ID
      if (targetUserId) {
        try {
          setLoading(true);
          setError(null);
          const response = await getUserProfile(targetUserId);

          // L'API renvoie { profile: {...}, user: { pseudo, email } }
          const profileData = response?.profile || {};
          const userData = response?.user || {};

          // Fusionner les donnees de base avec le profil complet
          setUser({
            ...userParam,
            // Donnees de l'utilisateur (pseudo, email)
            pseudo: userData.pseudo || userParam?.pseudo,
            username: userData.pseudo || userParam?.username || userParam?.pseudo,
            email: userData.email,
            // Donnees du profil
            bio: profileData.bio,
            workoutTypes: profileData.workoutTypes || [],
            stats: profileData.stats,
            fitnessLevel: profileData.fitnessLevel,
            location: profileData.location,
            photo: profileData.profilePicture || userParam?.photo,
            age: profileData.age,
            isVerified: profileData.isVerified,
            _id: targetUserId,
          });
        } catch (err) {
          console.log('Error loading profile:', err);
          // Fallback sur les donnees de base si l'API echoue
          if (userParam) {
            setUser(userParam);
          } else {
            setError('Erreur lors du chargement du profil');
          }
        } finally {
          setLoading(false);
        }
      } else if (userParam) {
        // Pas d'ID mais on a les donnees de base
        setUser(userParam);
        setLoading(false);
      } else {
        setError('Aucun utilisateur specifie');
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, userParam]);

  const fitnessLevel = FITNESS_LEVELS[user?.fitnessLevel] || FITNESS_LEVELS.intermediate;

  const handleMessage = () => {
    navigation.navigate('ChatDetail', {
      otherUser: user,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, isDark && styles.textMuted]}>
            Chargement du profil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.textDark]}>Profil</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={isDark ? '#666' : '#CCC'} />
          <Text style={[styles.errorText, isDark && styles.textMuted]}>
            {error || 'Profil non disponible'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Normaliser les donnees utilisateur (peut venir de differentes sources)
  const username = user.username || user.pseudo || user.prenom || 'Utilisateur';
  const photo = user.photo || user.profile?.profilePicture;
  const age = user.age;
  const city = user.location?.city || user.city;
  const bio = user.bio || user.profile?.bio;
  const workoutTypes = user.workoutTypes || user.profile?.workoutTypes || [];
  const stats = user.stats || user.profile?.stats;
  const isVerified = user.isVerified || user.profile?.isVerified;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.textDark]}>Profil</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={styles.photoLarge}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photoImage} />
          ) : (
            <View style={[styles.photoImage, styles.photoPlaceholder, isDark && styles.photoPlaceholderDark]}>
              <Ionicons name="person" size={120} color={isDark ? '#555' : '#CCC'} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.photoGradient}
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, isDark && styles.textDark]}>
              {username}
            </Text>
            {age && (
              <Text style={[styles.age, isDark && styles.textMutedDark]}>, {age} ans</Text>
            )}
            {isVerified && (
              <Ionicons name="checkmark-circle" size={24} color={colors.info} style={{ marginLeft: 8 }} />
            )}
          </View>

          {city && (
            <View style={styles.location}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={[styles.locationText, isDark && styles.textMutedDark]}>
                {city}
              </Text>
            </View>
          )}

          {/* Level */}
          <LinearGradient
            colors={fitnessLevel.gradient}
            style={styles.levelBadge}
          >
            <Ionicons name="fitness" size={16} color="#FFF" />
            <Text style={styles.levelText}>Niveau {fitnessLevel.label}</Text>
          </LinearGradient>

          {/* Bio */}
          {bio && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>A propos</Text>
              <Text style={[styles.bio, isDark && styles.textMutedDark]}>{bio}</Text>
            </View>
          )}

          {/* Workout types */}
          {workoutTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Sports pratiques</Text>
              <View style={styles.workoutTypes}>
                {workoutTypes.map((type, i) => (
                  <View key={i} style={[styles.workoutChip, isDark && styles.workoutChipDark]}>
                    <Ionicons
                      name={WORKOUT_TYPE_ICONS[type] || 'fitness'}
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={[styles.workoutChipText, isDark && styles.textDark]}>
                      {type}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats */}
          {stats && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Statistiques</Text>
              <View style={styles.stats}>
                <View style={[styles.statItem, isDark && styles.statItemDark]}>
                  <Text style={[styles.statValue, isDark && styles.textDark]}>
                    {stats.totalWorkouts || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>Seances</Text>
                </View>
                <View style={[styles.statItem, isDark && styles.statItemDark]}>
                  <Text style={[styles.statValue, isDark && styles.textDark]}>
                    {stats.currentStreak || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>Streak</Text>
                </View>
                <View style={[styles.statItem, isDark && styles.statItemDark]}>
                  <Text style={[styles.statValue, isDark && styles.textDark]}>
                    {stats.totalXP || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>XP</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action button */}
      <View style={[styles.actions, isDark && styles.actionsDark]}>
        <TouchableOpacity
          style={styles.messageButtonWrapper}
          onPress={handleMessage}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.messageButton}
          >
            <Ionicons name="chatbubble" size={22} color="#FFF" />
            <Text style={styles.messageButtonText}>Envoyer un message</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerDark: {
    borderBottomColor: colors.dark.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textMuted: {
    color: colors.light.textSecondary,
  },
  textMutedDark: {
    color: '#888',
  },
  scroll: {
    flex: 1,
  },
  photoLarge: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderDark: {
    backgroundColor: colors.dark.backgroundTertiary,
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  info: {
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.light.text,
  },
  age: {
    fontSize: 24,
    color: colors.light.textSecondary,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    color: colors.light.textSecondary,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 10,
  },
  bio: {
    fontSize: 15,
    color: colors.light.textSecondary,
    lineHeight: 22,
  },
  workoutTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  workoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  workoutChipDark: {
    backgroundColor: `${colors.primary}30`,
  },
  workoutChipText: {
    fontSize: 14,
    color: colors.light.text,
    textTransform: 'capitalize',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statItemDark: {
    backgroundColor: colors.dark.backgroundSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.light.textSecondary,
    marginTop: 4,
  },
  actions: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  actionsDark: {
    borderTopColor: colors.dark.border,
  },
  messageButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  messageButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
