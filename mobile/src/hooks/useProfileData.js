import { useState, useCallback } from 'react';
import { Alert, Platform, ActionSheetIOS } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import { endpoints } from '../api/endpoints';
import social from '../api/social';
import logger from '../services/logger';

/**
 * Hook centralisant la logique de données du ProfileScreen.
 * Gère le chargement profil, stats, abonnement, leaderboard et la gestion photo.
 */
export function useProfileData() {
  const { user, logout, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });

  // --- Chargement des données ---

  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, summaryRes, subRes, leaderboardRes, followStatsRes] = await Promise.all([
        apiClient.get(endpoints.profile.me).catch(() => ({ data: { profile: null } })),
        apiClient.get(endpoints.history.summary).catch(() => ({ data: null })),
        apiClient.get(endpoints.subscription.status).catch(() => ({ data: { tier: 'free' } })),
        apiClient.get(endpoints.leaderboard.status).catch(() => ({ data: { data: null } })),
        social.getStats().catch(() => ({ data: { followersCount: 0, followingCount: 0 } })),
      ]);

      setProfile(profileRes.data.profile);
      setStats(summaryRes.data);
      setSubscription(subRes.data);
      setLeaderboardData(leaderboardRes.data?.data);
      setFollowStats(followStatsRes.data || { followersCount: 0, followingCount: 0 });
    } catch (error) {
      logger.app.error('[Profile] Error loading data', error);
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

  // --- Gestion photo ---

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
      logger.app.error('[Profile] Upload photo error', error);
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
    } catch {
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

  const avatarUrl = user?.photo || null;

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

  // --- Logout ---

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

  // --- Données calculées ---

  const displayName = user?.prenom || user?.pseudo || profile?.prenom || 'Utilisateur';
  const pseudo = user?.pseudo || profile?.pseudo || '';
  const isPremium = user?.isPremium || subscription?.tier === 'premium' || user?.role === 'admin';

  const totalSessions = leaderboardData?.stats?.totalSessions || stats?.totalSessions || 0;
  const streak = leaderboardData?.stats?.currentStreak || stats?.streakDays || 0;
  const totalXP = leaderboardData?.xp || 0;
  const currentLevel = Math.floor(totalXP / 1000) + 1;
  const xpProgress = (totalXP % 1000) / 1000;
  const totalCalories = leaderboardData?.stats?.totalCaloriesBurned || 0;

  return {
    // État
    loading,
    refreshing,
    uploadingPhoto,

    // Données
    user,
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

    // Actions
    onRefresh,
    handleAvatarPress,
    handleLogout,
  };
}
