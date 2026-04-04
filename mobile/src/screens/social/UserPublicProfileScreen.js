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

// ─── Types de defis ───────────────────────────────────────────────────────────

const CHALLENGE_ICONS = {
  max_pushups: 'fitness',
  max_pullups: 'arrow-up-circle',
  max_bench: 'barbell',
  max_squat: 'body',
  max_deadlift: 'flash',
  max_burpees: 'flame',
  sessions: 'calendar',
  calories: 'thermometer',
};

const CHALLENGE_TYPES = [
  { type: 'max_pushups',  label: 'Max Pompes',          unit: 'reps', category: 'max',     desc: 'Qui fait le plus de pompes ?' },
  { type: 'max_pullups',  label: 'Max Tractions',        unit: 'reps', category: 'max',     desc: 'Qui fait le plus de tractions ?' },
  { type: 'max_bench',    label: 'Developpe Couche',     unit: 'kg',   category: 'max',     desc: 'Qui souleve le plus lourd ?' },
  { type: 'max_squat',    label: 'Squat Max',            unit: 'kg',   category: 'max',     desc: 'Squat 1RM — epreuve de force' },
  { type: 'max_deadlift', label: 'Souleve de Terre',     unit: 'kg',   category: 'max',     desc: 'Deadlift 1RM — force pure' },
  { type: 'max_burpees',  label: 'Max Burpees (60s)',    unit: 'reps', category: 'max',     desc: 'Le plus de burpees en 1min' },
  { type: 'sessions',     label: 'Plus de seances',      unit: null,   category: 'ongoing', desc: 'Qui s\'entraine le plus souvent ?' },
  { type: 'calories',     label: 'Plus de calories',     unit: null,   category: 'ongoing', desc: 'Qui brule le plus de calories ?' },
];

