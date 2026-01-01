import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

const AVATAR_SIZE = 100;

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form fields
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [pseudo, setPseudo] = useState(user?.pseudo || '');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');

  // Avatar
  const avatarUrl = user?.photo || null;

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(endpoints.profile.me);
        const profile = response.data?.profile;
        if (profile) {
          setBio(profile.bio || '');
          setAge(profile.age ? String(profile.age) : '');
          if (profile.prenom) setPrenom(profile.prenom);
          if (profile.pseudo) setPseudo(profile.pseudo);
        }
      } catch (error) {
        console.error('[EDIT_PROFILE] Load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Save profile
  const handleSave = useCallback(async () => {
    if (!prenom.trim()) {
      Alert.alert('Erreur', 'Le prenom est requis');
      return;
    }
    if (!pseudo.trim()) {
      Alert.alert('Erreur', 'Le pseudo est requis');
      return;
    }

    try {
      setSaving(true);

      // Update user info
      await apiClient.put(endpoints.auth.me, {
        prenom: prenom.trim(),
        pseudo: pseudo.trim(),
      });

      // Update profile (bio, age)
      await apiClient.put(endpoints.profile.update, {
        bio: bio.trim(),
        age: age ? parseInt(age, 10) : null,
      });

      // Update local user
      if (updateUser) {
        updateUser({
          prenom: prenom.trim(),
          pseudo: pseudo.trim(),
        });
      }

      Alert.alert('Succes', 'Profil mis a jour', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('[EDIT_PROFILE] Save error:', error);
      const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      Alert.alert('Erreur', message);
    } finally {
      setSaving(false);
    }
  }, [prenom, pseudo, bio, age, updateUser, navigation]);

  // Photo handlers
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
      }
    } catch (error) {
      console.error('[EDIT_PROFILE] Upload error:', error);
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.textLight]}>Modifier le profil</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.headerBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.saveBtn}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              activeOpacity={0.8}
              disabled={uploadingPhoto}
            >
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={['#F7B186', '#E89A6F']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>
                      {(prenom || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                {uploadingPhoto && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                )}
                <View style={styles.cameraBtn}>
                  <Ionicons name="camera" size={18} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={[styles.changePhotoText, isDark && styles.textMuted]}>
              Changer la photo
            </Text>
          </View>

          {/* Form Fields */}
          <View style={[styles.formCard, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Informations personnelles
            </Text>

            {/* Prenom */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>Prenom *</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={prenom}
                onChangeText={setPrenom}
                placeholder="Votre prenom"
                placeholderTextColor={isDark ? '#666' : '#999'}
                autoCapitalize="words"
              />
            </View>

            {/* Pseudo */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>Pseudo *</Text>
              <View style={styles.inputWithIcon}>
                <Text style={[styles.inputPrefix, isDark && styles.textMuted]}>@</Text>
                <TextInput
                  style={[styles.input, styles.inputWithPrefix, isDark && styles.inputDark]}
                  value={pseudo}
                  onChangeText={(text) => setPseudo(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="votre_pseudo"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>Age</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={age}
                onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                placeholder="Votre age"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, isDark && styles.inputDark]}
                value={bio}
                onChangeText={setBio}
                placeholder="Parlez-nous de vous..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={[styles.charCount, isDark && styles.textMuted]}>
                {bio.length}/200
              </Text>
            </View>
          </View>

          {/* Account Section */}
          <View style={[styles.formCard, isDark && styles.cardDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Compte
            </Text>

            {/* Email */}
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() => navigation.navigate('ChangeEmail')}
              activeOpacity={0.7}
            >
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="mail" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={[styles.accountLabel, isDark && styles.textLight]}>Email</Text>
                  <Text style={[styles.accountValue, isDark && styles.textMuted]}>
                    {user?.email || 'Non defini'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
            </TouchableOpacity>

            {/* Password */}
            <TouchableOpacity
              style={[styles.accountRow, styles.accountRowLast]}
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="lock-closed" size={20} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={[styles.accountLabel, isDark && styles.textLight]}>Mot de passe</Text>
                  <Text style={[styles.accountValue, isDark && styles.textMuted]}>
                    ********
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#555' : '#CCC'} />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.infoText, isDark && styles.textMuted]}>
              Les champs marques * sont obligatoires
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerDark: {
    borderBottomColor: '#2A2E36',
  },
  headerBtn: {
    padding: 4,
    minWidth: 80,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textMuted: {
    color: '#8A8E96',
  },
  saveBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'right',
  },

  // Content
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFF',
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
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
    borderColor: '#FFF',
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },

  // Form
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#1A1D24',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputDark: {
    backgroundColor: '#22262E',
    color: '#FFFFFF',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  inputPrefix: {
    paddingLeft: 14,
    fontSize: 15,
    color: '#666',
  },
  inputWithPrefix: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingLeft: 4,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },

  // Account rows
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  accountRowLast: {
    borderBottomWidth: 0,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  accountValue: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#999',
  },
});
