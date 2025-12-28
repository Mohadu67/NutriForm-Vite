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
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

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
  const { user, logout, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Avatar URL - doit etre defini avant les callbacks
  const avatarUrl = user?.photo || null;

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

  // Uploader la photo de profil
  const uploadPhoto = useCallback(async (imageUri) => {
    try {
      setUploadingPhoto(true);

      // Creer le FormData
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: imageUri,
        name: filename || 'photo.jpg',
        type,
      });

      const response = await apiClient.post(endpoints.upload.profilePhoto, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Le backend renvoie 'photo' pas 'photoUrl'
      const photoUrl = response.data?.photo || response.data?.photoUrl;
      if (photoUrl) {
        // Mettre à jour le user dans le contexte
        if (updateUser) {
          updateUser({ photo: photoUrl });
        }
        Alert.alert('Succès', 'Photo de profil mise à jour');
      }
    } catch (error) {
      console.error('[PROFILE] Upload photo error:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo de profil');
    } finally {
      setUploadingPhoto(false);
    }
  }, [updateUser]);

  // Supprimer la photo de profil
  const deletePhoto = useCallback(async () => {
    try {
      setUploadingPhoto(true);
      await apiClient.delete(endpoints.upload.profilePhoto);

      if (updateUser) {
        updateUser({ photo: null });
      }
      Alert.alert('Succes', 'Photo de profil supprimée');
    } catch (error) {
      console.error('[PROFILE] Delete photo error:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la photo de profil');
    } finally {
      setUploadingPhoto(false);
    }
  }, [updateUser]);

  // Prendre une photo avec la camera
  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission d\'accéder à la caméra');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  }, [uploadPhoto]);

  // Choisir une photo depuis la galerie
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission d\'accéder à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  }, [uploadPhoto]);

  // Gerer le clic sur l'avatar
  const handleAvatarPress = useCallback(() => {
    const hasPhoto = !!avatarUrl;

    if (Platform.OS === 'ios') {
      const options = hasPhoto
        ? ['Annuler', 'Prendre une photo', 'Choisir depuis la galerie', 'Supprimer la photo']
        : ['Annuler', 'Prendre une photo', 'Choisir depuis la galerie'];
      const destructiveButtonIndex = hasPhoto ? 3 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          else if (buttonIndex === 2) pickImage();
          else if (buttonIndex === 3 && hasPhoto) deletePhoto();
        }
      );
    } else {
      // Android: utiliser Alert comme ActionSheet
      const buttons = [
        { text: 'Prendre une photo', onPress: takePhoto },
        { text: 'Choisir depuis la galerie', onPress: pickImage },
      ];

      if (hasPhoto) {
        buttons.push({
          text: 'Supprimer la photo',
          style: 'destructive',
          onPress: deletePhoto,
        });
      }

      buttons.push({ text: 'Annuler', style: 'cancel' });

      Alert.alert('Photo de profil', 'Choisissez une option', buttons);
    }
  }, [avatarUrl, takePhoto, pickImage, deletePhoto]);

  // Nom affiche
  const displayName = user?.prenom || user?.pseudo || profile?.prenom || profile?.pseudo || 'Utilisateur';
  const email = user?.email || profile?.email || '';
  const pseudo = user?.pseudo || profile?.pseudo || '';
  const isPremium = user?.isPremium || user?.subscriptionTier === 'premium' || subscription?.tier === 'premium' || user?.role === 'admin';

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
            onPress={handleAvatarPress}
            activeOpacity={0.8}
            disabled={uploadingPhoto}
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
            {uploadingPhoto ? (
              <View style={styles.avatarBadgeLoading}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            )}
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

        {/* SECTION 1: PROFIL DE BASE */}
        {profile && (
          <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                  Profil de base
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileSetup')}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {profile.bio ? (
              <View style={styles.infoSection}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Bio</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  {profile.bio}
                </Text>
              </View>
            ) : (
              <View style={styles.infoSection}>
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  Aucune bio renseignée
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Âge</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  {profile.age ? `${profile.age} ans` : 'Non renseigné'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Niveau</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  {profile.fitnessLevel === 'beginner' ? 'Débutant' :
                   profile.fitnessLevel === 'intermediate' ? 'Intermédiaire' :
                   profile.fitnessLevel === 'advanced' ? 'Avancé' : 'Non défini'}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                Types d'entraînement
              </Text>
              {profile.workoutTypes && profile.workoutTypes.length > 0 ? (
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
              ) : (
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  Aucun type sélectionné
                </Text>
              )}
            </View>

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

        {/* SECTION 2: LOCALISATION */}
        {profile && (
          <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                  Localisation
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileSetup')}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {profile.location?.city || profile.location?.postalCode ? (
              <>
                {profile.location.city && (
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Ville</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={16} color={isDark ? '#888' : '#666'} />
                      <Text style={[styles.infoValue, isDark && styles.textDark]}>
                        {profile.location.city}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.location.postalCode && (
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Code postal</Text>
                    <Text style={[styles.infoValue, isDark && styles.textDark]}>
                      {profile.location.postalCode}
                    </Text>
                  </View>
                )}

                {profile.location.coordinates && profile.location.coordinates.length === 2 && (
                  <View style={[styles.locationInfo, isDark && styles.locationInfoDark]}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                    <Text style={[styles.locationInfoText, isDark && styles.textDark]}>
                      Position GPS enregistrée
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.infoSection}>
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  Aucune localisation renseignée
                </Text>
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: DISPONIBILITÉS */}
        {profile && (
          <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                  Disponibilités
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileSetup')}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {profile.availability && Object.keys(profile.availability).some(day => profile.availability[day]?.length > 0) ? (
              <View style={styles.availabilityContainer}>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const dayLabels = {
                    monday: 'Lundi',
                    tuesday: 'Mardi',
                    wednesday: 'Mercredi',
                    thursday: 'Jeudi',
                    friday: 'Vendredi',
                    saturday: 'Samedi',
                    sunday: 'Dimanche',
                  };

                  const slots = profile.availability[day] || [];
                  if (slots.length === 0) return null;

                  return (
                    <View key={day} style={styles.dayAvailability}>
                      <Text style={[styles.dayLabel, isDark && styles.textDark]}>
                        {dayLabels[day]}
                      </Text>
                      <View style={styles.slotsDisplay}>
                        {slots.map((slot, index) => (
                          <View key={index} style={[styles.slotBadge, isDark && styles.slotBadgeDark]}>
                            <Text style={[styles.slotBadgeText, isDark && styles.textDark]}>
                              {slot.start} - {slot.end}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.infoSection}>
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  Aucune disponibilité renseignée
                </Text>
              </View>
            )}
          </View>
        )}

        {/* SECTION 4: PRÉFÉRENCES DE MATCHING */}
        {profile && (
          <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="heart-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                  Préférences de matching
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileSetup')}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {profile.matchPreferences ? (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Distance max</Text>
                    <Text style={[styles.infoValue, isDark && styles.textDark]}>
                      {profile.matchPreferences.maxDistance || 10} km
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Tranche d'âge</Text>
                    <Text style={[styles.infoValue, isDark && styles.textDark]}>
                      {profile.matchPreferences.preferredAgeRange?.min || 18} - {profile.matchPreferences.preferredAgeRange?.max || 99} ans
                    </Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                    Niveaux préférés
                  </Text>
                  {profile.matchPreferences.preferredFitnessLevels && profile.matchPreferences.preferredFitnessLevels.length > 0 ? (
                    <View style={styles.tagsContainer}>
                      {profile.matchPreferences.preferredFitnessLevels.map((level, index) => (
                        <View
                          key={index}
                          style={[styles.tag, { backgroundColor: `${theme.colors.primary}20` }]}
                        >
                          <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                            {level === 'beginner' ? 'Débutant' : level === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                      Tous les niveaux
                    </Text>
                  )}
                </View>

                <View style={styles.infoSection}>
                  <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                    Types d'entraînement préférés
                  </Text>
                  {profile.matchPreferences.preferredWorkoutTypes && profile.matchPreferences.preferredWorkoutTypes.length > 0 ? (
                    <View style={styles.tagsContainer}>
                      {profile.matchPreferences.preferredWorkoutTypes.map((type, index) => (
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
                  ) : (
                    <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                      Tous les types
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.infoSection}>
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                  Aucune préférence renseignée
                </Text>
              </View>
            )}
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
  avatarBadgeLoading: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    fontWeight: theme.fontWeight.semiBold,
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
    fontWeight: theme.fontWeight.semiBold,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  editButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary}10`,
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
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  availabilityContainer: {
    gap: theme.spacing.md,
  },
  dayAvailability: {
    marginBottom: theme.spacing.sm,
  },
  dayLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  slotsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  slotBadge: {
    backgroundColor: `${theme.colors.primary}15`,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  slotBadgeDark: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: `${theme.colors.primary}40`,
  },
  slotBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#F0FDF4',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  locationInfoDark: {
    backgroundColor: '#1A3A2A',
  },
  locationInfoText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: '#22C55E',
  },
});
