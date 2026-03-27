import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '../../theme';
import social from '../../api/social';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDuration = (sec) => {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const getInitials = (prenom, pseudo) => (prenom || pseudo || '?').charAt(0).toUpperCase();

// ─── Mini workout card ────────────────────────────────────────────────────────

function MiniWorkoutCard({ session, isDark }) {
  const muscles = session.entries
    ?.flatMap(e => e.muscles?.length ? e.muscles : e.muscle ? [e.muscle] : [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3) || [];

  return (
    <View style={[styles.miniCard, isDark && styles.miniCardDark]}>
      <Text style={[styles.miniCardName, isDark && styles.textLight]} numberOfLines={1}>
        {session.name || 'Séance'}
      </Text>
      <View style={styles.miniCardStats}>
        <View style={styles.miniStat}>
          <Ionicons name="time-outline" size={12} color={theme.colors.primary} />
          <Text style={[styles.miniStatText, isDark && styles.textMuted]}>
            {formatDuration(session.durationSec)}
          </Text>
        </View>
        {session.calories > 0 && (
          <View style={styles.miniStat}>
            <Ionicons name="flame-outline" size={12} color="#EF4444" />
            <Text style={[styles.miniStatText, isDark && styles.textMuted]}>{session.calories} kcal</Text>
          </View>
        )}
      </View>
      {muscles.length > 0 && (
        <View style={styles.miniMuscles}>
          {muscles.map((m, i) => (
            <View key={i} style={[styles.miniMuscleTag, isDark && styles.miniMuscleTagDark]}>
              <Text style={[styles.miniMuscleText, isDark && styles.textMuted]}>{m}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={[styles.miniCardDate, isDark && styles.textMuted]}>{formatDate(session.endedAt)}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UserPublicProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;
  const { user: me } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await social.getUserProfile(userId);
      setData(res.data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger ce profil');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleFollow = async () => {
    if (!data) return;
    setFollowLoading(true);
    const was = data.isFollowing;
    setData(prev => ({
      ...prev,
      isFollowing: !was,
      followersCount: was ? prev.followersCount - 1 : prev.followersCount + 1,
    }));
    try {
      if (was) await social.unfollow(userId);
      else await social.follow(userId);
    } catch {
      setData(prev => ({
        ...prev,
        isFollowing: was,
        followersCount: was ? prev.followersCount + 1 : prev.followersCount - 1,
      }));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleChallenge = () => {
    if (!data) return;
    // Navigate to challenge creation with pre-filled opponent
    navigation.navigate('HomeTab', {
      screen: 'Notifications',
    });
    // TODO: navigate to challenge creation screen with userId
  };

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  const { user, followersCount, followingCount, isFollowing, isMe, sessionsCount, recentSessions } = data;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#111'} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, isDark && styles.textLight]} numberOfLines={1}>
            {user.pseudo ? `@${user.pseudo}` : user.prenom || 'Profil'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.profileCard, isDark && styles.cardDark]}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarPlaceholderText}>{getInitials(user.prenom, user.pseudo)}</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={[styles.displayName, isDark && styles.textLight]}>
            {user.prenom || user.pseudo || 'Utilisateur'}
          </Text>
          {user.pseudo ? (
            <Text style={[styles.pseudo, isDark && styles.textMuted]}>@{user.pseudo}</Text>
          ) : null}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{sessionsCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Entraînements</Text>
            </View>
            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{followersCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Abonnés</Text>
            </View>
            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{followingCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Abonnements</Text>
            </View>
          </View>

          {/* Action buttons */}
          {!isMe && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
                disabled={followLoading}
                activeOpacity={0.8}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? '#666' : '#FFF'} />
                ) : (
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Suivi ✓' : 'Suivre'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.challengeButton, isDark && styles.challengeButtonDark]}
                onPress={handleChallenge}
                activeOpacity={0.8}
              >
                <Ionicons name="trophy-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.challengeButtonText}>Défier</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent sessions */}
        {recentSessions?.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Séances récentes</Text>
            {recentSessions.map(session => (
              <MiniWorkoutCard key={session._id} session={session} isDark={isDark} />
            ))}
          </>
        )}

        {recentSessions?.length === 0 && (
          <View style={styles.noSessionsContainer}>
            <Ionicons name="barbell-outline" size={40} color={isDark ? '#333' : '#DDD'} />
            <Text style={[styles.noSessionsText, isDark && styles.textMuted]}>
              Aucune séance publique
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  containerDark: { backgroundColor: '#12151A' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  textLight: { color: '#FFF' },
  textMuted: { color: '#8A8E96' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 60 },

  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDark: { backgroundColor: '#1A1D24' },

  avatarSection: { marginBottom: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: { fontSize: 36, fontWeight: '700', color: '#FFF' },

  displayName: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  pseudo: { fontSize: 15, color: '#999', marginBottom: 20 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
    marginBottom: 20,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
  statDividerDark: { backgroundColor: '#2A2E36' },

  // Buttons
  actionRow: { flexDirection: 'row', gap: 10, width: '100%' },
  followButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  followingButton: {
    backgroundColor: '#F0F0F0',
  },
  followButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  followingButtonText: { color: '#555' },
  challengeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: `${theme.colors.primary}18`,
  },
  challengeButtonDark: { backgroundColor: `${theme.colors.primary}25` },
  challengeButtonText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },

  // Mini card
  miniCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  miniCardDark: { backgroundColor: '#1A1D24' },
  miniCardName: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 8 },
  miniCardStats: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatText: { fontSize: 13, color: '#666' },
  miniMuscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  miniMuscleTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  miniMuscleTagDark: { backgroundColor: '#2A2E36' },
  miniMuscleText: { fontSize: 12, color: '#666' },
  miniCardDate: { fontSize: 12, color: '#AAA' },

  noSessionsContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noSessionsText: { fontSize: 14, color: '#AAA' },
});
