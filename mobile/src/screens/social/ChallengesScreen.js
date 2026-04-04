import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, useColorScheme, Alert, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { useAuth } from '../../contexts/AuthContext';

// ─── Constants ───────────────────────────────────────────────────────────────

const LEAGUE_INFO = {
  starter:  { name: 'Starter',  ionicon: 'flash-outline',    color: '#a8a29e', min: 0,    max: 99 },
  bronze:   { name: 'Bronze',   ionicon: 'medal-outline',    color: '#b5956a', min: 100,  max: 499 },
  silver:   { name: 'Argent',   ionicon: 'shield-outline',   color: '#a8a29e', min: 500,  max: 999 },
  gold:     { name: 'Or',       ionicon: 'star-outline',     color: '#d4a96a', min: 1000, max: 1499 },
  diamond:  { name: 'Diamant',  ionicon: 'diamond-outline',  color: '#72baa1', min: 1500, max: 1999 },
  champion: { name: 'Champion', ionicon: 'trophy',           color: '#f0a47a', min: 2000, max: Infinity },
};

const PERIODS = [
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'alltime', label: 'Total' },
];

const CATEGORIES = [
  { key: 'all', label: 'Tout' },
  { key: 'muscu', label: 'Muscu' },
  { key: 'cardio', label: 'Cardio' },
];

