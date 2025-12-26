import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';

const FITNESS_LEVELS = {
  beginner: { label: 'Debutant', color: '#22C55E' },
  intermediate: { label: 'Intermediaire', color: '#F59E0B' },
  advanced: { label: 'Avance', color: '#EF4444' },
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

export default function ProfileModal({
  visible,
  onClose,
  profile,
  onSwipeLeft,
  onSwipeRight
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  if (!profile) return null;

  const user = profile.user;
  const fitnessLevel = FITNESS_LEVELS[user?.fitnessLevel] || FITNESS_LEVELS.intermediate;
  const isMutualMatch = profile.isMutualMatch;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.textDark]}>Profil</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scroll}>
          {/* Photo */}
          <View style={styles.photoLarge}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.photoImage} />
            ) : (
              <View style={[styles.photoImage, styles.photoPlaceholder]}>
                <Ionicons name="person" size={120} color="#CCC" />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, isDark && styles.textDark]}>
                {user?.username}
              </Text>
              {user?.age && (
                <Text style={[styles.age, isDark && styles.textMutedDark]}>, {user.age} ans</Text>
              )}
              {user?.isVerified && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" style={{ marginLeft: 8 }} />
              )}
            </View>

            {user?.location?.city && (
              <View style={styles.location}>
                <Ionicons name="location" size={18} color={theme.colors.primary} />
                <Text style={[styles.locationText, isDark && styles.textMutedDark]}>
                  {user.location.neighborhood ? `${user.location.neighborhood}, ` : ''}{user.location.city}
                  {profile.distance > 0 && ` • ${profile.distance} km`}
                </Text>
              </View>
            )}

            {/* Match score */}
            {profile.matchScore && (
              <View style={styles.matchScore}>
                <View style={styles.matchScoreBar}>
                  <View style={[styles.matchScoreFill, { width: `${profile.matchScore}%` }]} />
                </View>
                <Text style={[styles.matchScoreText, isDark && styles.textDark]}>
                  {profile.matchScore}% compatible
                </Text>
              </View>
            )}

            {/* Level */}
            <View style={[styles.levelBadge, { backgroundColor: `${fitnessLevel.color}20` }]}>
              <Ionicons name="fitness" size={18} color={fitnessLevel.color} />
              <Text style={[styles.levelText, { color: fitnessLevel.color }]}>
                Niveau {fitnessLevel.label}
              </Text>
            </View>

            {/* Bio */}
            {user?.bio && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>A propos</Text>
                <Text style={[styles.bio, isDark && styles.textMutedDark]}>{user.bio}</Text>
              </View>
            )}

            {/* Workout types */}
            {user?.workoutTypes?.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Sports pratiques</Text>
                <View style={styles.workoutTypes}>
                  {user.workoutTypes.map((type, i) => (
                    <View key={i} style={[styles.workoutChip, isDark && styles.workoutChipDark]}>
                      <Ionicons
                        name={WORKOUT_TYPE_ICONS[type] || 'fitness'}
                        size={16}
                        color={theme.colors.primary}
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
            {user?.stats && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Statistiques</Text>
                <View style={styles.stats}>
                  <View style={[styles.statItem, isDark && styles.statItemDark]}>
                    <Text style={[styles.statValue, isDark && styles.textDark]}>
                      {user.stats.totalWorkouts || 0}
                    </Text>
                    <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>Seances</Text>
                  </View>
                  <View style={[styles.statItem, isDark && styles.statItemDark]}>
                    <Text style={[styles.statValue, isDark && styles.textDark]}>
                      {user.stats.currentStreak || 0}
                    </Text>
                    <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>Streak</Text>
                  </View>
                  <View style={[styles.statItem, isDark && styles.statItemDark]}>
                    <Text style={[styles.statValue, isDark && styles.textDark]}>
                      {user.stats.totalXP || 0}
                    </Text>
                    <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>XP</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action buttons */}
        <View style={[styles.actions, isDark && styles.actionsDark]}>
          {isMutualMatch ? (
            // Pour les matches mutuels, afficher un bouton de chat
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                onClose();
                navigation.navigate('Chat', {
                  screen: 'ChatConversation',
                  params: { matchId: profile.matchId, user: profile.user }
                });
              }}
            >
              <Ionicons name="chatbubble" size={22} color="#FFF" />
              <Text style={styles.chatButtonText}>Envoyer un message</Text>
            </TouchableOpacity>
          ) : (
            // Pour les suggestions, afficher les boutons like/reject
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => {
                  onClose();
                  onSwipeLeft?.();
                }}
              >
                <Ionicons name="close" size={28} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.likeButton]}
                onPress={() => {
                  onClose();
                  onSwipeRight?.();
                }}
              >
                <Ionicons name="heart" size={28} color="#FFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  textDark: {
    color: '#FFFFFF',
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
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: theme.colors.text.primary,
  },
  age: {
    fontSize: 24,
    color: theme.colors.text.secondary,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
  },
  matchScore: {
    marginTop: 20,
    marginBottom: 16,
  },
  matchScoreBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  matchScoreFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  bio: {
    fontSize: 15,
    color: theme.colors.text.secondary,
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
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  workoutChipDark: {
    backgroundColor: '#333',
  },
  workoutChipText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statItemDark: {
    backgroundColor: '#333',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionsDark: {
    borderTopColor: '#333',
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
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
