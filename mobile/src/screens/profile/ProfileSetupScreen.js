import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

import { theme } from '../../theme';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

const WORKOUT_TYPES = [
  { key: 'musculation', label: 'Musculation', icon: 'barbell' },
  { key: 'cardio', label: 'Cardio', icon: 'heart' },
  { key: 'crossfit', label: 'CrossFit', icon: 'fitness' },
  { key: 'yoga', label: 'Yoga', icon: 'flower' },
  { key: 'running', label: 'Course', icon: 'walk' },
  { key: 'cycling', label: 'Cyclisme', icon: 'bicycle' },
  { key: 'swimming', label: 'Natation', icon: 'water' },
  { key: 'boxing', label: 'Boxe', icon: 'hand-left' },
  { key: 'dance', label: 'Danse', icon: 'musical-notes' },
  { key: 'hiit', label: 'HIIT', icon: 'flash' },
  { key: 'stretching', label: 'Étirements', icon: 'body' },
];

const FITNESS_LEVELS = [
  { key: 'beginner', label: 'Débutant' },
  { key: 'intermediate', label: 'Intermédiaire' },
  { key: 'advanced', label: 'Avancé' },
];

const DAYS = [
  { key: 'monday', label: 'Lun', fullLabel: 'Lundi' },
  { key: 'tuesday', label: 'Mar', fullLabel: 'Mardi' },
  { key: 'wednesday', label: 'Mer', fullLabel: 'Mercredi' },
  { key: 'thursday', label: 'Jeu', fullLabel: 'Jeudi' },
  { key: 'friday', label: 'Ven', fullLabel: 'Vendredi' },
  { key: 'saturday', label: 'Sam', fullLabel: 'Samedi' },
  { key: 'sunday', label: 'Dim', fullLabel: 'Dimanche' },
];

