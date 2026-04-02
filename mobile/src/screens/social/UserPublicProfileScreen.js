import React, { useState, useCallback, useEffect } from 'react';
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
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import social from '../../api/social';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { getOrCreateSocialConversation } from '../../api/matchChat';
import { getMutualMatches } from '../../api/matching';
import { useAuth } from '../../contexts/AuthContext';
import { useSharedSession } from '../../contexts/SharedSessionContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDuration = (sec) => {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getInitials = (prenom, pseudo) => (prenom || pseudo || '?').charAt(0).toUpperCase();

// ─── Types de défis ───────────────────────────────────────────────────────────

const CHALLENGE_TYPES = [
  { type: 'max_pushups',  label: 'Max Pompes',          icon: '💪', unit: 'reps', category: 'max',     desc: 'Qui fait le plus de pompes ?' },
  { type: 'max_pullups',  label: 'Max Tractions',        icon: '🔝', unit: 'reps', category: 'max',     desc: 'Qui fait le plus de tractions ?' },
  { type: 'max_bench',    label: 'Développé Couché',     icon: '🏋️', unit: 'kg',   category: 'max',     desc: 'Qui soulève le plus lourd ?' },
  { type: 'max_squat',    label: 'Squat Max',            icon: '🦵', unit: 'kg',   category: 'max',     desc: 'Squat 1RM — épreuve de force' },
  { type: 'max_deadlift', label: 'Soulevé de Terre',     icon: '⚡', unit: 'kg',   category: 'max',     desc: 'Deadlift 1RM — force pure' },
  { type: 'max_burpees',  label: 'Max Burpees (60s)',    icon: '🔥', unit: 'reps', category: 'max',     desc: 'Le plus de burpees en 1min' },
  { type: 'sessions',     label: 'Plus de séances',      icon: '📅', unit: null,   category: 'ongoing', desc: 'Qui s\'entraîne le plus souvent ?' },
  { type: 'calories',     label: 'Plus de calories',     icon: '🌡️', unit: null,   category: 'ongoing', desc: 'Qui brûle le plus de calories ?' },
];

// ─── Modal de défi ────────────────────────────────────────────────────────────