// ─── Modal de defi ────────────────────────────────────────────────────────────

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
      setError(err?.response?.data?.message || 'Erreur lors de l\'envoi du defi');
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
                    <Ionicons name="flash" size={28} color="#72baa1" />
                  </View>
                </View>

                <Text style={[ms.successTitle, isDark && ms.successTitleDark]}>Defi lance !</Text>

                {/* Recap card */}
                <View style={[ms.successRecap, isDark && ms.successRecapDark]}>
                  <View style={ms.successRecapRow}>
                    <Ionicons name={CHALLENGE_ICONS[selected?.type] || 'flash'} size={26} color="#72baa1" />
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
                  Une notification a ete envoyee.{'\n'}Prepare-toi pour le combat !
                </Text>

                <TouchableOpacity style={ms.successCloseBtn} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={ms.successCloseBtnText}>C'est parti</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={ms.sheetTitleRow}>
                  <Ionicons name="flash" size={20} color="#72baa1" />
                  <Text style={[ms.sheetTitle, isDark && ms.sheetTitleDark]}>Lancer un defi</Text>
                </View>
                <Text style={[ms.sheetSub, isDark && ms.sheetSubDark]}>
                  a {targetUser?.prenom || targetUser?.pseudo}
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
                        <Ionicons name={CHALLENGE_ICONS[item.type] || 'flash'} size={22} color={isActive ? '#72baa1' : (isDark ? '#c1c1cb' : '#78716c')} style={{ marginBottom: 6 }} />
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
                    <Text style={[ms.durationLabel, isDark && ms.durationLabelDark]}>Duree du defi</Text>
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
                      {selected ? `Envoyer le defi — ${selected.label}` : 'Selectionne un type de defi'}
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
                <Ionicons name="chatbubble" size={56} color="#72baa1" style={{ marginBottom: 16 }} />
                <Text style={[ms.successTitle, isDark && ms.successTitleDark]}>Message envoye !</Text>
                <Text style={[ms.successSub, isDark && ms.successSubDark]}>
                  {targetUser?.prenom || targetUser?.pseudo} recevra une notification.
                </Text>
                <TouchableOpacity style={ms.primaryBtn} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={ms.primaryBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={ms.sheetTitleRow}>
                  <Ionicons name="chatbubble-outline" size={20} color="#72baa1" />
                  <Text style={[ms.sheetTitle, isDark && ms.sheetTitleDark]}>
                    Message a {targetUser?.prenom || targetUser?.pseudo}
                  </Text>
                </View>
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
                  placeholderTextColor={isDark ? '#7a7a88' : '#a8a29e'}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  color={isDark ? '#f3f3f6' : '#1c1917'}
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
        {session.name || 'Seance'}
      </Text>
      <View style={styles.miniCardStats}>
        <View style={styles.miniStat}>
          <Ionicons name="time-outline" size={12} color="#72baa1" />
          <Text style={[styles.miniStatText, isDark && styles.miniStatTextDark]}>
            {formatDuration(session.durationSec)}
          </Text>
        </View>
        {session.calories > 0 && (
          <View style={styles.miniStat}>
            <Ionicons name="flame-outline" size={12} color="#f0a47a" />
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
      Alert.alert('Invitation envoyee !', `${data?.user?.pseudo || 'Ton partenaire'} a ete invite.`);
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
      // Recharger pour recuperer isMutual a jour
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
        <ActivityIndicator size="large" color="#72baa1" />
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
            <Ionicons name="chevron-back" size={20} color={isDark ? '#f3f3f6' : '#1c1917'} />
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
          <View style={styles.profileBanner} />

          {/* Avatar */}
          <View style={[styles.avatarWrap, isDark && styles.avatarWrapDark]}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{getInitials(user.prenom, user.pseudo)}</Text>
              </View>
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
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Seances</Text>
            </View>
            <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>{followersCount}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Abonnes</Text>
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
                  <ActivityIndicator size="small" color={isFollowing ? (isDark ? '#7a7a88' : '#78716c') : '#FFF'} />
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
                <Ionicons name="flash" size={20} color="#72baa1" />
              </TouchableOpacity>

              {isMutual && (
                <TouchableOpacity
                  style={[styles.iconBtn, isDark && styles.iconBtnDark]}
                  onPress={handleOpenChat}
                  disabled={msgLoading}
                  activeOpacity={0.8}
                >
                  {msgLoading
                    ? <ActivityIndicator size="small" color="#72baa1" />
                    : <Ionicons name="chatbubble-outline" size={20} color="#72baa1" />
                  }
                </TouchableOpacity>
              )}
              {matchIdForUser && (
                <TouchableOpacity
                  style={[styles.iconBtn, isDark && styles.iconBtnDark]}
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
                    <Ionicons name="location" size={16} color="#72baa1" />
                    <Text style={[styles.profileLocationText, isDark && styles.profileLocationTextDark]}>
                      {profile.location.city}
                    </Text>
                  </View>
                )}
                {profile.age && (
                  <View style={styles.profileLocationItem}>
                    <Ionicons name="calendar-outline" size={16} color="#72baa1" />
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
                <View style={[styles.profileLevelBadge, isDark && styles.profileLevelBadgeDark]}>
                  <Ionicons name="fitness" size={14} color="#72baa1" />
                  <Text style={[styles.profileLevelText, isDark && styles.profileLevelTextDark]}>
                    {profile.fitnessLevel === 'beginner' ? 'Debutant' :
                     profile.fitnessLevel === 'intermediate' ? 'Intermediaire' :
                     profile.fitnessLevel === 'advanced' ? 'Avance' :
                     profile.fitnessLevel === 'expert' ? 'Expert' :
                     profile.fitnessLevel}
                  </Text>
                </View>
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
                        color="#72baa1"
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
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Seances recentes</Text>
            {recentSessions.map(session => (
              <MiniWorkoutCard key={session._id} session={session} isDark={isDark} />
            ))}
          </>
        )}

        {recentSessions?.length === 0 && (
          <View style={styles.noSessionsContainer}>
            <Ionicons name="barbell-outline" size={40} color={isDark ? '#7a7a88' : '#a8a29e'} />
            <Text style={[styles.noSessionsText, isDark && styles.noSessionsTextDark]}>
              Aucune seance publique
            </Text>
          </View>
        )}

        {/* Defis */}
        <TouchableOpacity
          style={[styles.challengesNav, isDark && styles.challengesNavDark]}
          onPress={() => {
            try { navigation.navigate('Challenges'); } catch {}
          }}
          activeOpacity={0.8}
        >
          <View style={styles.challengesNavLeft}>
            <View style={[styles.challengesNavIcon, isDark && styles.challengesNavIconDark]}>
              <Ionicons name="flash" size={20} color="#72baa1" />
            </View>
            <View>
              <Text style={[styles.challengesNavTitle, isDark && styles.challengesNavTitleDark]}>Defis</Text>
              <Text style={[styles.challengesNavSub, isDark && styles.challengesNavSubDark]}>Voir tous mes defis</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#7a7a88' : '#a8a29e'} />
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
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  containerDark: { backgroundColor: '#0e0e11' },
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: '#1c1917', letterSpacing: -0.5 },
  topBarTitleDark: { color: '#f3f3f6' },

  scrollContent: { paddingBottom: 180 },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  profileCardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },

  profileBanner: {
    height: 100,
    backgroundColor: '#72baa1',
  },

  avatarWrap: {
    alignSelf: 'center',
    marginTop: -44,
    marginBottom: 12,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: '#efedea',
  },
  avatarWrapDark: {
    borderColor: '#18181d',
  },
  avatar: { width: 88, height: 88, borderRadius: 40 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#72baa1',
  },
  avatarPlaceholderText: { fontSize: 34, fontWeight: '800', color: '#FFF' },

  displayName: { fontSize: 22, fontWeight: '800', color: '#1c1917', textAlign: 'center', marginBottom: 4, letterSpacing: -0.5 },
  displayNameDark: { color: '#f3f3f6' },
  pseudo: { fontSize: 14, color: '#78716c', textAlign: 'center', marginBottom: 20 },
  pseudoDark: { color: '#c1c1cb' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 10,
    marginBottom: 20,
  },
  statsRowDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1c1917' },
  statValueDark: { color: '#f3f3f6' },
  statLabel: {
    fontSize: 10,
    color: '#78716c',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelDark: { color: '#c1c1cb' },
  statDivider: { width: 1, backgroundColor: '#efedea', marginVertical: 4 },
  statDividerDark: { backgroundColor: 'rgba(255,255,255,0.06)' },

  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  followButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#72baa1',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  followingButtonDark: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  followButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  followingButtonText: { color: '#1c1917' },
  followingButtonTextDark: { color: '#c1c1cb' },

  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#efedea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDark: {
    borderColor: 'rgba(255,255,255,0.06)',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#1c1917',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleDark: { color: '#f3f3f6' },

  miniCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  miniCardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  miniCardName: { fontSize: 15, fontWeight: '700', color: '#1c1917', marginBottom: 8 },
  miniCardNameDark: { color: '#f3f3f6' },
  miniCardStats: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatText: { fontSize: 13, color: '#78716c' },
  miniStatTextDark: { color: '#c1c1cb' },
  miniMuscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  miniMuscleTag: {
    backgroundColor: '#f5f5f4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  miniMuscleTagDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  miniMuscleText: { fontSize: 12, color: '#78716c' },
  miniMuscleTextDark: { color: '#c1c1cb' },
  miniCardDate: { fontSize: 12, color: '#a8a29e' },
  miniCardDateDark: { color: '#7a7a88' },

  noSessionsContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noSessionsText: { fontSize: 14, color: '#a8a29e' },
  noSessionsTextDark: { color: '#7a7a88' },

  challengesNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  challengesNavDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  challengesNavLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  challengesNavIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengesNavIconDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  challengesNavTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, color: '#1c1917', marginBottom: 2 },
  challengesNavTitleDark: { color: '#f3f3f6' },
  challengesNavSub: { fontSize: 12, color: '#78716c' },
  challengesNavSubDark: { color: '#c1c1cb' },

  // Profile info card (bio, location, level, workout types)
  profileInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  profileInfoCardDark: {
    backgroundColor: '#18181d',
    borderColor: 'rgba(255,255,255,0.06)',
  },

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
  profileLocationText: { fontSize: 14, color: '#78716c' },
  profileLocationTextDark: { color: '#c1c1cb' },

  profileLevelRow: { marginBottom: 16 },
  profileLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
    backgroundColor: '#f5f5f4',
  },
  profileLevelBadgeDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  profileLevelText: { fontSize: 13, fontWeight: '700', color: '#1c1917' },
  profileLevelTextDark: { color: '#f3f3f6' },

  profileBioSection: { marginBottom: 16 },
  profileInfoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileInfoSectionTitleDark: { color: '#f3f3f6' },
  profileBioText: { fontSize: 14, color: '#78716c', lineHeight: 21 },
  profileBioTextDark: { color: '#c1c1cb' },

  profileWorkoutSection: {},
  profileWorkoutTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileWorkoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  profileWorkoutChipDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  profileWorkoutChipText: {
    fontSize: 13,
    color: '#1c1917',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  profileWorkoutChipTextDark: { color: '#f3f3f6' },
});

