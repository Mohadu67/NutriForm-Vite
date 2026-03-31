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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { theme } from '../../theme';
import { useProfileData } from '../../hooks/useProfileData';
import useHealthSync from '../../hooks/useHealthSync';
import logger from '../../services/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 110;
const RING_SIZE = AVATAR_SIZE + 12;

const ProgressRing = ({ progress, size = 50, strokeWidth = 4, color = theme.colors.primary }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.2)"
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
    { icon: 'trophy-outline', label: 'Badges', screen: 'Badges', gradient: ['#F7B186', '#E89A6F'] },
    { icon: 'flash-outline', label: 'Défis', screen: 'Challenges', gradient: ['#FBBF24', '#F59E0B'] },
    { icon: 'gift-outline', label: 'Recompenses', screen: 'Rewards', gradient: ['#F9C4A3', '#F7B186'] },
    { icon: 'calculator-outline', label: 'Calculs', screen: 'Calculators', isExternal: true, gradient: ['#B8DDD1', '#A0C9BD'] },
  ];

  const menuSections = [
    {
      title: 'Compte',
      items: [
        { icon: 'person', label: 'Modifier le profil', screen: 'EditProfile', color: theme.colors.primary },
        { icon: 'star', label: isPremium ? 'Gerer Premium' : 'Passer Premium', screen: 'Subscription', color: '#F59E0B', badge: !isPremium ? 'PRO' : null },
        { icon: 'settings', label: 'Parametres', screen: 'Settings', color: '#6B7280' },
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Gradient Header */}
      <Animated.View style={[styles.headerGradient, { height: headerHeight }]}>
        <LinearGradient
          colors={isDark ? ['#2A1810', '#1A1A1A'] : ['#F9C4A3', '#F7B186', '#E89A6F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Settings button */}
      <SafeAreaView edges={['top']} style={styles.headerActions} pointerEvents="box-none">
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={[styles.headerBtn, isDark && styles.headerBtnDark]}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={24} color={isDark ? '#FFF' : theme.colors.primary} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Avatar Section */}
        <Animated.View style={[styles.avatarSection, { transform: [{ scale: avatarScale }] }]}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.9} disabled={uploadingPhoto}>
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={['#F7B186', '#E89A6F', '#F7B186']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRingGradient}
              />
              <View style={[styles.avatarInner, isDark && styles.avatarInnerDark]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <LinearGradient colors={['#F7B186', '#E89A6F']} style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
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
              <LinearGradient colors={['#F59E0B', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumGradient}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </LinearGradient>
            </View>
          )}
        </Animated.View>

        {/* User Info */}
        <Animated.View style={[styles.userInfo, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.displayName, isDark && styles.textLight]}>{displayName}</Text>
          {pseudo ? <Text style={styles.pseudo}>@{pseudo}</Text> : null}
        </Animated.View>

        {/* Social stats card */}
        <View style={[styles.socialCard, isDark && styles.cardDark]}>
          <View style={styles.socialStats}>
            <View style={styles.socialStat}>
              <Text style={[styles.socialStatValue, isDark && styles.textLight]}>{totalSessions}</Text>
              <Text style={[styles.socialStatLabel, isDark && styles.textMuted]}>Entraînements</Text>
            </View>
            <View style={[styles.socialStatDivider, isDark && { backgroundColor: '#2A2E36' }]} />
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
            <View style={[styles.socialStatDivider, isDark && { backgroundColor: '#2A2E36' }]} />
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
          <View style={[styles.socialActions, isDark && { borderTopColor: '#2A2E36' }]}>
            <TouchableOpacity
              style={[styles.socialActionBtn, styles.socialActionBtnPrimary]}
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
              <Ionicons name="pencil" size={18} color={isDark ? '#CCC' : '#555'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialActionBtnIcon, { backgroundColor: `${theme.colors.primary}18` }]}
              onPress={() => {}}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={theme.colors.primary} />
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
            <LinearGradient colors={['rgba(247,177,134,0.15)', 'rgba(247,177,134,0.05)']} style={styles.statGradient}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(247,177,134,0.2)' }]}>
                <Ionicons name="barbell" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{totalSessions}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Seances</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCard, isDark && styles.cardDark]}>
            <LinearGradient colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)']} style={styles.statGradient}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                <Ionicons name="flame" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{streak}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Jours</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCard, isDark && styles.cardDark]}>
            <LinearGradient colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']} style={styles.statGradient}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                <Ionicons name="flash" size={22} color="#10B981" />
              </View>
              <Text style={[styles.statValue, isDark && styles.textLight]}>
                {totalCalories > 1000 ? `${(totalCalories / 1000).toFixed(1)}k` : totalCalories}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Calories</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
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
              <LinearGradient colors={action.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={24} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.quickActionLabel, isDark && styles.textLight]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Matching Profile Card */}
        {profile && (
          <TouchableOpacity
            style={[styles.matchingCard, isDark && styles.cardDark]}
            onPress={() => navigation.navigate('ProfileSetup')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={profile.isVisible ? ['#10B98115', '#10B98105'] : ['#F5970015', '#F5970005']}
              style={styles.matchingGradient}
            >
              <View style={styles.matchingLeft}>
                <View style={[styles.matchingIconBox, { backgroundColor: profile.isVisible ? '#10B98120' : '#F5970020' }]}>
                  <Ionicons name="people" size={24} color={profile.isVisible ? '#10B981' : '#F59700'} />
                </View>
                <View style={styles.matchingInfo}>
                  <Text style={[styles.matchingTitle, isDark && styles.textLight]}>Matching Sportif</Text>
                  <Text style={[styles.matchingDesc, isDark && styles.textMuted]}>
                    {profile.isVisible ? 'Profil actif - Pret a matcher' : 'Configurer pour trouver des partenaires'}
                  </Text>
                </View>
              </View>
              <View style={styles.matchingRight}>
                <View style={[styles.matchingStatus, { backgroundColor: profile.isVisible ? '#10B981' : '#F59700' }]}>
                  <Text style={styles.matchingStatusText}>{profile.isVisible ? 'ON' : 'OFF'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
              </View>
            </LinearGradient>
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
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, isDark && styles.textLight]}>{item.label}</Text>
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, isDark && styles.logoutBtnDark]} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  containerDark: { backgroundColor: '#12151A' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  headerActions: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, zIndex: 10 },
  headerSpacer: { width: 40 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerBtnDark: { backgroundColor: '#2A2A2A' },
  scrollContent: { paddingTop: 100, paddingHorizontal: 20, paddingBottom: 180 },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarRing: { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, padding: 4, alignItems: 'center', justifyContent: 'center' },
  avatarRingGradient: { ...StyleSheet.absoluteFillObject, borderRadius: RING_SIZE / 2 },
  avatarInner: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: '#FFF', padding: 3, overflow: 'hidden' },
  avatarInnerDark: { backgroundColor: '#1A1D24' },
  avatar: { width: '100%', height: '100%', borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: AVATAR_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 44, fontWeight: '700', color: '#FFF' },
  avatarLoading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RING_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  cameraBtn: { position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  premiumBadge: { marginTop: 12, borderRadius: 20, overflow: 'hidden' },
  premiumGradient: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 14 },
  premiumText: { fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 1 },
  userInfo: { alignItems: 'center', marginBottom: 24 },
  displayName: { fontSize: 26, fontWeight: '700', color: '#1A1A1A' },
  textLight: { color: '#FFFFFF' },
  pseudo: { fontSize: 15, marginTop: 4, fontWeight: '500', color: 'black' },
  socialCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  socialStats: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  socialStat: { flex: 1, alignItems: 'center' },
  socialStatValue: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  socialStatLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  socialStatDivider: { width: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
  socialActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  socialActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 22,
  },
  socialActionBtnPrimary: { backgroundColor: `${theme.colors.primary}18` },
  socialActionBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  socialActionBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialActionBtnIconDark: { backgroundColor: '#2A2E36' },
  levelCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardDark: { backgroundColor: '#1A1D24' },
  levelLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  levelNumber: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  levelInfo: { gap: 2 },
  levelTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  xpText: { fontSize: 13, color: '#666' },
  textMuted: { color: '#8A8E96' },
  levelRight: { alignItems: 'center', justifyContent: 'center' },
  progressText: { position: 'absolute', fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statGradient: { alignItems: 'center', padding: 16 },
  statIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 14 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  quickActionCard: { width: (SCREEN_WIDTH - 52) / 4, backgroundColor: '#FFF', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
  matchingCard: { borderRadius: 16, marginBottom: 24, overflow: 'hidden', backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  matchingGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  matchingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  matchingIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  matchingInfo: { flex: 1 },
  matchingTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  matchingDesc: { fontSize: 12, color: '#666' },
  matchingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchingStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  matchingStatusText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  menuSection: { marginBottom: 20 },
  menuCard: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemBorderDark: { borderBottomColor: '#2A2E36' },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  menuBadge: { backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  menuBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16, marginBottom: 20 },
  logoutBtnDark: { backgroundColor: 'rgba(239,68,68,0.15)' },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});