function ChallengeModal({ visible, targetUser, onClose, isDark }) {
  const [selected, setSelected] = useState(null);
  const [duration, setDuration] = useState(7);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setSelected(null);
    setDuration(7);
    setSending(false);
    setSent(false);
    setError('');
    onClose();
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    setError('');
    try {
      await apiClient.post(endpoints.challenges.create, {
        challengedId: targetUser._id,
        type: selected.type,
        duration: selected.category === 'max' ? 7 : duration,
      });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'envoi du défi');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={ms.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ms.kavWrapper}>
          <View style={[ms.sheet, isDark && ms.sheetDark]}>
            {/* Handle */}
            <View style={[ms.handle, isDark && ms.handleDark]} />

            {sent ? (
              <View style={ms.successWrap}>
                {/* Glow ring */}
                <View style={[ms.successGlow, isDark && ms.successGlowDark]}>
                  <View style={[ms.successIconRing, isDark && ms.successIconRingDark]}>
                    <Text style={ms.successIconText}>⚔️</Text>
                  </View>
                </View>

                <Text style={[ms.successTitle, isDark && ms.successTitleDark]}>Défi lancé !</Text>

                {/* Recap card */}
                <View style={[ms.successRecap, isDark && ms.successRecapDark]}>
                  <View style={ms.successRecapRow}>
                    <Text style={ms.successRecapIcon}>{selected?.icon || '⚡'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[ms.successRecapLabel, isDark && ms.successRecapLabelDark]}>{selected?.label}</Text>
                      <Text style={[ms.successRecapDesc, isDark && ms.successRecapDescDark]}>
                        vs {targetUser?.prenom || targetUser?.pseudo}
                        {selected?.category === 'ongoing' ? ` — ${duration} jours` : ' — Record'}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[ms.successSub, isDark && ms.successSubDark]}>
                  Une notification a été envoyée.{'\n'}Prépare-toi pour le combat !
                </Text>

                <TouchableOpacity style={ms.successCloseBtn} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={ms.successCloseBtnText}>C'est parti</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[ms.sheetTitle, isDark && ms.sheetTitleDark]}>⚡ Lancer un défi</Text>
                <Text style={[ms.sheetSub, isDark && ms.sheetSubDark]}>
                  à {targetUser?.prenom || targetUser?.pseudo}
                </Text>

                {error ? (
                  <View style={[ms.errorBox, isDark && ms.errorBoxDark]}>
                    <Text style={ms.errorText}>{error}</Text>
                  </View>
                ) : null}

                <FlatList
                  data={CHALLENGE_TYPES}
                  keyExtractor={item => item.type}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={{ gap: 10 }}
                  contentContainerStyle={{ gap: 10, marginBottom: 16 }}
                  renderItem={({ item }) => {
                    const isActive = selected?.type === item.type;
                    return (
                      <TouchableOpacity
                        style={[ms.challengeOption, isDark && ms.challengeOptionDark, isActive && ms.challengeOptionActive]}
                        onPress={() => setSelected(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={ms.challengeIcon}>{item.icon}</Text>
                        <Text style={[ms.challengeLabel, isDark && ms.challengeLabelDark]} numberOfLines={2}>{item.label}</Text>
                        <Text style={[ms.challengeDesc, isDark && ms.challengeDescDark]} numberOfLines={2}>{item.desc}</Text>
                        {item.category === 'max' && (
                          <View style={ms.maxBadge}>
                            <Text style={ms.maxBadgeText}>MAX</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />

                {selected?.category === 'ongoing' && (
                  <View style={ms.durationPicker}>
                    <Text style={[ms.durationLabel, isDark && ms.durationLabelDark]}>Durée du défi</Text>
                    <View style={ms.durationRow}>
                      {[3, 7, 14, 30].map(d => (
                        <TouchableOpacity
                          key={d}
                          style={[ms.durationBtn, isDark && ms.durationBtnDark, duration === d && ms.durationBtnActive]}
                          onPress={() => setDuration(d)}
                          activeOpacity={0.8}
                        >
                          <Text style={[ms.durationBtnText, isDark && ms.durationBtnTextDark, duration === d && ms.durationBtnTextActive]}>
                            {d}j
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[ms.primaryBtn, !selected && ms.primaryBtnDisabled]}
                  onPress={handleSend}
                  disabled={!selected || sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={ms.primaryBtnText}>
                      {selected ? `Envoyer le défi — ${selected.label}` : 'Sélectionne un type de défi'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleClose} style={ms.cancelBtn} activeOpacity={0.7}>
                  <Text style={[ms.cancelText, isDark && ms.cancelTextDark]}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Modal de message ─────────────────────────────────────────────────────────

function MessageModal({ visible, targetUser, onClose, isDark }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setContent('');
    setSending(false);
    setSent(false);
    setError('');
    onClose();
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    setError('');
    try {
      await social.sendMessage(targetUser._id, content.trim());
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={ms.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ms.kavWrapper}>
          <View style={[ms.sheet, isDark && ms.sheetDark]}>
            <View style={[ms.handle, isDark && ms.handleDark]} />

            {sent ? (
              <View style={ms.successWrap}>
                <Text style={ms.successEmoji}>💬</Text>
                <Text style={[ms.successTitle, isDark && ms.successTitleDark]}>Message envoyé !</Text>
                <Text style={[ms.successSub, isDark && ms.successSubDark]}>
                  {targetUser?.prenom || targetUser?.pseudo} recevra une notification.
                </Text>
                <TouchableOpacity style={ms.primaryBtn} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={ms.primaryBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[ms.sheetTitle, isDark && ms.sheetTitleDark]}>
                  💬 Message à {targetUser?.prenom || targetUser?.pseudo}
                </Text>
                <Text style={[ms.sheetSub, isDark && ms.sheetSubDark]}>
                  Vous vous suivez mutuellement — message direct
                </Text>

                {error ? (
                  <View style={[ms.errorBox, isDark && ms.errorBoxDark]}>
                    <Text style={ms.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TextInput
                  style={[ms.textarea, isDark && ms.textareaDark]}
                  placeholder="Ton message..."
                  placeholderTextColor={isDark ? '#555' : '#BBB'}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  color={isDark ? '#FFF' : '#111'}
                />
                <Text style={[ms.charCount, isDark && ms.charCountDark]}>{content.length}/500</Text>

                <TouchableOpacity
                  style={[ms.primaryBtn, (!content.trim() || sending) && ms.primaryBtnDisabled]}
                  onPress={handleSend}
                  disabled={!content.trim() || sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={ms.primaryBtnText}>Envoyer</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleClose} style={ms.cancelBtn} activeOpacity={0.7}>
                  <Text style={[ms.cancelText, isDark && ms.cancelTextDark]}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Mini workout card ────────────────────────────────────────────────────────

function MiniWorkoutCard({ session, isDark }) {
  if (!session) return null;
  const muscles = session.entries
    ?.flatMap(e => e.muscles?.length ? e.muscles : e.muscle ? [e.muscle] : [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3) || [];

  return (
    <View style={[styles.miniCard, isDark && styles.miniCardDark]}>
      <Text style={[styles.miniCardName, isDark && styles.miniCardNameDark]} numberOfLines={1}>
        {session.name || 'Séance'}
      </Text>
      <View style={styles.miniCardStats}>
        <View style={styles.miniStat}>
          <Ionicons name="time-outline" size={12} color={theme.colors.primary} />
          <Text style={[styles.miniStatText, isDark && styles.miniStatTextDark]}>
            {formatDuration(session.durationSec)}
          </Text>
        </View>
        {session.calories > 0 && (
          <View style={styles.miniStat}>
            <Ionicons name="flame-outline" size={12} color={theme.colors.error} />
            <Text style={[styles.miniStatText, isDark && styles.miniStatTextDark]}>{session.calories} kcal</Text>
          </View>
        )}
      </View>
      {muscles.length > 0 && (
        <View style={styles.miniMuscles}>
          {muscles.map((m, i) => (
            <View key={i} style={[styles.miniMuscleTag, isDark && styles.miniMuscleTagDark]}>
              <Text style={[styles.miniMuscleText, isDark && styles.miniMuscleTextDark]}>{m}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={[styles.miniCardDate, isDark && styles.miniCardDateDark]}>{formatDate(session.endedAt)}</Text>
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
  const [showChallenge, setShowChallenge] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [matchIdForUser, setMatchIdForUser] = useState(null);
  const shared = useSharedSession();

  useEffect(() => {
    if (!userId || userId === me?._id) return;
    getMutualMatches()
      .then(res => {
        const match = (res?.matches || []).find(m => String(m.user?._id || '') === String(userId));
        if (match) setMatchIdForUser(String(match._id));
      })
      .catch(() => {});
  }, [userId]);

  const handleInviteSession = async () => {
    if (inviteLoading || !matchIdForUser || !shared?.invite) return;
    setInviteLoading(true);
    try {
      await shared.invite(matchIdForUser);
      Alert.alert('Invitation envoyée !', `${data?.user?.pseudo || 'Ton partenaire'} a été invité.`);
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || err?.response?.data?.error || "Impossible d'envoyer l'invitation");
    } finally {
      setInviteLoading(false);
    }
  };

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

  const handleOpenChat = async () => {
    if (msgLoading || !data) return;
    setMsgLoading(true);
    try {
      const conversation = await getOrCreateSocialConversation(userId);
      navigation.navigate('ChatDetail', {
        conversationId: conversation._id,
        otherUser: conversation.otherUser || data.user,
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation');
    } finally {
      setMsgLoading(false);
    }
  };

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
      // Recharger pour récupérer isMutual à jour
      const res = await social.getUserProfile(userId);
      setData(res.data);
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

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  const { user, profile, followersCount, followingCount, isFollowing, isMe, isMutual, sessionsCount, recentSessions } = data;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, isDark && styles.backBtnDark]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={isDark ? '#FFF' : '#111'} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, isDark && styles.topBarTitleDark]} numberOfLines={1}>
            {user.pseudo ? `@${user.pseudo}` : user.prenom || 'Profil'}
          </Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.profileCard, isDark && styles.profileCardDark]}>
          {/* Banner */}
          <LinearGradient
            colors={[theme.colors.primary, '#F9C4A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileBanner}
          />

          {/* Avatar */}
          <View style={[styles.avatarWrap, isDark && styles.avatarWrapDark]}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[theme.colors.primary, '#F9C4A3']}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarPlaceholderText}>{getInitials(user.prenom, user.pseudo)}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Name */}
          <Text style={[styles.displayName, isDark && styles.displayNameDark]}>
            {user.prenom || user.pseudo || 'Utilisateur'}
          </Text>
          {user.pseudo ? (
            <Text style={[styles.pseudo, isDark && styles.pseudoDark]}>@{user.pseudo}</Text>
          ) : null}

          {/* Stats row */}
          <View style={[styles.statsRow, isDark && styles.statsRowDark]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>{sessionsCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Séances</Text>
            </View>
            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>{followersCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Abonnés</Text>
            </View>
            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>{followingCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Abonnements</Text>
            </View>
          </View>

          {/* Action buttons */}
          {!isMe && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.followButton, isFollowing && (isDark ? styles.followingButtonDark : styles.followingButton)]}
                onPress={handleFollow}
                disabled={followLoading}
                activeOpacity={0.8}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? (isDark ? '#7A7D85' : '#666') : '#FFF'} />
                ) : (
                  <Text style={[styles.followButtonText, isFollowing && (isDark ? styles.followingButtonTextDark : styles.followingButtonText)]}>
                    {isFollowing ? '✓ Suivi' : '+ Suivre'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, isDark && styles.iconBtnDark]}
                onPress={() => setShowChallenge(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.iconBtnEmoji}>⚡</Text>
              </TouchableOpacity>

              {isMutual && (
                <TouchableOpacity
                  style={[styles.iconBtn, isDark && styles.iconBtnDark]}
                  onPress={handleOpenChat}
                  disabled={msgLoading}
                  activeOpacity={0.8}
                >
                  {msgLoading
                    ? <ActivityIndicator size="small" color={theme.colors.primary} />
                    : <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
                  }
                </TouchableOpacity>
              )}
              {matchIdForUser && (
                <TouchableOpacity
                  style={[styles.iconBtn, isDark && styles.iconBtnDark, { borderColor: '#72baa1' }]}
                  onPress={handleInviteSession}
                  disabled={inviteLoading}
                  activeOpacity={0.8}
                >
                  {inviteLoading
                    ? <ActivityIndicator size="small" color="#72baa1" />
                    : <Ionicons name="barbell-outline" size={20} color="#72baa1" />
                  }
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Profile info (bio, location, level, workout types) */}
        {profile && (profile.bio || profile.location?.city || profile.fitnessLevel || profile.workoutTypes?.length > 0) && (
          <View style={[styles.profileInfoCard, isDark && styles.profileInfoCardDark]}>
            {/* Location & age */}
            {(profile.location?.city || profile.age) && (
              <View style={styles.profileLocationRow}>
                {profile.location?.city && (
                  <View style={styles.profileLocationItem}>
                    <Ionicons name="location" size={16} color={theme.colors.primary} />
                    <Text style={[styles.profileLocationText, isDark && styles.profileLocationTextDark]}>
                      {profile.location.city}
                    </Text>
                  </View>
                )}
                {profile.age && (
                  <View style={styles.profileLocationItem}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.profileLocationText, isDark && styles.profileLocationTextDark]}>
                      {profile.age} ans
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Fitness level */}
            {profile.fitnessLevel && (
              <View style={styles.profileLevelRow}>
                <LinearGradient
                  colors={
                    profile.fitnessLevel === 'beginner' ? ['#4CAF50', '#3D9140'] :
                    profile.fitnessLevel === 'advanced' ? ['#FF6B6B', '#E55A5A'] :
                    profile.fitnessLevel === 'expert' ? ['#9C27B0', '#7B1FA2'] :
                    ['#FFC107', '#E0A800']
                  }
                  style={styles.profileLevelBadge}
                >
                  <Ionicons name="fitness" size={14} color="#FFF" />
                  <Text style={styles.profileLevelText}>
                    {profile.fitnessLevel === 'beginner' ? 'Debutant' :
                     profile.fitnessLevel === 'intermediate' ? 'Intermediaire' :
                     profile.fitnessLevel === 'advanced' ? 'Avance' :
                     profile.fitnessLevel === 'expert' ? 'Expert' :
                     profile.fitnessLevel}
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Bio */}
            {profile.bio ? (
              <View style={styles.profileBioSection}>
                <Text style={[styles.profileInfoSectionTitle, isDark && styles.profileInfoSectionTitleDark]}>A propos</Text>
                <Text style={[styles.profileBioText, isDark && styles.profileBioTextDark]}>{profile.bio}</Text>
              </View>
            ) : null}

            {/* Workout types */}
            {profile.workoutTypes?.length > 0 && (
              <View style={styles.profileWorkoutSection}>
                <Text style={[styles.profileInfoSectionTitle, isDark && styles.profileInfoSectionTitleDark]}>Sports pratiques</Text>
                <View style={styles.profileWorkoutTypes}>
                  {profile.workoutTypes.map((type, i) => (
                    <View key={i} style={[styles.profileWorkoutChip, isDark && styles.profileWorkoutChipDark]}>
                      <Ionicons
                        name={
                          type === 'musculation' || type === 'muscu' ? 'barbell' :
                          type === 'cardio' ? 'heart' :
                          type === 'crossfit' ? 'fitness' :
                          type === 'yoga' || type === 'pilates' ? 'flower' :
                          type === 'running' ? 'walk' :
                          type === 'cycling' ? 'bicycle' :
                          type === 'swimming' ? 'water' :
                          type === 'boxing' ? 'hand-left' :
                          type === 'dance' ? 'musical-notes' :
                          type === 'hiit' ? 'flash' :
                          type === 'stretching' ? 'body' :
                          'fitness'
                        }
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text style={[styles.profileWorkoutChipText, isDark && styles.profileWorkoutChipTextDark]}>
                        {type}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Recent sessions */}
        {recentSessions?.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Séances récentes</Text>
            {recentSessions.map(session => (
              <MiniWorkoutCard key={session._id} session={session} isDark={isDark} />
            ))}
          </>
        )}

        {recentSessions?.length === 0 && (
          <View style={styles.noSessionsContainer}>
            <Ionicons name="barbell-outline" size={40} color={isDark ? '#555' : '#DDD'} />
            <Text style={[styles.noSessionsText, isDark && styles.noSessionsTextDark]}>
              Aucune séance publique
            </Text>
          </View>
        )}

        {/* Défis */}
        <TouchableOpacity
          style={[styles.challengesNav, isDark && styles.challengesNavDark]}
          onPress={() => {
            try { navigation.navigate('Challenges'); } catch {}
          }}
          activeOpacity={0.8}
        >
          <View style={styles.challengesNavLeft}>
            <View style={[styles.challengesNavIcon, isDark && styles.challengesNavIconDark]}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </View>
            <View>
              <Text style={[styles.challengesNavTitle, isDark && styles.challengesNavTitleDark]}>Défis</Text>
              <Text style={[styles.challengesNavSub, isDark && styles.challengesNavSubDark]}>Voir tous mes défis</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <ChallengeModal
        visible={showChallenge}
        targetUser={user}
        onClose={() => setShowChallenge(false)}
        isDark={isDark}
      />
    </View>
  );
}

// ─── Styles principaux ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F7' },
  containerDark: { backgroundColor: '#111318' },
  centered: { alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtnDark: {
    backgroundColor: '#1E2228',
    shadowOpacity: 0,
    elevation: 0,
  },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  topBarTitleDark: { color: '#FFFFFF' },

  scrollContent: { paddingBottom: 180 },

  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  profileCardDark: { backgroundColor: '#1A1D24' },

  profileBanner: { height: 100 },

  avatarWrap: {
    alignSelf: 'center',
    marginTop: -44,
    marginBottom: 12,
    borderRadius: 46,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  avatarWrapDark: {
    borderColor: '#1A1D24',
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: { fontSize: 34, fontWeight: '800', color: '#FFF' },

  displayName: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 4 },
  displayNameDark: { color: '#FFFFFF' },
  pseudo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  pseudoDark: { color: '#7A7D85' },

  statsRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#EDEEF2',
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 10,
    marginBottom: 20,
  },
  statsRowDark: {
    borderColor: '#2A2E36',
    backgroundColor: 'transparent',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111' },
  statValueDark: { color: '#FFFFFF' },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelDark: { color: '#7A7D85' },
  statDivider: { width: 1, backgroundColor: '#EDEEF2', marginVertical: 4 },
  statDividerDark: { backgroundColor: '#2A2E36' },

  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  followButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  followingButton: { backgroundColor: '#F0F0F0' },
  followingButtonDark: { backgroundColor: '#2A2E36' },
  followButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  followingButtonText: { color: '#666' },
  followingButtonTextDark: { color: '#7A7D85' },

  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDark: { backgroundColor: `${theme.colors.primary}25` },
  iconBtnEmoji: { fontSize: 20 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#111',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleDark: { color: '#FFFFFF' },

  miniCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  miniCardDark: { backgroundColor: '#1A1D24' },
  miniCardName: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 8 },
  miniCardNameDark: { color: '#FFFFFF' },
  miniCardStats: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatText: { fontSize: 13, color: '#666' },
  miniStatTextDark: { color: '#7A7D85' },
  miniMuscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  miniMuscleTag: {
    backgroundColor: '#F5F6FA',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  miniMuscleTagDark: { backgroundColor: '#22262E' },
  miniMuscleText: { fontSize: 12, color: '#666' },
  miniMuscleTextDark: { color: '#7A7D85' },
  miniCardDate: { fontSize: 12, color: '#AAA' },
  miniCardDateDark: { color: '#555' },

  noSessionsContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noSessionsText: { fontSize: 14, color: '#AAA' },
  noSessionsTextDark: { color: '#555' },

  challengesNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  challengesNavDark: { backgroundColor: '#1A1D24' },
  challengesNavLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  challengesNavIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengesNavIconDark: { backgroundColor: `${theme.colors.primary}25` },
  challengesNavTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, color: '#111', marginBottom: 2 },
  challengesNavTitleDark: { color: '#FFFFFF' },
  challengesNavSub: { fontSize: 12, color: '#666' },
  challengesNavSubDark: { color: '#7A7D85' },

  // Profile info card (bio, location, level, workout types)
  profileInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  profileInfoCardDark: { backgroundColor: '#1A1D24' },

  profileLocationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  profileLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileLocationText: { fontSize: 14, color: '#666' },
  profileLocationTextDark: { color: '#7A7D85' },

  profileLevelRow: { marginBottom: 16 },
  profileLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  profileLevelText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  profileBioSection: { marginBottom: 16 },
  profileInfoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileInfoSectionTitleDark: { color: '#FFFFFF' },
  profileBioText: { fontSize: 14, color: '#666', lineHeight: 21 },
  profileBioTextDark: { color: '#7A7D85' },

  profileWorkoutSection: {},
  profileWorkoutTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileWorkoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}12`,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 6,
  },
  profileWorkoutChipDark: { backgroundColor: `${theme.colors.primary}25` },
  profileWorkoutChipText: {
    fontSize: 13,
    color: '#111',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  profileWorkoutChipTextDark: { color: '#FFFFFF' },
});

// ─── Styles modaux ────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kavWrapper: { width: '100%' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    maxHeight: '90%',
  },
  sheetDark: { backgroundColor: '#1A1D24' },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  handleDark: { backgroundColor: '#444' },

  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 4 },
  sheetTitleDark: { color: '#FFFFFF' },
  sheetSub: { fontSize: 14, color: '#AAA', marginBottom: 20 },
  sheetSubDark: { color: '#555' },

  successWrap: { alignItems: 'center', paddingVertical: 28 },
  successGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successGlowDark: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  successIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  successIconRingDark: {
    backgroundColor: '#1A1D24',
    borderColor: theme.colors.primary,
  },
  successIconText: { fontSize: 28 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 6, letterSpacing: -0.3 },
  successTitleDark: { color: '#FFFFFF' },
  successRecap: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDEEF2',
  },
  successRecapDark: {
    backgroundColor: '#22262E',
    borderColor: '#2A2E36',
  },
  successRecapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successRecapIcon: { fontSize: 26 },
  successRecapLabel: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  successRecapLabelDark: { color: '#FFFFFF' },
  successRecapDesc: { fontSize: 12, color: '#888' },
  successRecapDescDark: { color: '#7A7D85' },
  successSub: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  successSubDark: { color: '#7A7D85' },
  successCloseBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  successCloseBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  successEmoji: { fontSize: 56, marginBottom: 16 },

  errorBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, marginBottom: 12 },
  errorBoxDark: { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  errorText: { fontSize: 13, color: '#DC2626' },

  // Challenge options
  challengeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDEEF2',
    backgroundColor: '#F5F6FA',
    position: 'relative',
    minHeight: 100,
  },
  challengeOptionDark: { backgroundColor: '#22262E', borderColor: '#2A2E36' },
  challengeOptionActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
  challengeIcon: { fontSize: 22, marginBottom: 6 },
  challengeLabel: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 4 },
  challengeLabelDark: { color: '#FFFFFF' },
  challengeDesc: { fontSize: 11, color: '#666', lineHeight: 15 },
  challengeDescDark: { color: '#7A7D85' },
  maxBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  maxBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },

  // Duration
  durationPicker: { marginBottom: 16 },
  durationLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  durationLabelDark: { color: '#7A7D85' },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDEEF2',
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
  },
  durationBtnDark: { backgroundColor: '#22262E', borderColor: '#2A2E36' },
  durationBtnActive: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` },
  durationBtnText: { fontSize: 14, fontWeight: '700', color: '#666' },
  durationBtnTextDark: { color: '#7A7D85' },
  durationBtnTextActive: { color: theme.colors.primary },

  // Message
  textarea: {
    borderWidth: 1.5,
    borderColor: '#EDEEF2',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 6,
    backgroundColor: '#FFF',
    color: '#111',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  textareaDark: { backgroundColor: '#22262E', borderColor: '#2A2E36', color: '#FFF' },
  charCount: { fontSize: 11, color: '#AAA', textAlign: 'right', marginBottom: 16 },
  charCountDark: { color: '#555' },

  // Buttons
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 15, color: '#666' },
  cancelTextDark: { color: '#7A7D85' },
});