// ─── Styles modaux ────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kavWrapper: { width: '100%' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    maxHeight: '90%',
  },
  sheetDark: {
    backgroundColor: '#18181d',
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#efedea',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  handleDark: { backgroundColor: 'rgba(255,255,255,0.06)' },

  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1c1917' },
  sheetTitleDark: { color: '#f3f3f6' },
  sheetSub: { fontSize: 14, color: '#a8a29e', marginBottom: 20 },
  sheetSubDark: { color: '#7a7a88' },

  successWrap: { alignItems: 'center', paddingVertical: 28 },
  successGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(114,186,161,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successGlowDark: {
    backgroundColor: 'rgba(114,186,161,0.15)',
  },
  successIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#72baa1',
  },
  successIconRingDark: {
    backgroundColor: '#18181d',
    borderColor: '#72baa1',
  },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#1c1917', marginBottom: 6, letterSpacing: -0.3 },
  successTitleDark: { color: '#f3f3f6' },
  successRecap: {
    width: '100%',
    backgroundColor: '#f5f5f4',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  successRecapDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  successRecapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successRecapLabel: { fontSize: 15, fontWeight: '700', color: '#1c1917', marginBottom: 2 },
  successRecapLabelDark: { color: '#f3f3f6' },
  successRecapDesc: { fontSize: 12, color: '#a8a29e' },
  successRecapDescDark: { color: '#7a7a88' },
  successSub: { fontSize: 13, color: '#a8a29e', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  successSubDark: { color: '#7a7a88' },
  successCloseBtn: {
    width: '100%',
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  successCloseBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#efedea',
  },
  errorBoxDark: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  errorText: { fontSize: 13, color: '#DC2626' },

  // Challenge options
  challengeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#efedea',
    backgroundColor: '#f5f5f4',
    position: 'relative',
    minHeight: 100,
  },
  challengeOptionDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  challengeOptionActive: {
    borderColor: '#72baa1',
    backgroundColor: 'rgba(114,186,161,0.08)',
  },
  challengeLabel: { fontSize: 13, fontWeight: '700', color: '#1c1917', marginBottom: 4 },
  challengeLabelDark: { color: '#f3f3f6' },
  challengeDesc: { fontSize: 11, color: '#78716c', lineHeight: 15 },
  challengeDescDark: { color: '#c1c1cb' },
  maxBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#72baa1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  maxBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },

  // Duration
  durationPicker: { marginBottom: 16 },
  durationLabel: { fontSize: 13, fontWeight: '600', color: '#78716c', marginBottom: 8 },
  durationLabelDark: { color: '#c1c1cb' },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#efedea',
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
  },
  durationBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  durationBtnActive: {
    borderColor: '#72baa1',
    backgroundColor: 'rgba(114,186,161,0.08)',
  },
  durationBtnText: { fontSize: 14, fontWeight: '700', color: '#78716c' },
  durationBtnTextDark: { color: '#c1c1cb' },
  durationBtnTextActive: { color: '#72baa1' },

  // Message
  textarea: {
    borderWidth: 1,
    borderColor: '#efedea',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 6,
    backgroundColor: '#fff',
    color: '#1c1917',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  textareaDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
    color: '#f3f3f6',
  },
  charCount: { fontSize: 11, color: '#a8a29e', textAlign: 'right', marginBottom: 16 },
  charCountDark: { color: '#7a7a88' },

  // Buttons
  primaryBtn: {
    backgroundColor: '#72baa1',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 15, color: '#78716c' },
  cancelTextDark: { color: '#c1c1cb' },
});
