import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

import { useProfileData } from '../../hooks/useProfileData';
import useHealthSync from '../../hooks/useHealthSync';
import logger from '../../services/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 110;
const RING_SIZE = AVATAR_SIZE + 12;

const ProgressRing = ({ progress, size = 50, strokeWidth = 4, color = '#72baa1' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e8e8e8"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

  const {
    loading,
    refreshing,
    uploadingPhoto,
    profile,
    avatarUrl,
    displayName,
    pseudo,
    isPremium,
    totalSessions,
    streak,
    totalXP,
    currentLevel,
    xpProgress,
    totalCalories,
    followStats,
    onRefresh,
    handleAvatarPress,
    handleLogout,
  } = useProfileData();

  // Health sync
  const { isInitialized: healthSyncReady, hasPermission: healthPermission, requestPermissions: requestHealthPermissions } = useHealthSync();

  useEffect(() => {
    const initHealthSync = async () => {
      if (healthSyncReady && !healthPermission) {
        const granted = await requestHealthPermissions();
        logger.app.debug('[Profile] Health permissions', { granted });
      }
    };
    initHealthSync();
  }, [healthSyncReady, healthPermission, requestHealthPermissions]);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const quickActions = [
    { icon: 'trophy-outline', label: 'Badges', desc: 'Débloque des badges et partage-les avec tes amis', screen: 'Badges', color: '#f0a47a' },
    { icon: 'flash-outline', label: 'Défis', desc: 'Lance des défis et gagne des XP', screen: 'Challenges', color: '#d4a96a' },
    { icon: 'gift-outline', label: 'Récompenses', desc: 'Échange tes XP contre des récompenses exclusives', screen: 'Rewards', color: '#c9a88c' },
    { icon: 'calculator-outline', label: 'Calculateurs', desc: 'IMC, calories, 1RM et plus', screen: 'Calculators', isExternal: true, color: '#72baa1' },
  ];

  const menuSections = [
    {
      title: 'Compte',
      items: [
        { icon: 'person', label: 'Modifier le profil', screen: 'EditProfile', color: '#72baa1' },
        { icon: 'star', label: isPremium ? 'Gerer Premium' : 'Passer Premium', screen: 'Subscription', color: '#d4a96a', badge: !isPremium ? 'PRO' : null },
        { icon: 'settings', label: 'Parametres', screen: 'Settings', color: '#78716c' },
        { icon: 'help-circle', label: 'Aide & Support', screen: 'Support', color: '#10B981' },
      ],
    },
  ];

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [345, 100],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#72baa1" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Flat Header */}
      <Animated.View style={[styles.headerFlat, isDark && styles.headerFlatDark, { height: headerHeight }]} />

      {/* Settings button */}
      <SafeAreaView edges={['top']} style={styles.headerActions} pointerEvents="box-none">
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={22} color="#78716c" />
        </TouchableOpacity>
      </SafeAreaView>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#72baa1" />
        }
      >
        {/* Avatar Section */}
        <Animated.View style={[styles.avatarSection, { transform: [{ scale: avatarScale }] }]}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.9} disabled={uploadingPhoto}>
            <View style={[styles.avatarRing, isDark && styles.avatarRingDark]}>
              <View style={[styles.avatarInner, isDark && styles.avatarInnerDark]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              {uploadingPhoto && (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color="#FFF" />
                </View>
              )}
            </View>
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>

          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color="#FFF" />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </Animated.View>

        {/* User Info */}
        <Animated.View style={[styles.userInfo, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.displayName, isDark && styles.textLight]}>{displayName}</Text>
          {pseudo ? <Text style={[styles.pseudo, isDark && styles.textSecondary]}>@{pseudo}</Text> : null}
        </Animated.View>

        {/* Social stats card */}
        <View style={[styles.socialCard, isDark && styles.cardDark]}>
          <View style={styles.socialStats}>
            <View style={styles.socialStat}>
              <Text style={[styles.socialStatValue, isDark && styles.textLight]}>{totalSessions}</Text>
              <Text style={[styles.socialStatLabel, isDark && styles.textMuted]}>Entraînements</Text>
            </View>
            <View style={[styles.socialStatDivider, isDark && styles.dividerDark]} />
            <TouchableOpacity
              style={styles.socialStat}
              onPress={() => navigation.navigate('FluxTab')}
              activeOpacity={0.7}
            >
              <Text style={[styles.socialStatValue, isDark && styles.textLight]}>
                {followStats?.followersCount || 0}
              </Text>
              <Text style={[styles.socialStatLabel, isDark && styles.textMuted]}>Abonnés</Text>
            </TouchableOpacity>
            <View style={[styles.socialStatDivider, isDark && styles.dividerDark]} />
            <TouchableOpacity
              style={styles.socialStat}
              onPress={() => navigation.navigate('FluxTab')}
              activeOpacity={0.7}
            >
              <Text style={[styles.socialStatValue, isDark && styles.textLight]}>
                {followStats?.followingCount || 0}
              </Text>
              <Text style={[styles.socialStatLabel, isDark && styles.textMuted]}>Abonnements</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.socialActions, isDark && styles.socialActionsDark]}>
            <TouchableOpacity
              style={styles.socialActionBtnPrimary}
              onPress={() => navigation.navigate('FluxTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialActionBtnPrimaryText}>Voir le flux</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialActionBtnIcon, isDark && styles.socialActionBtnIconDark]}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={18} color={isDark ? '#c1c1cb' : '#78716c'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialActionBtnIcon, isDark && styles.socialActionBtnIconDark]}
              onPress={() => {}}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={isDark ? '#c1c1cb' : '#78716c'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Level Card */}
        <View style={[styles.levelCard, isDark && styles.cardDark]}>
          <View style={styles.levelLeft}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{currentLevel}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelTitle, isDark && styles.textLight]}>Niveau {currentLevel}</Text>
              <Text style={[styles.xpText, isDark && styles.textMuted]}>{totalXP.toLocaleString()} XP</Text>
            </View>
          </View>
          <View style={styles.levelRight}>
            <ProgressRing progress={xpProgress} size={56} strokeWidth={5} />
            <Text style={styles.progressText}>{Math.round(xpProgress * 100)}%</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, isDark && styles.cardDark]}>
            <View style={styles.statContent}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(114,186,161,0.1)' }]}>
                <Ionicons name="barbell" size={22} color="#72baa1" />
              </View>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{totalSessions}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Seances</Text>
            </View>
          </View>
          <View style={[styles.statCard, isDark && styles.cardDark]}>
            <View style={styles.statContent}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Ionicons name="flame" size={22} color="#ef4444" />
              </View>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{streak}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Jours</Text>
            </View>
          </View>
          <View style={[styles.statCard, isDark && styles.cardDark]}>
            <View style={styles.statContent}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <Ionicons name="flash" size={22} color="#10b981" />
              </View>
              <Text style={[styles.statValue, isDark && styles.textLight]}>
                {totalCalories > 1000 ? `${(totalCalories / 1000).toFixed(1)}k` : totalCalories}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Calories</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Actions rapides</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.quickActionsScroll} contentContainerStyle={styles.quickActionsContent}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.screen}
              style={[styles.quickActionCard, isDark && styles.cardDark]}
              onPress={() => {
                if (action.isExternal) {
                  navigation.navigate('HomeTab', { screen: action.screen });
                } else {
                  navigation.navigate(action.screen);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}1A` }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <View style={styles.quickActionText}>
                <Text style={[styles.quickActionLabel, isDark && styles.textLight]}>{action.label}</Text>
                <Text style={[styles.quickActionDesc, isDark && styles.textMuted]}>{action.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#444' : '#d6d3d1'} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Matching Profile Card */}
        {profile && (
          <TouchableOpacity
            style={[styles.matchingCard, isDark && styles.cardDark]}
            onPress={() => navigation.navigate('ProfileSetup')}
            activeOpacity={0.8}
          >
            <View style={styles.matchingContent}>
              <View style={styles.matchingLeft}>
                <View style={[styles.matchingIconBox, { backgroundColor: profile.isVisible ? 'rgba(114,186,161,0.1)' : 'rgba(240,164,122,0.1)' }]}>
                  <Ionicons name="people" size={24} color={profile.isVisible ? '#72baa1' : '#f0a47a'} />
                </View>
                <View style={styles.matchingInfo}>
                  <Text style={[styles.matchingTitle, isDark && styles.textLight]}>Matching Sportif</Text>
                  <Text style={[styles.matchingDesc, isDark && styles.textMuted]}>
                    {profile.isVisible ? 'Profil actif - Pret a matcher' : 'Configurer pour trouver des partenaires'}
                  </Text>
                </View>
              </View>
              <View style={styles.matchingRight}>
                <View style={[styles.matchingStatus, { backgroundColor: profile.isVisible ? 'rgba(114,186,161,0.12)' : 'rgba(240,164,122,0.12)' }]}>
                  <Text style={[styles.matchingStatusText, { color: profile.isVisible ? '#72baa1' : '#f0a47a' }]}>{profile.isVisible ? 'ON' : 'OFF'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#444' : '#d6d3d1'} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>{section.title}</Text>
            <View style={[styles.menuCard, isDark && styles.cardDark]}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.screen}
                  style={[
                    styles.menuItem,
                    index < section.items.length - 1 && styles.menuItemBorder,
                    isDark && styles.menuItemBorderDark,
                  ]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}1A` }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, isDark && styles.textLight]}>{item.label}</Text>
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#444' : '#d6d3d1'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, isDark && styles.logoutBtnDark]} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  containerDark: { backgroundColor: '#0e0e11' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfbf9' },

  // Header
  headerFlat: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    backgroundColor: '#fcfbf9',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerFlatDark: {
    backgroundColor: '#0e0e11',
  },
  headerActions: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, zIndex: 10 },
  headerSpacer: { width: 40 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingTop: 100, paddingHorizontal: 20, paddingBottom: 180 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: '#efedea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingDark: {
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatarInner: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: '#fff', overflow: 'hidden' },
  avatarInnerDark: { backgroundColor: '#18181d' },
  avatar: { width: '100%', height: '100%', borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: AVATAR_SIZE / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#72baa1' },
  avatarText: { fontSize: 44, fontWeight: '700', color: '#FFF' },
  avatarLoading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RING_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  cameraBtn: { position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: 17, backgroundColor: '#72baa1', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },

  // Premium badge
  premiumBadge: {
    marginTop: 12,
    backgroundColor: '#72baa1',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  premiumText: { fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 1 },

  // User info
  userInfo: { alignItems: 'center', marginBottom: 24 },
  displayName: { fontSize: 22, fontWeight: '800', color: '#1c1917', letterSpacing: -0.5 },
  pseudo: { fontSize: 14, marginTop: 4, fontWeight: '500', color: '#78716c' },

  // Text helpers
  textLight: { color: '#f3f3f6' },
  textSecondary: { color: '#c1c1cb' },
  textMuted: { color: '#7a7a88' },

  // Card base (dark)
  cardDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },

  // Social card
  socialCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    marginBottom: 20,
    overflow: 'hidden',
  },
  socialStats: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  socialStat: { flex: 1, alignItems: 'center' },
  socialStatValue: { fontSize: 18, fontWeight: '800', color: '#1c1917' },
  socialStatLabel: { fontSize: 11, color: '#a8a29e', marginTop: 2 },
  socialStatDivider: { width: 1, backgroundColor: '#efedea', marginVertical: 4 },
  dividerDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  socialActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#efedea',
  },
  socialActionsDark: { borderTopColor: 'rgba(255,255,255,0.06)' },
  socialActionBtnPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#72baa1',
  },
  socialActionBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  socialActionBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efedea',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialActionBtnIconDark: { backgroundColor: '#18181d', borderColor: 'rgba(255,255,255,0.06)' },

  // Level card
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 16,
    marginBottom: 20,
  },
  levelLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#72baa1', alignItems: 'center', justifyContent: 'center' },
  levelNumber: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  levelInfo: { gap: 2 },
  levelTitle: { fontSize: 16, fontWeight: '600', color: '#1c1917' },
  xpText: { fontSize: 13, color: '#72baa1' },
  levelRight: { alignItems: 'center', justifyContent: 'center' },
  progressText: { position: 'absolute', fontSize: 12, fontWeight: '700', color: '#72baa1' },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  statContent: { alignItems: 'center', padding: 16 },
  statIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1c1917' },
  statLabel: { fontSize: 11, color: '#a8a29e', marginTop: 2 },

  // Section title
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1c1917', marginBottom: 14 },

  // Quick actions
  quickActionsScroll: { marginHorizontal: -20, marginBottom: 24, flexGrow: 0 },
  quickActionsContent: { paddingHorizontal: 20, gap: 10 },
  quickActionCard: {
    width: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efedea',
    padding: 14,
  },
  quickActionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickActionText: { flex: 1 },
  quickActionLabel: { fontSize: 14, fontWeight: '700', color: '#1c1917', marginBottom: 2 },
  quickActionDesc: { fontSize: 11, color: '#a8a29e', lineHeight: 15 },

  // Matching card
  matchingCard: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efedea',
  },
  matchingContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  matchingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  matchingIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  matchingInfo: { flex: 1 },
  matchingTitle: { fontSize: 15, fontWeight: '600', color: '#1c1917', marginBottom: 2 },
  matchingDesc: { fontSize: 12, color: '#a8a29e' },
  matchingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchingStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  matchingStatusText: { fontSize: 11, fontWeight: '700' },

  // Menu
  menuSection: { marginBottom: 20 },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efedea',
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#efedea' },
  menuItemBorderDark: { borderBottomColor: 'rgba(255,255,255,0.06)' },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1c1917' },
  menuBadge: { backgroundColor: 'rgba(212,169,106,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  menuBadgeText: { fontSize: 10, fontWeight: '700', color: '#d4a96a' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  logoutBtnDark: { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.15)' },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});
