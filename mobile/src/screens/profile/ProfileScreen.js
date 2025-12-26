import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

/**
 * ProfileScreen - Ecran profil utilisateur
 * Affiche les informations du profil, stats et options
 */
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [subscription, setSubscription] = useState(null);

  // Charger les donnees du profil
  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, summaryRes, subRes] = await Promise.all([
        apiClient.get(endpoints.profile.me).catch(() => ({ data: { profile: null } })),
        apiClient.get(endpoints.history.summary).catch(() => ({ data: null })),
        apiClient.get(endpoints.subscription.status).catch(() => ({ data: { tier: 'free' } })),
      ]);

      setProfile(profileRes.data.profile); // Le backend retourne { profile: {...} }
      setStats(summaryRes.data);
      setSubscription(subRes.data);
    } catch (error) {
      console.error('[PROFILE] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recharger le profil quand on revient sur l'écran
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
        {
          text: 'Deconnexion',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  }, [logout]);

  // Nom affiche
  const displayName = user?.prenom || user?.pseudo || profile?.prenom || profile?.pseudo || 'Utilisateur';
  const email = user?.email || profile?.email || '';
  const pseudo = user?.pseudo || profile?.pseudo || '';
  const avatarUrl = user?.photo || null;
  const isPremium = subscription?.tier === 'premium';

  // Stats calculees
  const totalSessions = stats?.totalSessions || 0;
  const streak = stats?.streakDays || 0;
  const totalHours = Math.floor((stats?.avgWorkoutDurationMin || 0) * totalSessions / 60);

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Modifier le profil',
      screen: 'EditProfile',
      color: theme.colors.primary,
    },
    {
      icon: 'settings-outline',
      label: 'Parametres',
      screen: 'Settings',
      color: '#6B7280',
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      screen: 'Notifications',
      color: '#3B82F6',
    },
    {
      icon: 'star-outline',
      label: isPremium ? 'Gerer l\'abonnement' : 'Passer Premium',
      screen: 'Subscription',
      color: '#F59E0B',
    },
    {
      icon: 'gift-outline',
      label: 'Recompenses',
      screen: 'Rewards',
      color: '#EC4899',
    },
    {
      icon: 'help-circle-outline',
      label: 'Aide & Support',
      screen: 'Support',
      color: '#10B981',
    },
  ];

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header Profile */}
        <View style={[styles.profileHeader, isDark && styles.profileHeaderDark]}>
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Nom et info */}
          <Text style={[styles.displayName, isDark && styles.displayNameDark]}>
            {displayName}
          </Text>
          {pseudo && (
            <Text style={[styles.pseudo, isDark && styles.pseudoDark]}>
              @{pseudo}
            </Text>
          )}
          {email && (
            <Text style={[styles.email, isDark && styles.emailDark]}>
              {email}
            </Text>
          )}

          {/* Badge Premium */}
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>

        {/* Stats rapides */}
        <View style={[styles.statsCard, isDark && styles.statsCardDark]}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="barbell" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {totalSessions}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
              Seances
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="flame" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {streak}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
              Serie
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {totalHours}h
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>
              Total
            </Text>
          </View>
        </View>

        {/* Informations du profil */}
        {profile && (
          <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
            <View style={styles.infoHeader}>
              <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoTitle, isDark && styles.textDark]}>
                Informations du profil
              </Text>
            </View>

            {profile.bio && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Bio</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  {profile.bio}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              {profile.age && (
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Age</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>
                    {profile.age} ans
                  </Text>
                </View>
              )}

              {profile.fitnessLevel && (
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Niveau</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>
                    {profile.fitnessLevel === 'beginner' ? 'Débutant' :
                     profile.fitnessLevel === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                  </Text>
                </View>
              )}
            </View>

            {profile.location?.city && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Localisation</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>
                    {profile.location.city}
                    {profile.location.postalCode && ` (${profile.location.postalCode})`}
                  </Text>
                </View>
              </View>
            )}

            {profile.workoutTypes && profile.workoutTypes.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                  Types d'entraînement
                </Text>
                <View style={styles.tagsContainer}>
                  {profile.workoutTypes.map((type, index) => (
                    <View
                      key={index}
                      style={[styles.tag, { backgroundColor: `${theme.colors.primary}20` }]}
                    >
                      <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                        {type}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.infoSection}>
              <View style={styles.switchInfo}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                  Matching activé
                </Text>
                <View style={styles.statusBadge}>
                  <Ionicons
                    name={profile?.isVisible ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={profile?.isVisible ? "#22C55E" : "#EF4444"}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: profile?.isVisible ? "#22C55E" : "#EF4444" }
                    ]}
                  >
                    {profile?.isVisible ? 'Activé' : 'Désactivé'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Menu Options */}
        <View style={[styles.menuCard, isDark && styles.menuCardDark]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.screen}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
                isDark && styles.menuItemBorderDark,
              ]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, isDark && styles.menuLabelDark]}>
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? '#555' : '#CCC'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton Deconnexion */}
        <TouchableOpacity
          style={[styles.logoutButton, isDark && styles.logoutButtonDark]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, isDark && styles.versionDark]}>
          Version 1.0.0
        </Text>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeaderDark: {
    backgroundColor: '#2A2A2A',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  displayName: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  displayNameDark: {
    color: '#FFFFFF',
  },
  pseudo: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginTop: 4,
  },
  pseudoDark: {
    color: theme.colors.primary,
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  emailDark: {
    color: '#888888',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.md,
    backgroundColor: '#FEF3C7',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  premiumText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: '#92400E',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsCardDark: {
    backgroundColor: '#2A2A2A',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  statValueDark: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statLabelDark: {
    color: '#888888',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: theme.spacing.md,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuCardDark: {
    backgroundColor: '#2A2A2A',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemBorderDark: {
    borderBottomColor: '#333333',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  menuLabelDark: {
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  logoutButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  versionDark: {
    color: '#666666',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardDark: {
    backgroundColor: '#2A2A2A',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#888888',
  },
  infoSection: {
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  tagText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});