const TIME_SLOTS = [
  { key: 'morning', label: 'Matin', icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Après-midi', icon: 'partly-sunny-outline' },
  { key: 'evening', label: 'Soir', icon: 'moon-outline' },
];

export default function ProfileSetupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form data - Profil de base
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [matchingEnabled, setMatchingEnabled] = useState(false);

  // Localisation
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Disponibilités
  const [availability, setAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  // Préférences de matching
  const [maxDistance, setMaxDistance] = useState('10');
  const [preferredFitnessLevels, setPreferredFitnessLevels] = useState([]);
  const [preferredWorkoutTypes, setPreferredWorkoutTypes] = useState([]);
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('99');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(endpoints.profile.me);
      const profile = response.data.profile; // Le backend retourne { profile: {...} }

      console.log('[PROFILE SETUP] Loaded profile:', profile);

      // Profil de base
      setBio(profile?.bio || '');
      setAge(profile?.age ? String(profile.age) : '');
      setFitnessLevel(profile?.fitnessLevel || 'intermediate');
      setWorkoutTypes(profile?.workoutTypes || []);
      setMatchingEnabled(profile?.isVisible || false);

      // Localisation
      const loc = profile?.location;
      setCity(loc?.city || '');
      setPostalCode(loc?.postalCode || '');
      if (loc?.coordinates && loc.coordinates.length === 2) {
        setLongitude(loc.coordinates[0]);
        setLatitude(loc.coordinates[1]);
      }

      // Disponibilités - Convertir les plages horaires en slots
      if (profile?.availability) {
        const convertedAvailability = {};
        const timeToSlot = (start) => {
          const hour = parseInt(start?.split(':')[0] || '0', 10);
          if (hour >= 6 && hour < 12) return 'morning';
          if (hour >= 12 && hour < 18) return 'afternoon';
          if (hour >= 18 && hour < 24) return 'evening';
          return null;
        };

        Object.keys(profile.availability).forEach(day => {
          const slots = [];
          (profile.availability[day] || []).forEach(timeSlot => {
            const slot = timeToSlot(timeSlot.start);
            if (slot && !slots.includes(slot)) {
              slots.push(slot);
            }
          });
          convertedAvailability[day] = slots;
        });

        setAvailability(convertedAvailability);
      }

      // Préférences de matching
      if (profile?.matchPreferences) {
        const prefs = profile.matchPreferences;
        setMaxDistance(String(prefs.maxDistance || 10));
        setPreferredFitnessLevels(prefs.preferredFitnessLevels || []);
        setPreferredWorkoutTypes(prefs.preferredWorkoutTypes || []);
        setMinAge(String(prefs.preferredAgeRange?.min || 18));
        setMaxAge(String(prefs.preferredAgeRange?.max || 99));
      }
    } catch (error) {
      console.error('[PROFILE SETUP] Error loading:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Mise à jour du profil de base
      await apiClient.put(endpoints.profile.update, {
        bio,
        age: age ? parseInt(age, 10) : null,
        fitnessLevel,
        workoutTypes,
        isVisible: matchingEnabled,
      });

      // Mise à jour de la localisation si renseignée
      if (city || postalCode || (latitude && longitude)) {
        const locationData = {
          city,
          postalCode,
          latitude,
          longitude,
        };

        console.log('[PROFILE SETUP] Saving location:', locationData);
        await apiClient.put(endpoints.profile.location, locationData);
      }

      // Mise à jour des disponibilités - Convertir les slots en plages horaires
      const convertedAvailability = {};
      const slotToTime = {
        morning: { start: '06:00', end: '12:00' },
        afternoon: { start: '12:00', end: '18:00' },
        evening: { start: '18:00', end: '23:00' },
      };

      Object.keys(availability).forEach(day => {
        convertedAvailability[day] = availability[day].map(slot => slotToTime[slot] || { start: '00:00', end: '23:59' });
      });

      await apiClient.put(endpoints.profile.availability, {
        availability: convertedAvailability,
      });

      // Mise à jour des préférences de matching
      const preferencesData = {
        matchPreferences: {
          maxDistance: parseInt(maxDistance, 10),
          preferredFitnessLevels,
          preferredWorkoutTypes,
          preferredAgeRange: {
            min: parseInt(minAge, 10),
            max: parseInt(maxAge, 10),
          },
        },
      };

      console.log('[PROFILE SETUP] Saving preferences:', preferencesData);
      await apiClient.put(endpoints.profile.preferences, preferencesData);

      Alert.alert('Succès', 'Profil mis à jour avec succès !');
      navigation.goBack();

    } catch (error) {
      console.error('[PROFILE SETUP] Error saving:', error);
      Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkoutType = (type) => {
    setWorkoutTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const togglePreferredFitnessLevel = (level) => {
    setPreferredFitnessLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const togglePreferredWorkoutType = (type) => {
    setPreferredWorkoutTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleDaySlot = (day, slot) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].includes(slot)
        ? prev[day].filter(s => s !== slot)
        : [...prev[day], slot],
    }));
  };

  const requestLocation = async () => {
    try {
      setGettingLocation(true);

      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'L\'accès à la localisation est nécessaire pour cette fonctionnalité.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Obtenir la position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Geocoding inverse pour obtenir la ville et le code postal
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          if (address.city) setCity(address.city);
          if (address.postalCode) setPostalCode(address.postalCode);
        }
      } catch (geocodeError) {
        console.log('[LOCATION] Geocoding error:', geocodeError);
      }

      Alert.alert(
        'Localisation activée',
        'Votre position a été enregistrée avec succès.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[LOCATION] Error:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'obtenir votre position. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setGettingLocation(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Configuration du profil</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: PROFIL DE BASE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionHeader, isDark && styles.textDark]}>
              Profil de base
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>Bio</Text>
            <TextInput
              style={[
                styles.textArea,
                isDark && styles.inputDark,
                isDark && { color: '#FFF' }
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Parlez de vous, vos objectifs fitness..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Age */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>Âge</Text>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                isDark && { color: '#FFF' }
              ]}
              value={age}
              onChangeText={setAge}
              placeholder="25"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="numeric"
            />
          </View>

          {/* Niveau de fitness */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>Niveau de fitness</Text>
            <View style={styles.optionButtons}>
              {FITNESS_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.optionButton,
                    fitnessLevel === level.key && styles.optionButtonActive,
                    isDark && styles.optionButtonDark,
                  ]}
                  onPress={() => setFitnessLevel(level.key)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      fitnessLevel === level.key && styles.optionButtonTextActive,
                      isDark && styles.textDark,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Types d'entraînement */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>Types d'entraînement</Text>
            <View style={styles.workoutGrid}>
              {WORKOUT_TYPES.map((type) => {
                const isSelected = workoutTypes.includes(type.key);
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.workoutChip,
                      isSelected && styles.workoutChipActive,
                      isDark && styles.workoutChipDark,
                    ]}
                    onPress={() => toggleWorkoutType(type.key)}
                  >
                    <Ionicons
                      name={type.icon}
                      size={18}
                      color={isSelected ? '#FFF' : (isDark ? '#888' : '#666')}
                    />
                    <Text
                      style={[
                        styles.workoutChipText,
                        isSelected && styles.workoutChipTextActive,
                        isDark && !isSelected && styles.textMutedDark,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Activer le matching */}
          <View style={styles.field}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isDark && styles.textDark]}>
                  Activer le matching
                </Text>
                <Text style={[styles.hint, isDark && styles.textMutedDark]}>
                  Permet aux autres utilisateurs de vous voir
                </Text>
              </View>
              <Switch
                value={matchingEnabled}
                onValueChange={setMatchingEnabled}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={matchingEnabled ? '#FFF' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: LOCALISATION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionHeader, isDark && styles.textDark]}>
              Localisation
            </Text>
          </View>

          {/* Bouton d'activation de la localisation */}
          <TouchableOpacity
            style={[styles.locationButton, isDark && styles.locationButtonDark]}
            onPress={requestLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="navigate"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.locationButtonText, { color: theme.colors.primary }]}>
                  {latitude && longitude ? 'Mettre à jour ma position' : 'Activer ma position GPS'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {latitude && longitude && (
            <View style={[styles.locationInfo, isDark && styles.locationInfoDark]}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={[styles.locationInfoText, isDark && styles.textDark]}>
                Position GPS enregistrée
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>Ville</Text>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                isDark && { color: '#FFF' }
              ]}
              value={city}
              onChangeText={setCity}
              placeholder="Paris"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>Code postal</Text>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                isDark && { color: '#FFF' }
              ]}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="75001"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* SECTION 3: DISPONIBILITÉS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionHeader, isDark && styles.textDark]}>
              Disponibilités
            </Text>
          </View>
          <Text style={[styles.hint, isDark && styles.textMutedDark, { marginBottom: 12 }]}>
            Sélectionnez vos créneaux disponibles
          </Text>

          {DAYS.map((day) => (
            <View key={day.key} style={styles.dayRow}>
              <Text style={[styles.dayLabel, isDark && styles.textDark]}>
                {day.fullLabel}
              </Text>
              <View style={styles.slotsRow}>
                {TIME_SLOTS.map((slot) => {
                  const isSelected = availability[day.key]?.includes(slot.key);
                  return (
                    <TouchableOpacity
                      key={slot.key}
                      style={[
                        styles.slotChip,
                        isSelected && styles.slotChipActive,
                        isDark && styles.slotChipDark,
                      ]}
                      onPress={() => toggleDaySlot(day.key, slot.key)}
                    >
                      <Ionicons
                        name={slot.icon}
                        size={14}
                        color={isSelected ? '#FFF' : (isDark ? '#888' : '#666')}
                      />
                      <Text
                        style={[
                          styles.slotChipText,
                          isSelected && styles.slotChipTextActive,
                          isDark && !isSelected && styles.textMutedDark,
                        ]}
                      >
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* SECTION 4: PRÉFÉRENCES DE MATCHING */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="heart-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionHeader, isDark && styles.textDark]}>
              Préférences de matching
            </Text>
          </View>

          {/* Distance maximale */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>
              Distance maximale: {maxDistance} km
            </Text>
            <TextInput
              style={[
                styles.input,
                isDark && styles.inputDark,
                isDark && { color: '#FFF' }
              ]}
              value={maxDistance}
              onChangeText={setMaxDistance}
              placeholder="10"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="numeric"
            />
          </View>

          {/* Tranche d'âge */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>
              Tranche d'âge préférée
            </Text>
            <View style={styles.ageRange}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hint, isDark && styles.textMutedDark]}>Min</Text>
                <TextInput
                  style={[
                    styles.input,
                    isDark && styles.inputDark,
                    isDark && { color: '#FFF' }
                  ]}
                  value={minAge}
                  onChangeText={setMinAge}
                  placeholder="18"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
              <Text style={[styles.ageRangeSeparator, isDark && styles.textDark]}>—</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hint, isDark && styles.textMutedDark]}>Max</Text>
                <TextInput
                  style={[
                    styles.input,
                    isDark && styles.inputDark,
                    isDark && { color: '#FFF' }
                  ]}
                  value={maxAge}
                  onChangeText={setMaxAge}
                  placeholder="99"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Niveaux de fitness préférés */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>
              Niveaux de fitness préférés
            </Text>
            <View style={styles.optionButtons}>
              {FITNESS_LEVELS.map((level) => {
                const isSelected = preferredFitnessLevels.includes(level.key);
                return (
                  <TouchableOpacity
                    key={level.key}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonActive,
                      isDark && styles.optionButtonDark,
                    ]}
                    onPress={() => togglePreferredFitnessLevel(level.key)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        isSelected && styles.optionButtonTextActive,
                        isDark && styles.textDark,
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Types d'entraînement préférés */}
          <View style={styles.field}>
            <Text style={[styles.label, isDark && styles.textDark]}>
              Types d'entraînement préférés
            </Text>
            <View style={styles.workoutGrid}>
              {WORKOUT_TYPES.map((type) => {
                const isSelected = preferredWorkoutTypes.includes(type.key);
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.workoutChip,
                      isSelected && styles.workoutChipActive,
                      isDark && styles.workoutChipDark,
                    ]}
                    onPress={() => togglePreferredWorkoutType(type.key)}
                  >
                    <Ionicons
                      name={type.icon}
                      size={18}
                      color={isSelected ? '#FFF' : (isDark ? '#888' : '#666')}
                    />
                    <Text
                      style={[
                        styles.workoutChipText,
                        isSelected && styles.workoutChipTextActive,
                        isDark && !isSelected && styles.textMutedDark,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  headerDark: {
    borderBottomColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  textDark: {
    color: '#FFF',
  },
  textMutedDark: {
    color: '#888',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#333',
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionButtonDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#333',
  },
  optionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#FFF',
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  workoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  workoutChipDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#333',
  },
  workoutChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  workoutChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  workoutChipTextActive: {
    color: '#FFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayRow: {
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  slotChipDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#333',
  },
  slotChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  slotChipTextActive: {
    color: '#FFF',
  },
  ageRange: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  ageRangeSeparator: {
    fontSize: 20,
    fontWeight: '300',
    color: '#000',
    marginBottom: 14,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  locationButtonDark: {
    backgroundColor: '#2A2A2A',
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  locationInfoDark: {
    backgroundColor: '#1A3A2A',
  },
  locationInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22C55E',
  },
});