const STATUS_CONFIG = {
  pending:   { label: 'En attente', color: '#d4a96a', bg: 'rgba(212,169,106,0.12)' },
  active:    { label: 'En cours',   color: '#72baa1', bg: 'rgba(114,186,161,0.12)' },
  completed: { label: 'Terminé',     color: '#78716c', bg: '#f5f5f4' },
  declined:  { label: 'Refusé',      color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};

const CHALLENGE_LABELS = {
  sessions: 'Séances', streak: 'Streak', calories: 'Calories', duration: 'Minutes',
  max_pushups: 'Max Pompes', max_pullups: 'Max Tractions',
  max_bench: 'Développé Couché', max_squat: 'Squat Max',
  max_deadlift: 'Soulevé de Terre', max_burpees: 'Max Burpees',
};

const CHALLENGE_IONICONS = {
  sessions: 'calendar-outline', streak: 'flame-outline', calories: 'thermometer-outline', duration: 'timer-outline',
  max_pushups: 'fitness-outline', max_pullups: 'arrow-up-outline', max_bench: 'barbell-outline',
  max_squat: 'body-outline', max_deadlift: 'flash-outline', max_burpees: 'flame-outline',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

function getLeagueForXP(xp) {
  if (xp >= 2000) return 'champion';
  if (xp >= 1500) return 'diamond';
  if (xp >= 1000) return 'gold';
  if (xp >= 500) return 'silver';
  if (xp >= 100) return 'bronze';
  return 'starter';
}

function getProgressToNextLeague(xp) {
  const currentLeague = getLeagueForXP(xp);
  const info = LEAGUE_INFO[currentLeague];
  if (currentLeague === 'champion') return { percentage: 100, nextLeague: null, remaining: 0, target: xp };
  const leagues = ['starter', 'bronze', 'silver', 'gold', 'diamond', 'champion'];
  const nextLeague = leagues[leagues.indexOf(currentLeague) + 1];
  const target = LEAGUE_INFO[nextLeague].min;
  const percentage = Math.round(((xp - info.min) / (target - info.min)) * 100);
  return { percentage: Math.min(percentage, 100), nextLeague, remaining: target - xp, target };
}

function getStatValue(entry, category, period) {
  if (!entry?.stats) return 0;
  const s = entry.stats;
  if (category === 'muscu') {
    if (period === 'week') return s.muscuThisWeekSessions || 0;
    if (period === 'month') return s.muscuThisMonthSessions || 0;
    return s.muscuSessions || 0;
  }
  if (category === 'cardio') {
    if (period === 'week') return s.cardioThisWeekSessions || 0;
    if (period === 'month') return s.cardioThisMonthSessions || 0;
    return s.cardioSessions || 0;
  }
  if (period === 'week') return s.thisWeekSessions || 0;
  if (period === 'month') return s.thisMonthSessions || 0;
  return s.totalSessions || 0;
}

// ─── Podium Item ─────────────────────────────────────────────────────────────

function PodiumItem({ entry, rank, isDark, category, period, onChallenge }) {
  const isGold = rank === 1;
  const medalColor = { 1: '#d4a96a', 2: '#a8a29e', 3: '#b5956a' }[rank];
  const league = entry.league ? LEAGUE_INFO[entry.league] : null;
  const sessions = getStatValue(entry, category, period);
  const initial = (entry.displayName || '?').charAt(0).toUpperCase();

  return (
    <View style={[s.podiumItem, isDark && s.podiumItemDark, isGold && s.podiumItemGold]}>
      {/* Medal */}
      <View style={[s.podiumMedal, { backgroundColor: medalColor }]}>
        <Text style={s.podiumRankText}>{rank}</Text>
      </View>

      {/* Avatar */}
      <View style={[s.podiumAvatarWrap, isDark && s.podiumAvatarWrapDark]}>
        {entry.avatarUrl ? (
          <Image source={{ uri: entry.avatarUrl }} style={s.podiumAvatar} />
        ) : (
          <View style={[s.podiumAvatarPlaceholder, { backgroundColor: medalColor }]}>
            <Text style={s.podiumAvatarLetter}>{initial}</Text>
          </View>
        )}
      </View>

      {/* Name + League */}
      <Text style={[s.podiumName, isDark && s.textLight]} numberOfLines={1}>{entry.displayName}</Text>
      {league && (
        <View style={s.podiumLeagueRow}>
          <Ionicons name={league.ionicon} size={12} color={league.color} />
          <Text style={[s.podiumLeague, { color: league.color }]}>{league.name}</Text>
        </View>
      )}

      {/* Stats */}
      <Text style={[s.podiumSessions, isDark && s.textLight]}>{sessions}</Text>
      <Text style={[s.podiumSessionsLabel, isDark && s.textMuted]}>séances</Text>

      {/* Streak */}
      {entry.stats?.currentStreak > 0 && (
        <View style={[s.streakBadge, isDark && s.streakBadgeDark]}>
          <Text style={s.streakText}>{entry.stats.currentStreak}j</Text>
        </View>
      )}

      {/* Podium bar */}
      <View style={[s.podiumBar, isGold && s.podiumBarGold, { backgroundColor: medalColor }]} />

      {/* Challenge button */}
      {onChallenge && (
        <TouchableOpacity style={[s.podiumChallengeBtn, isDark && s.podiumChallengeBtnDark]} onPress={() => onChallenge(entry)} activeOpacity={0.7}>
          <Ionicons name="flash" size={14} color="#72baa1" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── League Progress Card ────────────────────────────────────────────────────

function LeagueCard({ league, xp, challengeStats, isDark }) {
  const info = LEAGUE_INFO[league] || LEAGUE_INFO.starter;
  const progress = getProgressToNextLeague(xp);
  const nextInfo = progress.nextLeague ? LEAGUE_INFO[progress.nextLeague] : null;

  return (
    <View style={[s.leagueCard, isDark && s.leagueCardDark]}>
      <View style={s.leagueCardInner}>
        {/* Header */}
        <View style={s.leagueHeader}>
          <View style={[s.leagueIconWrap, { backgroundColor: `${info.color}20` }]}>
            <Ionicons name={info.ionicon} size={24} color={info.color} />
          </View>
          <View style={s.leagueHeaderText}>
            <Text style={[s.leagueLabel, isDark && s.textMuted]}>Ta ligue</Text>
            <Text style={[s.leagueName, { color: info.color }]}>{info.name}</Text>
          </View>
          <View style={[s.xpBadge, { backgroundColor: 'rgba(114,186,161,0.12)' }]}>
            <Text style={s.xpBadgeText}>{xp} XP</Text>
          </View>
        </View>

        {/* Progress bar */}
        {nextInfo && (
          <View style={s.progressSection}>
            <View style={[s.progressTrack, isDark && s.progressTrackDark]}>
              <View style={[s.progressFill, { width: `${progress.percentage}%` }]} />
            </View>
            <View style={s.progressLabels}>
              <Text style={[s.progressText, isDark && s.textMuted]}>{xp} / {progress.target} XP</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={nextInfo.ionicon} size={12} color={nextInfo.color} />
                <Text style={[s.progressNext, { color: nextInfo.color }]}>{nextInfo.name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Challenge stats */}
        {challengeStats && (
          <View style={[s.leagueStatsRow, isDark && s.leagueStatsRowDark]}>
            <View style={s.leagueStatCell}>
              <Text style={[s.leagueStatValue, isDark && s.textLight]}>{challengeStats.wins || 0}</Text>
              <Text style={[s.leagueStatLabel, isDark && s.textMuted]}>Victoires</Text>
            </View>
            <View style={[s.leagueStatDivider, isDark && s.leagueStatDividerDark]} />
            <View style={s.leagueStatCell}>
              <Text style={[s.leagueStatValue, isDark && s.textLight]}>{challengeStats.losses || 0}</Text>
              <Text style={[s.leagueStatLabel, isDark && s.textMuted]}>Défaites</Text>
            </View>
            <View style={[s.leagueStatDivider, isDark && s.leagueStatDividerDark]} />
            <View style={s.leagueStatCell}>
              <Text style={[s.leagueStatValue, isDark && s.textLight]}>
                {challengeStats.wins > 0
                  ? `${Math.round((challengeStats.wins / (challengeStats.wins + challengeStats.losses + challengeStats.draws)) * 100)}%`
                  : '\u2014'}
              </Text>
              <Text style={[s.leagueStatLabel, isDark && s.textMuted]}>Win Rate</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Challenge Card ──────────────────────────────────────────────────────────

function ChallengeCard({ challenge, myId, isDark, onAccept, onDecline, onCancel }) {
  const isChallenger = challenge.challengerId?._id === myId || challenge.challengerId === myId;
  const opponent = isChallenger ? challenge.challengedId : challenge.challengerId;
  const opponentName = opponent?.prenom || opponent?.pseudo || '?';
  const status = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.pending;
  const label = CHALLENGE_LABELS[challenge.type] || challenge.type;
  const iconName = CHALLENGE_IONICONS[challenge.type] || 'flash-outline';

  const myScore = isChallenger ? challenge.challengerScore : challenge.challengedScore;
  const opponentScore = isChallenger ? challenge.challengedScore : challenge.challengerScore;
  const isWinner = challenge.winnerId === myId;

  // Progress for active challenges
  const totalScore = (myScore || 0) + (opponentScore || 0);
  const myPercent = totalScore > 0 ? Math.round((myScore / totalScore) * 100) : 0;

  return (
    <View style={[s.card, isDark && s.cardDark]}>
      <View style={s.cardInner}>
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={[s.challengeIconWrap, isDark && s.challengeIconWrapDark]}>
            <Ionicons name={iconName} size={22} color="#72baa1" />
          </View>
          <View style={s.cardHeaderText}>
            <Text style={[s.challengeTitle, isDark && s.textLight]} numberOfLines={1}>{label}</Text>
            <Text style={[s.opponentName, isDark && s.textMuted]}>vs {opponentName}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: isDark ? `${status.color}1A` : status.bg }]}>
            <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Dates */}
        <Text style={[s.dateRange, isDark && s.textTertiary]}>
          {formatDate(challenge.startDate)} \u2192 {formatDate(challenge.endDate)}
        </Text>

        {/* Progress bar for active */}
        {challenge.status === 'active' && (
          <View style={s.challengeProgressWrap}>
            <View style={[s.challengeProgressTrack, isDark && s.challengeProgressTrackDark]}>
              <View style={[s.challengeProgressFill, { width: `${myPercent}%`, backgroundColor: '#72baa1' }]} />
            </View>
            <View style={s.challengeProgressLabels}>
              <Text style={[s.challengeProgressScore, isDark && s.textLight]}>{myScore ?? 0}</Text>
              <Text style={[s.challengeProgressScore, isDark && s.textLight]}>{opponentScore ?? 0}</Text>
            </View>
          </View>
        )}

        {/* Score row for completed */}
        {challenge.status === 'completed' && (
          <View style={[s.scoreRow, isDark && s.scoreRowDark]}>
            <View style={s.scoreCell}>
              <Text style={[s.scoreLabel, isDark && s.textMuted]}>Moi</Text>
              <Text style={[s.scoreValue, isDark && s.textLight]}>{myScore ?? '\u2014'}</Text>
            </View>
            <View style={[s.scoreDivider, isDark && s.scoreDividerDark]} />
            <View style={s.scoreCell}>
              <Text style={[s.scoreLabel, isDark && s.textMuted]}>{opponentName}</Text>
              <Text style={[s.scoreValue, isDark && s.textLight]}>{opponentScore ?? '\u2014'}</Text>
            </View>
          </View>
        )}

        {/* Result */}
        {challenge.status === 'completed' && (
          <Text style={[s.resultText, { color: isWinner ? '#72baa1' : '#ef4444' }]}>
            {challenge.winnerId
              ? (isWinner ? 'Victoire !' : 'Défaite')
              : 'Égalité'}
          </Text>
        )}

        {challenge.rewardXp > 0 && challenge.status === 'completed' && isWinner && (
          <Text style={s.xpRewardText}>+{challenge.rewardXp} XP remportés</Text>
        )}

        {/* Actions */}
        {challenge.status === 'pending' && !isChallenger && (
          <View style={s.actionRow}>
            <TouchableOpacity style={[s.actionBtn, s.acceptBtn]} onPress={() => onAccept(challenge._id)} activeOpacity={0.8}>
              <Text style={s.acceptText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, s.declineBtn, isDark && s.declineBtnDark]} onPress={() => onDecline(challenge._id)} activeOpacity={0.8}>
              <Text style={[s.declineText, isDark && s.declineTextDark]}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}

        {challenge.status === 'pending' && isChallenger && (
          <TouchableOpacity style={[s.actionBtn, s.cancelBtn, isDark && s.cancelBtnDark]} onPress={() => onCancel(challenge._id)} activeOpacity={0.8}>
            <Text style={[s.cancelText, isDark && s.cancelTextDark]}>Annuler le défi</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Leaderboard Row ─────────────────────────────────────────────────────────

function LeaderboardRow({ entry, isDark, category, period, onChallenge }) {
  const league = entry.league ? LEAGUE_INFO[entry.league] : null;
  const sessions = getStatValue(entry, category, period);
  const initial = (entry.displayName || '?').charAt(0).toUpperCase();

  return (
    <View style={[s.lbRow, isDark && s.lbRowDark]}>
      <Text style={[s.lbRank, isDark && s.textMuted]}>#{entry.rank}</Text>
      <View style={[s.lbAvatar, isDark && s.lbAvatarDark]}>
        {entry.avatarUrl
          ? <Image source={{ uri: entry.avatarUrl }} style={s.lbAvatarImg} />
          : <Text style={s.lbAvatarLetter}>{initial}</Text>
        }
      </View>
      <View style={s.lbInfo}>
        <View style={s.lbNameRow}>
          <Text style={[s.lbName, isDark && s.textLight]} numberOfLines={1}>{entry.displayName}</Text>
          {league && <Ionicons name={league.ionicon} size={14} color={league.color} />}
        </View>
        {entry.stats?.currentStreak > 0 && (
          <Text style={s.lbStreak}>{entry.stats.currentStreak}j streak</Text>
        )}
      </View>
      <View style={s.lbStats}>
        <Text style={[s.lbStatsValue, isDark && s.textLight]}>{sessions}</Text>
        <Text style={[s.lbStatsLabel, isDark && s.textMuted]}>séances</Text>
      </View>
      {onChallenge && (
        <TouchableOpacity style={[s.lbChallengeBtn, isDark && s.lbChallengeBtnDark]} onPress={() => onChallenge(entry)} activeOpacity={0.7}>
          <Ionicons name="flash" size={14} color="#72baa1" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();
  const { user: me } = useAuth();
  const currentUserId = me?._id;

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('alltime');
  const [category, setCategory] = useState('all');
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [userEntry, setUserEntry] = useState(null);
  const [userRank, setUserRank] = useState(null);

  // Challenges state
  const [challenges, setChallenges] = useState({ active: [], pending: [], completed: [] });

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);

  // Active tab for challenges section
  const [challengeTab, setChallengeTab] = useState('active');

  const loadAll = useCallback(async () => {
    try {
      const [lbRes, statusRes, challengeRes, statsRes] = await Promise.allSettled([
        apiClient.get(`${endpoints.leaderboard.list}?period=${period}&type=${category}&limit=50`),
        apiClient.get(endpoints.leaderboard.status),
        apiClient.get(endpoints.challenges.list),
        apiClient.get(endpoints.challenges.stats),
      ]);

      // Leaderboard
      if (lbRes.status === 'fulfilled' && lbRes.value.data?.success) {
        setLeaderboard(lbRes.value.data.data || []);
      }

      // Opt-in status
      if (statusRes.status === 'fulfilled' && statusRes.value.data?.success) {
        setIsOptedIn(statusRes.value.data.isOptedIn);
        if (statusRes.value.data.isOptedIn && statusRes.value.data.data) {
          setUserEntry(statusRes.value.data.data);
          // Fetch rank
          try {
            const rankRes = await apiClient.get(
              `${endpoints.leaderboard.userRank(statusRes.value.data.data.userId)}?period=${period}&type=${category}`
            );
            if (rankRes.data?.success) setUserRank(rankRes.data.rank);
          } catch {}
        }
      }

      // Challenges
      if (challengeRes.status === 'fulfilled') {
        const data = challengeRes.value.data;
        const cData = data?.data || data;
        setChallenges({
          active: cData?.active || [],
          pending: cData?.pending || [],
          completed: cData?.completed || [],
        });
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, category]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  // Opt-in / opt-out
  const handleOptIn = async () => {
    setOptInLoading(true);
    try {
      await apiClient.post(endpoints.leaderboard.optIn);
      setIsOptedIn(true);
      loadAll();
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de rejoindre le classement');
    } finally {
      setOptInLoading(false);
    }
  };

  const handleOptOut = () => {
    Alert.alert('Quitter le classement', 'Ton profil ne sera plus visible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Quitter', style: 'destructive', onPress: async () => {
        setOptInLoading(true);
        try {
          await apiClient.post(endpoints.leaderboard.optOut);
          setIsOptedIn(false);
          setUserEntry(null);
          setUserRank(null);
          loadAll();
        } catch {} finally { setOptInLoading(false); }
      }},
    ]);
  };

  const handleRefreshProfile = async () => {
    try {
      await apiClient.post(endpoints.leaderboard.refreshProfile);
      loadAll();
    } catch {}
  };

  // Challenge actions
  const handleAccept = async (id) => {
    try { await apiClient.post(endpoints.challenges.accept(id)); loadAll(); }
    catch (err) { Alert.alert('Erreur', err?.response?.data?.message || 'Impossible d\'accepter'); }
  };

  const handleDecline = (id) => {
    Alert.alert('Refuser le défi', 'Confirmer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: async () => {
        try { await apiClient.post(endpoints.challenges.decline(id)); loadAll(); }
        catch { Alert.alert('Erreur', 'Impossible de refuser'); }
      }},
    ]);
  };

  const handleCancel = (id) => {
    Alert.alert('Annuler le défi', 'Confirmer ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Annuler le défi', style: 'destructive', onPress: async () => {
        try { await apiClient.post(endpoints.challenges.cancel(id)); loadAll(); }
        catch { Alert.alert('Erreur', 'Impossible d\'annuler'); }
      }},
    ]);
  };

  const handleChallengeUser = (entry) => {
    if (!currentUserId || !isOptedIn) return;
    if (entry.userId === currentUserId) return;
    navigation.navigate('UserPublicProfile', { userId: entry.userId });
  };

  // Derived data
  const podium = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const restOfList = useMemo(() => leaderboard.slice(3), [leaderboard]);
  const activeChallenges = useMemo(() => [...(challenges.pending || []), ...(challenges.active || [])], [challenges]);
  const completedChallenges = challenges.completed || [];
  const displayedChallenges = challengeTab === 'active' ? activeChallenges : completedChallenges;

  if (loading) {
    return (
      <View style={[s.container, isDark && s.containerDark, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#72baa1" />
      </View>
    );
  }

  return (
    <View style={[s.container, isDark && s.containerDark]}>
      <SafeAreaView edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, isDark && s.backBtnDark]} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={isDark ? '#f3f3f6' : '#1c1917'} />
          </TouchableOpacity>
          <Text style={[s.topBarTitle, isDark && s.textLight]}>Classement</Text>
          {isOptedIn ? (
            <TouchableOpacity onPress={handleRefreshProfile} style={[s.backBtn, isDark && s.backBtnDark]} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={20} color={isDark ? '#f3f3f6' : '#1c1917'} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#72baa1" colors={['#72baa1']} />}
      >
        {/* ─── User Rank Bar ──────────────────────────────── */}
        {isOptedIn && userRank && (
          <View style={[s.rankBar, isDark && s.rankBarDark]}>
            <View style={s.rankBarLeft}>
              <Text style={[s.rankLabel, isDark && s.textMuted]}>Ton classement</Text>
              <View style={s.rankBadge}>
                <Text style={s.rankBadgeText}>#{userRank}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleOptOut} disabled={optInLoading} activeOpacity={0.7}>
              <Ionicons name="close-circle-outline" size={22} color={isDark ? '#7a7a88' : '#a8a29e'} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── League Progress ────────────────────────────── */}
        {isOptedIn && userEntry && (
          <LeagueCard
            league={userEntry.league || 'starter'}
            xp={userEntry.xp || 0}
            challengeStats={userEntry.challengeStats}
            isDark={isDark}
          />
        )}

        {/* ─── Opt-in Banner ──────────────────────────────── */}
        {!isOptedIn && (
          <View style={[s.optInBanner, isDark && s.optInBannerDark]}>
            <View style={s.optInContent}>
              <View style={s.optInIconWrap}>
                <View style={s.optInIcon}>
                  <Ionicons name="trophy" size={28} color="#FFF" />
                </View>
              </View>
              <Text style={[s.optInTitle, isDark && s.textLight]}>Rejoins le classement !</Text>
              <Text style={[s.optInSub, isDark && s.textMuted]}>Compare tes performances et défie la communauté</Text>
              <TouchableOpacity style={s.optInBtn} onPress={handleOptIn} disabled={optInLoading} activeOpacity={0.8}>
                {optInLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={s.optInBtnText}>Rejoindre</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Filters ────────────────────────────────────── */}
        <View style={s.filtersSection}>
          <View style={s.filterRow}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[s.filterPill, isDark && s.filterPillDark, period === p.key && s.filterPillActive]}
                onPress={() => setPeriod(p.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.filterPillText, isDark && s.filterPillTextDark, period === p.key && s.filterPillTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.filterRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[s.filterPill, isDark && s.filterPillDark, category === c.key && s.filterPillActive]}
                onPress={() => setCategory(c.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.filterPillText, isDark && s.filterPillTextDark, category === c.key && s.filterPillTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Podium ─────────────────────────────────────── */}
        {podium.length > 0 ? (
          <View style={s.podiumContainer}>
            {podium.map((entry, i) => (
              <PodiumItem
                key={entry._id}
                entry={entry} rank={i + 1} isDark={isDark}
                category={category} period={period}
                onChallenge={isOptedIn && entry.userId !== currentUserId ? handleChallengeUser : null}
              />
            ))}
          </View>
        ) : (
          <View style={s.emptyPodium}>
            <View style={s.emptyPodiumIcon}>
              <Ionicons name="trophy-outline" size={36} color="#FFF" />
            </View>
            <Text style={[s.emptyPodiumTitle, isDark && s.textLight]}>Aucun participant</Text>
            <Text style={[s.emptyPodiumSub, isDark && s.textMuted]}>Sois le premier à rejoindre le classement !</Text>
          </View>
        )}

        {/* ─── Full List ──────────────────────────────────── */}
        {restOfList.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Ionicons name="list-outline" size={16} color={isDark ? '#7a7a88' : '#a8a29e'} />
              <Text style={[s.sectionHeaderText, isDark && s.sectionHeaderTextDark]}>Classement complet</Text>
              <View style={[s.sectionLine, isDark && s.sectionLineDark]} />
            </View>
            {restOfList.map(entry => (
              <LeaderboardRow
                key={entry._id}
                entry={entry}
                isDark={isDark}
                category={category}
                period={period}
                onChallenge={isOptedIn && entry.userId !== currentUserId ? handleChallengeUser : null}
              />
            ))}
          </>
        )}

        {/* ─── Challenges Section ─────────────────────────── */}
        {(activeChallenges.length > 0 || completedChallenges.length > 0) && (
          <>
            <View style={[s.sectionHeader, { marginTop: 28 }]}>
              <Ionicons name="flash-outline" size={16} color={isDark ? '#7a7a88' : '#a8a29e'} />
              <Text style={[s.sectionHeaderText, isDark && s.sectionHeaderTextDark]}>Mes défis</Text>
              <View style={[s.sectionLine, isDark && s.sectionLineDark]} />
            </View>

            {/* Challenge tabs */}
            <View style={s.challengeTabsRow}>
              <TouchableOpacity
                style={[s.challengeTab, isDark && s.challengeTabDark, challengeTab === 'active' && s.challengeTabActive]}
                onPress={() => setChallengeTab('active')}
                activeOpacity={0.8}
              >
                <Text style={[s.challengeTabText, isDark && s.challengeTabTextDark, challengeTab === 'active' && s.challengeTabTextActive]}>
                  En cours {activeChallenges.length > 0 ? `(${activeChallenges.length})` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.challengeTab, isDark && s.challengeTabDark, challengeTab === 'completed' && s.challengeTabActive]}
                onPress={() => setChallengeTab('completed')}
                activeOpacity={0.8}
              >
                <Text style={[s.challengeTabText, isDark && s.challengeTabTextDark, challengeTab === 'completed' && s.challengeTabTextActive]}>
                  Terminés {completedChallenges.length > 0 ? `(${completedChallenges.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {displayedChallenges.length > 0 ? (
              displayedChallenges.map(ch => (
                <ChallengeCard
                  key={ch._id}
                  challenge={ch}
                  myId={currentUserId}
                  isDark={isDark}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onCancel={handleCancel}
                />
              ))
            ) : (
              <View style={s.emptyChallenges}>
                <Text style={[s.emptyChallengesText, isDark && s.textMuted]}>
                  {challengeTab === 'active' ? 'Aucun défi en cours' : 'Aucun défi terminé'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Layout ──
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  containerDark: { backgroundColor: '#0e0e11' },
  textLight: { color: '#f3f3f6' },
  textMuted: { color: '#7a7a88' },
  textTertiary: { color: '#a8a29e' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 180 },

  // ── Top Bar ──
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#efedea' },
  backBtnDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: '#1c1917', letterSpacing: -0.5 },

  // ── Rank Bar ──
  rankBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#efedea' },
  rankBarDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  rankBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankLabel: { fontSize: 13, color: '#78716c', fontWeight: '500' },
  rankBadge: { backgroundColor: '#72baa1', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  rankBadgeText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  // ── League Card ──
  leagueCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#efedea' },
  leagueCardDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  leagueCardInner: { padding: 16 },
  leagueHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  leagueIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  leagueHeaderText: { flex: 1 },
  leagueLabel: { fontSize: 11, color: '#a8a29e', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  leagueName: { fontSize: 20, fontWeight: '800' },
  xpBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  xpBadgeText: { fontSize: 13, fontWeight: '800', color: '#72baa1' },
  progressSection: { marginBottom: 14 },
  progressTrack: { height: 6, backgroundColor: '#efedea', borderRadius: 3, overflow: 'hidden' },
  progressTrackDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#72baa1' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { fontSize: 11, color: '#a8a29e', fontWeight: '500' },
  progressNext: { fontSize: 11, fontWeight: '600' },
  leagueStatsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#efedea', paddingTop: 12 },
  leagueStatsRowDark: { borderTopColor: 'rgba(255,255,255,0.06)' },
  leagueStatCell: { flex: 1, alignItems: 'center' },
  leagueStatValue: { fontSize: 18, fontWeight: '800', color: '#1c1917' },
  leagueStatLabel: { fontSize: 10, color: '#78716c', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  leagueStatDivider: { width: 1, backgroundColor: '#efedea', marginVertical: 2 },
  leagueStatDividerDark: { backgroundColor: 'rgba(255,255,255,0.06)' },

  // ── Opt-in Banner ──
  optInBanner: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#efedea' },
  optInBannerDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  optInContent: { padding: 24, alignItems: 'center' },
  optInIconWrap: { marginBottom: 16 },
  optInIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#72baa1' },
  optInTitle: { fontSize: 18, fontWeight: '800', color: '#1c1917', marginBottom: 6 },
  optInSub: { fontSize: 14, color: '#78716c', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  optInBtn: { backgroundColor: '#72baa1', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  optInBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // ── Filters ──
  filtersSection: { gap: 8, marginBottom: 20 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: '#f5f5f4', alignItems: 'center' },
  filterPillDark: { backgroundColor: '#18181d' },
  filterPillActive: { backgroundColor: '#72baa1' },
  filterPillText: { fontSize: 13, fontWeight: '700', color: '#78716c' },
  filterPillTextDark: { color: '#c1c1cb' },
  filterPillTextActive: { color: '#FFF' },

  // ── Podium ──
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginBottom: 24, paddingTop: 20 },
  podiumItem: { flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingTop: 40, paddingBottom: 12, paddingHorizontal: 8, position: 'relative', borderWidth: 1, borderColor: '#efedea' },
  podiumItemDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  podiumItemGold: { marginTop: -20 },
  podiumMedal: { position: 'absolute', top: 10, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  podiumRankText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  podiumAvatarWrap: { marginBottom: 8, borderRadius: 28, borderWidth: 3, borderColor: '#fff' },
  podiumAvatarWrapDark: { borderColor: '#18181d' },
  podiumAvatar: { width: 52, height: 52, borderRadius: 26 },
  podiumAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  podiumAvatarLetter: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  podiumName: { fontSize: 13, fontWeight: '700', color: '#1c1917', textAlign: 'center', marginBottom: 2 },
  podiumLeagueRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  podiumLeague: { fontSize: 10, fontWeight: '600' },
  podiumSessions: { fontSize: 20, fontWeight: '800', color: '#1c1917' },
  podiumSessionsLabel: { fontSize: 10, color: '#a8a29e', fontWeight: '600', marginBottom: 6 },
  streakBadge: { backgroundColor: '#f5f5f4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 6 },
  streakBadgeDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  streakText: { fontSize: 10, fontWeight: '600', color: '#f0a47a' },
  podiumBar: { height: 4, width: '80%', borderRadius: 2, marginBottom: 4 },
  podiumBarGold: { height: 6 },
  podiumChallengeBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(114,186,161,0.12)', alignItems: 'center', justifyContent: 'center' },
  podiumChallengeBtnDark: { backgroundColor: 'rgba(114,186,161,0.2)' },

  // ── Empty Podium ──
  emptyPodium: { alignItems: 'center', paddingVertical: 40, gap: 10, marginBottom: 16 },
  emptyPodiumIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: '#72baa1' },
  emptyPodiumTitle: { fontSize: 18, fontWeight: '800', color: '#1c1917' },
  emptyPodiumSub: { fontSize: 14, color: '#78716c', textAlign: 'center' },

  // ── Section Headers ──
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingHorizontal: 4 },
  sectionHeaderText: { fontSize: 12, fontWeight: '700', color: '#a8a29e', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionHeaderTextDark: { color: '#7a7a88' },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#efedea' },
  sectionLineDark: { backgroundColor: 'rgba(255,255,255,0.06)' },

  // ── Leaderboard Row ──
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#efedea' },
  lbRowDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  lbRank: { fontSize: 14, fontWeight: '800', color: '#a8a29e', width: 32, textAlign: 'center' },
  lbAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(114,186,161,0.12)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lbAvatarDark: { backgroundColor: 'rgba(114,186,161,0.2)' },
  lbAvatarImg: { width: 42, height: 42, borderRadius: 21 },
  lbAvatarLetter: { fontSize: 16, fontWeight: '800', color: '#72baa1' },
  lbInfo: { flex: 1, minWidth: 0 },
  lbNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lbName: { fontSize: 15, fontWeight: '700', color: '#1c1917', flexShrink: 1 },
  lbLeagueBadge: { fontSize: 14 },
  lbStreak: { fontSize: 11, color: '#f0a47a', fontWeight: '600', marginTop: 2 },
  lbStats: { alignItems: 'flex-end' },
  lbStatsValue: { fontSize: 18, fontWeight: '800', color: '#1c1917' },
  lbStatsLabel: { fontSize: 10, color: '#78716c', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  lbChallengeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(114,186,161,0.12)', alignItems: 'center', justifyContent: 'center' },
  lbChallengeBtnDark: { backgroundColor: 'rgba(114,186,161,0.2)' },

  // ── Challenge Tabs ──
  challengeTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  challengeTab: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: '#f5f5f4', alignItems: 'center' },
  challengeTabDark: { backgroundColor: '#18181d' },
  challengeTabActive: { backgroundColor: '#72baa1' },
  challengeTabText: { fontSize: 13, fontWeight: '700', color: '#78716c' },
  challengeTabTextDark: { color: '#c1c1cb' },
  challengeTabTextActive: { color: '#FFF' },

  // ── Challenge Card ──
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#efedea' },
  cardDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },
  cardInner: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  challengeIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(114,186,161,0.12)', alignItems: 'center', justifyContent: 'center' },
  challengeIconWrapDark: { backgroundColor: 'rgba(114,186,161,0.2)' },
  cardHeaderText: { flex: 1, minWidth: 0 },
  challengeTitle: { fontSize: 15, fontWeight: '700', color: '#1c1917' },
  opponentName: { fontSize: 12, color: '#78716c', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  dateRange: { fontSize: 12, color: '#a8a29e', fontWeight: '500', marginBottom: 12, marginLeft: 56 },

  // ── Challenge Progress ──
  challengeProgressWrap: { marginBottom: 10 },
  challengeProgressTrack: { height: 6, backgroundColor: '#efedea', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  challengeProgressTrackDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  challengeProgressFill: { height: 6, borderRadius: 3 },
  challengeProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  challengeProgressScore: { fontSize: 13, fontWeight: '700', color: '#1c1917' },

  // ── Score Row ──
  scoreRow: { flexDirection: 'row', backgroundColor: '#f5f5f4', borderRadius: 12, padding: 12, marginBottom: 10 },
  scoreRowDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  scoreCell: { flex: 1, alignItems: 'center' },
  scoreLabel: { fontSize: 10, color: '#78716c', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreValue: { fontSize: 22, fontWeight: '800', color: '#1c1917' },
  scoreDivider: { width: 1, backgroundColor: '#efedea', marginVertical: 4 },
  scoreDividerDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  resultText: { fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  xpRewardText: { fontSize: 12, fontWeight: '800', color: '#72baa1', textAlign: 'center', marginBottom: 4 },

  // ── Max Result Submission ──
  maxResultSection: {
    backgroundColor: 'rgba(114,186,161,0.06)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(114,186,161,0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  maxResultSectionDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(114,186,161,0.2)',
  },
  resultSubmittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultSubmittedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#72baa1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultSubmittedLabel: {
    fontSize: 11,
    color: '#a8a29e',
    fontWeight: '500',
  },
  resultSubmittedValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#72baa1',
  },
  waitingBadge: {
    backgroundColor: 'rgba(212,169,106,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  waitingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d4a96a',
  },
  opponentHintBanner: {
    backgroundColor: 'rgba(212,169,106,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  opponentHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4a96a',
  },
  resultInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  resultInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultInputWrapperDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  resultInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1917',
  },
  resultUnitLabel: {
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#a8a29e',
    backgroundColor: '#f5f5f4',
    alignSelf: 'stretch',
    textAlignVertical: 'center',
    paddingVertical: 10,
  },
  submitResultBtn: {
    backgroundColor: '#72baa1',
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitResultBtnDisabled: {
    opacity: 0.4,
  },
  submitResultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  // ── Action Buttons ──
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#72baa1' },
  acceptText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  declineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#efedea' },
  declineBtnDark: { borderColor: 'rgba(255,255,255,0.06)' },
  declineText: { fontSize: 14, fontWeight: '700', color: '#78716c' },
  declineTextDark: { color: '#c1c1cb' },
  cancelBtn: { marginTop: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  cancelBtnDark: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  cancelText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
  cancelTextDark: { color: '#ef4444' },

  // ── Empty Challenges ──
  emptyChallenges: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyChallengesText: { fontSize: 14, color: '#78716c' },
});
