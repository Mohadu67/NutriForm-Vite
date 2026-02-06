import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle } from 'react-native-svg';

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';
import useHealthSync from '../../hooks/useHealthSync';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 110;
const RING_SIZE = AVATAR_SIZE + 12;

// Composant Progress Ring pour les XP
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

/**
 * ProfileScreen - Ecran profil utilisateur
 * Design moderne avec gradient header et animations
 */
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Health sync hook
  const { isInitialized: healthSyncReady, hasPermission: healthPermission, syncNow, requestPermissions: requestHealthPermissions } = useHealthSync();

  // Avatar URL
  const avatarUrl = user?.photo || null;

  // Animation d'entree
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

  // Initialize health sync and check permissions
  useEffect(() => {
    const initHealthSync = async () => {
      if (healthSyncReady && !healthPermission) {
        // Permissions not granted - optionally request them
        console.log('[PROFILE] Health permissions not granted, requesting...');
        const granted = await requestHealthPermissions();
        if (granted) {
          console.log('[PROFILE] Health permissions granted');
        } else {
          console.log('[PROFILE] Health permissions denied');
        }
      } else if (healthSyncReady && healthPermission) {
        console.log('[PROFILE] Health sync ready with permissions');
      }
    };
    initHealthSync();
  }, [healthSyncReady, healthPermission, requestHealthPermissions]);

  // Charger les donnees du profil
  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, summaryRes, subRes, leaderboardRes] = await Promise.all([
        apiClient.get(endpoints.profile.me).catch(() => ({ data: { profile: null } })),
        apiClient.get(endpoints.history.summary).catch(() => ({ data: null })),
        apiClient.get(endpoints.subscription.status).catch(() => ({ data: { tier: 'free' } })),
        apiClient.get(endpoints.leaderboard.status).catch(() => ({ data: { data: null } })),
      ]);

      setProfile(profileRes.data.profile);
      setStats(summaryRes.data);
      setSubscription(subRes.data);
      setLeaderboardData(leaderboardRes.data?.data);
    } catch (error) {
      console.error('[PROFILE] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Deconnexion', style: 'destructive', onPress: () => logout() },
      ]
    );
  }, [logout]);

  // Upload photo handlers
  const uploadPhoto = useCallback(async (imageUri) => {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', { uri: imageUri, name: filename || 'photo.jpg', type });

      const response = await apiClient.post(endpoints.upload.profilePhoto, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const photoUrl = response.data?.photo || response.data?.photoUrl;
      if (photoUrl && updateUser) {
        updateUser({ photo: photoUrl });
        Alert.alert('Succes', 'Photo de profil mise a jour');
      }
    } catch (error) {
      console.error('[PROFILE] Upload photo error:', error);
      Alert.alert('Erreur', 'Impossible de mettre a jour la photo');
    } finally {
      setUploadingPhoto(false);
    }
  }, [updateUser]);

  const deletePhoto = useCallback(async () => {
    try {
      setUploadingPhoto(true);
      await apiClient.delete(endpoints.upload.profilePhoto);
      if (updateUser) updateUser({ photo: null });
      Alert.alert('Succes', 'Photo supprimee');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer la photo');
    } finally {
      setUploadingPhoto(false);
    }
  }, [updateUser]);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Acces camera requis');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  }, [uploadPhoto]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Acces galerie requis');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  }, [uploadPhoto]);

  const handleAvatarPress = useCallback(() => {
    const hasPhoto = !!avatarUrl;
    if (Platform.OS === 'ios') {
      const options = hasPhoto
        ? ['Annuler', 'Prendre une photo', 'Galerie', 'Supprimer']
        : ['Annuler', 'Prendre une photo', 'Galerie'];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0, destructiveButtonIndex: hasPhoto ? 3 : undefined },
        (index) => {
          if (index === 1) takePhoto();
          else if (index === 2) pickImage();
          else if (index === 3 && hasPhoto) deletePhoto();
        }
      );
    } else {
      const buttons = [
        { text: 'Prendre une photo', onPress: takePhoto },
        { text: 'Galerie', onPress: pickImage },
      ];
      if (hasPhoto) buttons.push({ text: 'Supprimer', style: 'destructive', onPress: deletePhoto });
      buttons.push({ text: 'Annuler', style: 'cancel' });
      Alert.alert('Photo de profil', '', buttons);
    }
  }, [avatarUrl, takePhoto, pickImage, deletePhoto]);

  // Donnees calculees
  const displayName = user?.prenom || user?.pseudo || profile?.prenom || 'Utilisateur';
  const pseudo = user?.pseudo || profile?.pseudo || '';
  const isPremium = user?.isPremium || subscription?.tier === 'premium' || user?.role === 'admin';

  const totalSessions = leaderboardData?.stats?.totalSessions || stats?.totalSessions || 0;
  const streak = leaderboardData?.stats?.currentStreak || stats?.streakDays || 0;
  const totalXP = leaderboardData?.xp || 0;
  const league = leaderboardData?.league || 'starter';
  const currentLevel = Math.floor(totalXP / 1000) + 1;
  const xpForNextLevel = 1000;
  const xpProgress = (totalXP % 1000) / xpForNextLevel;
  // Use ONLY phone health data (DailyHealthData from leaderboard)
  // Do NOT fallback to stats.totalCaloriesBurned (old WorkoutSession calories)
  const totalCalories = leaderboardData?.stats?.totalCaloriesBurned || 0;

  // Quick Actions - actions rapides en haut
  const quickActions = [
    { icon: 'trophy-outline', label: 'Badges', screen: 'Badges', gradient: ['#667eea', '#764ba2'] },
    { icon: 'notifications-outline', label: 'Alertes', screen: 'Notifications', isExternal: true, gradient: ['#ee0979', '#ff6a00'] },
    { icon: 'gift-outline', label: 'Recompenses', screen: 'Rewards', gradient: ['#f7971e', '#ffd200'] },
    { icon: 'calculator-outline', label: 'Calculs', screen: 'Calculators', isExternal: true, gradient: ['#11998e', '#38ef7d'] },
  ];

  // Menu items
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

  // Header animation
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Avatar Section */}
        <Animated.View style={[styles.avatarSection, { transform: [{ scale: avatarScale }] }]}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            activeOpacity={0.9}
            disabled={uploadingPhoto}
          >
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
                  <LinearGradient
                    colors={['#F7B186', '#E89A6F']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
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

          {/* Premium Badge */}
          {isPremium && (
            <View style={styles.premiumBadge}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumGradient}
              >
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </LinearGradient>
            </View>
          )}
        </Animated.View>

        {/* User Info */}
        <Animated.View style={[styles.userInfo, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.displayName, isDark && styles.textLight]}>{displayName}</Text>
          {pseudo && <Text style={styles.pseudo}>@{pseudo}</Text>}
        </Animated.View>

        {/* Level Card */}
        <View style={[styles.levelCard, isDark && styles.cardDark]}>
          <View style={styles.levelLeft}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{currentLevel}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelTitle, isDark && styles.textLight]}>Niveau {currentLevel}</Text>
              <Text style={[styles.xpText, isDark && styles.textMuted]}>
                {totalXP.toLocaleString()} XP
              </Text>
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
            <LinearGradient
              colors={['rgba(247,177,134,0.15)', 'rgba(247,177,134,0.05)']}
              style={styles.statGradient}
            >
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(247,177,134,0.2)' }]}>
                <Ionicons name="barbell" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{totalSessions}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Seances</Text>
            </LinearGradient>
          </View>

          <View style={[styles.statCard, isDark && styles.cardDark]}>
            <LinearGradient
              colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)']}
              style={styles.statGradient}
            >
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                <Ionicons name="flame" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.statValue, isDark && styles.textLight]}>{streak}</Text>
              <Text style={[styles.statLabel, isDark && styles.textMuted]}>Jours</Text>
            </LinearGradient>
          </View>

          <View style={[styles.statCard, isDark && styles.cardDark]}>
            <LinearGradient
              colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']}
              style={styles.statGradient}
            >
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
              <LinearGradient
                colors={action.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionIcon}
              >
                <Ionicons name={action.icon} size={24} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.quickActionLabel, isDark && styles.textLight]}>
                {action.label}
              </Text>
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
                <View style={[
                  styles.matchingIconBox,
                  { backgroundColor: profile.isVisible ? '#10B98120' : '#F5970020' }
                ]}>
                  <Ionicons
                    name="people"
                    size={24}
                    color={profile.isVisible ? '#10B981' : '#F59700'}
                  />
                </View>
                <View style={styles.matchingInfo}>
                  <Text style={[styles.matchingTitle, isDark && styles.textLight]}>
                    Matching Sportif
                  </Text>
                  <Text style={[styles.matchingDesc, isDark && styles.textMuted]}>
                    {profile.isVisible
                      ? 'Profil actif - Pret a matcher'
                      : 'Configurer pour trouver des partenaires'}
                  </Text>
                </View>
              </View>
              <View style={styles.matchingRight}>
                <View style={[
                  styles.matchingStatus,
                  { backgroundColor: profile.isVisible ? '#10B981' : '#F59700' }
                ]}>
                  <Text style={styles.matchingStatusText}>
                    {profile.isVisible ? 'ON' : 'OFF'}
                  </Text>
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

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, isDark && styles.logoutBtnDark]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>

        {/* Footer Gradient Card */}
        <View style={styles.footerGradient}>
          <LinearGradient
            colors={isDark ? ['#2A1810', '#1A1A1A'] : ['#E89A6F', '#F7B186', '#F9C4A3']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Harmonith v1.0.0
            </Text>
            <Text style={styles.footerSubtext}>
              Fait avec passion
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#12151A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },

  // Header
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 10,
  },
  headerSpacer: {
    width: 40,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBtnDark: {
    backgroundColor: '#2A2A2A',
  },

  // Scroll Content
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING_SIZE / 2,
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#FFF',
    padding: 3,
    overflow: 'hidden',
  },
  avatarInnerDark: {
    backgroundColor: '#1A1D24',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFF',
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  premiumBadge: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },

  // User Info
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  displayName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  textLight: {
    color: '#FFFFFF',
  },
  pseudo: {
    fontSize: 15,
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },

  // Level Card
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: '#1A1D24',
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  levelInfo: {
    gap: 2,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  xpText: {
    fontSize: 13,
    color: '#666',
  },
  textMuted: {
    color: '#8A8E96',
  },
  levelRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statGradient: {
    alignItems: 'center',
    padding: 16,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Quick Actions
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 52) / 4,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },

  // Matching Card
  matchingCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  matchingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  matchingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  matchingIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchingInfo: {
    flex: 1,
  },
  matchingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  matchingDesc: {
    fontSize: 12,
    color: '#666',
  },
  matchingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchingStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },

  // Menu
  menuSection: {
    marginBottom: 20,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemBorderDark: {
    borderBottomColor: '#2A2E36',
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  menuBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  logoutBtnDark: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Footer
  footerGradient: {
    height: 120,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: 20,
    marginHorizontal: -20,
  },
  footerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 4,
  },
});
