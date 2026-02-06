import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useProgram } from '../../contexts/ProgramContext';
import { theme } from '../../theme';
import ExerciseSelector from '../../components/programs/ExerciseSelector';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

// Configuration des types de programme
const PROGRAM_TYPES = [
  { value: 'hiit', label: 'HIIT', icon: 'flash' },
  { value: 'circuit', label: 'Circuit', icon: 'reload' },
  { value: 'tabata', label: 'Tabata', icon: 'timer' },
  { value: 'emom', label: 'EMOM', icon: 'stopwatch' },
  { value: 'amrap', label: 'AMRAP', icon: 'trending-up' },
  { value: 'superset', label: 'Superset', icon: 'swap-horizontal' },
  { value: 'custom', label: 'Custom', icon: 'construct' },
];

// Configuration des difficultés
const DIFFICULTIES = [
  { value: 'débutant', label: 'Débutant' },
  { value: 'intermédiaire', label: 'Intermédiaire' },
  { value: 'avancé', label: 'Avancé' },
];

// Groupes musculaires
const MUSCLE_GROUPS = [
  'full-body', 'abdos', 'jambes', 'pectoraux', 'dos', 'bras', 'épaules', 'cardio',
];

// Équipement
const EQUIPMENT = [
  'aucun', 'poids-du-corps', 'haltères', 'barre', 'élastiques', 'tapis-de-course', 'vélo', 'rameur',
];

// Helper function to detect exercise type and return required fields
const getExerciseFields = (exerciseType) => {
  if (!exerciseType || typeof exerciseType !== 'string') return 'cardio'; // default

  const type = exerciseType.toLowerCase();

  if (type.includes('cardio') || type.includes('course') || type.includes('vélo') || type.includes('elliptique') || type.includes('rameur')) {
    return 'cardio';
  }
  if (type.includes('muscu') || type.includes('strength') || type.includes('poids') || type.includes('haltères')) {
    return 'muscu';
  }
  if (type.includes('yoga')) {
    return 'yoga';
  }
  if (type.includes('étirement') || type.includes('stretch') || type.includes('flexibility')) {
    return 'stretch';
  }
  if (type.includes('natation') || type.includes('swim')) {
    return 'swim';
  }

  return 'cardio'; // default
};

export default function ProgramFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { mode, program: existingProgram } = route.params || {};
  const isEdit = mode === 'edit' && existingProgram;

  const { createProgram, updateProgram, isPremium } = useProgram();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(existingProgram?.name || '');
  const [description, setDescription] = useState(existingProgram?.description || '');
  const [type, setType] = useState(existingProgram?.type || 'custom');
  const [difficulty, setDifficulty] = useState(existingProgram?.difficulty || 'intermédiaire');
  const [muscleGroups, setMuscleGroups] = useState(existingProgram?.muscleGroups || []);
  const [equipment, setEquipment] = useState(existingProgram?.equipment || []);
  const [cycles, setCycles] = useState(existingProgram?.cycles || [
    { order: 1, type: 'exercise', exerciseName: '', exerciseType: '', durationSec: 30 },
  ]);
  const [coverImage, setCoverImage] = useState(existingProgram?.coverImage || null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(null);

  // Toggle sélection multi
  const toggleSelection = (arr, setArr, value) => {
    if (arr.includes(value)) {
      setArr(arr.filter(v => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  // Choisir une image de couverture
  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Nous avons besoin de la permission d\'accéder à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadCoverImage(result.assets[0].uri);
    }
  };

  // Uploader l'image de couverture
  const uploadCoverImage = async (imageUri) => {
    try {
      setUploadingCover(true);

      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // FormData for React Native
      formData.append('photo', {
        uri: imageUri,
        name: filename || 'cover.jpg',
        type,
      });

      const response = await apiClient.post(endpoints.upload.profilePhoto, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.photoUrl) {
        setCoverImage(response.data.photoUrl);
      } else if (response.data?.photo) {
        setCoverImage(response.data.photo);
      } else {
        Alert.alert('Erreur', 'Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('[PROGRAM FORM] Upload cover error:', error);
      Alert.alert('Erreur', 'Impossible de télécharger l\'image');
    } finally {
      setUploadingCover(false);
    }
  };

  // Supprimer l'image de couverture
  const removeCoverImage = () => {
    setCoverImage(null);
  };

  // Ajouter un cycle
  const addCycle = () => {
    setCycles([
      ...cycles,
      { order: cycles.length + 1, type: 'exercise', exerciseName: '', exerciseType: '', durationSec: 30 },
    ]);
  };

  // Supprimer un cycle
  const removeCycle = (index) => {
    if (cycles.length > 1) {
      setCycles(cycles.filter((_, i) => i !== index));
    }
  };

  // Mettre à jour un cycle
  const updateCycle = (index, field, value) => {
    const newCycles = [...cycles];
    newCycles[index] = { ...newCycles[index], [field]: value };
    setCycles(newCycles);
  };

  // Ouvrir le selecteur d'exercice pour un cycle
  const openExerciseSelector = (index) => {
    setSelectedCycleIndex(index);
    setExerciseSelectorVisible(true);
  };

  // Selectionner un exercice depuis le modal
  const handleExerciseSelect = (exerciseData) => {
    if (selectedCycleIndex !== null) {
      const newCycles = [...cycles];
      newCycles[selectedCycleIndex] = {
        ...newCycles[selectedCycleIndex],
        exerciseId: exerciseData.exerciseId,
        exerciseName: exerciseData.exerciseName,
        exerciseImage: exerciseData.exerciseImage,
        exerciseType: exerciseData.exerciseType,
      };
      setCycles(newCycles);
    }
    setExerciseSelectorVisible(false);
    setSelectedCycleIndex(null);
  };

  // Calculer durée estimée
  const estimatedDuration = cycles.reduce((total, cycle) => {
    if (cycle.type === 'rest' || cycle.type === 'transition') {
      return total + (cycle.restSec || 0);
    }
    return total + (cycle.durationSec || 0) + ((cycle.durationMin || 0) * 60);
  }, 0) / 60;

  // Sauvegarder
  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du programme est requis');
      return;
    }
    if (cycles.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un cycle');
      return;
    }

    setLoading(true);

    const programData = {
      name: name.trim(),
      description: description.trim(),
      type,
      difficulty,
      muscleGroups,
      equipment,
      cycles: cycles.map((c, i) => ({ ...c, order: i + 1 })),
      estimatedDuration: Math.round(estimatedDuration),
      coverImage: coverImage || null,
    };

    try {
      let result;
      if (isEdit) {
        result = await updateProgram(existingProgram._id, programData);
      } else {
        result = await createProgram(programData);
      }

      if (result) {
        navigation.goBack();
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue');
      }
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? 'Modifier le programme' : 'Nouveau programme',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={isDark ? '#FFF' : '#333'} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{ marginRight: 16 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
      },
      headerTintColor: isDark ? '#FFFFFF' : '#000000',
    });
  }, [navigation, isEdit, loading, isDark, name, description, type, difficulty, cycles]);

  if (!isPremium) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.premiumGate}>
          <Ionicons name="lock-closed" size={64} color="#F59E0B" />
          <Text style={[styles.premiumTitle, isDark && styles.premiumTitleDark]}>
            Fonctionnalité Premium
          </Text>
          <Text style={[styles.premiumText, isDark && styles.premiumTextDark]}>
            La création de programmes est réservée aux membres Premium.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Image de couverture */}
      <View style={styles.section}>
        <Text style={[styles.label, isDark && styles.labelDark]}>Image de couverture</Text>
        <TouchableOpacity
          style={[styles.coverImagePicker, isDark && styles.coverImagePickerDark]}
          onPress={pickCoverImage}
          disabled={uploadingCover}
        >
          {coverImage ? (
            <View style={styles.coverImageContainer}>
              <Image source={{ uri: coverImage }} style={styles.coverImage} />
              <TouchableOpacity
                style={styles.removeCoverButton}
                onPress={removeCoverImage}
                disabled={uploadingCover}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : uploadingCover ? (
            <View style={styles.coverImageLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.coverImageText, isDark && styles.coverImageTextDark]}>
                Téléchargement...
              </Text>
            </View>
          ) : (
            <View style={styles.coverImagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={isDark ? '#555' : '#CCC'} />
              <Text style={[styles.coverImageText, isDark && styles.coverImageTextDark]}>
                Appuyez pour ajouter une image
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Nom */}
      <View style={styles.section}>
        <Text style={[styles.label, isDark && styles.labelDark]}>Nom du programme *</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Ex: HIIT Brûle-graisse"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={[styles.label, isDark && styles.labelDark]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, isDark && styles.inputDark]}
          placeholder="Décrivez votre programme..."
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Type */}
      <View style={styles.section}>
        <Text style={[styles.label, isDark && styles.labelDark]}>Type de programme</Text>
        <View style={styles.chipContainer}>
          {PROGRAM_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.chip,
                isDark && styles.chipDark,
                type === t.value && styles.chipActive,
              ]}
              onPress={() => setType(t.value)}
            >
              <Ionicons
                name={t.icon}
                size={16}
                color={type === t.value ? '#FFF' : (isDark ? '#888' : '#666')}
              />
              <Text
                style={[
                  styles.chipText,
                  isDark && styles.chipTextDark,
                  type === t.value && styles.chipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Difficulté */}
      <View style={styles.section}>
        <Text style={[styles.label, isDark && styles.labelDark]}>Difficulté</Text>
        <View style={styles.chipContainer}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[
                styles.chip,
                isDark && styles.chipDark,
                difficulty === d.value && styles.chipActive,
              ]}
              onPress={() => setDifficulty(d.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  isDark && styles.chipTextDark,
                  difficulty === d.value && styles.chipTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Muscles */}
      <View style={styles.section}>
        <Text style={[styles.label, isDark && styles.labelDark]}>Groupes musculaires</Text>
        <View style={styles.chipContainer}>
          {MUSCLE_GROUPS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.chip,
                isDark && styles.chipDark,
                muscleGroups.includes(m) && styles.chipActive,
              ]}
              onPress={() => toggleSelection(muscleGroups, setMuscleGroups, m)}
            >
              <Text
                style={[
                  styles.chipText,
                  isDark && styles.chipTextDark,
                  muscleGroups.includes(m) && styles.chipTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Équipement */}
      <View style={styles.section}>
        <Text style={[styles.label, isDark && styles.labelDark]}>Équipement requis</Text>
        <View style={styles.chipContainer}>
          {EQUIPMENT.map((e) => (
            <TouchableOpacity
              key={e}
              style={[
                styles.chip,
                isDark && styles.chipDark,
                equipment.includes(e) && styles.chipActive,
              ]}
              onPress={() => toggleSelection(equipment, setEquipment, e)}
            >
              <Text
                style={[
                  styles.chipText,
                  isDark && styles.chipTextDark,
                  equipment.includes(e) && styles.chipTextActive,
                ]}
              >
                {e}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cycles */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.label, isDark && styles.labelDark]}>
            Cycles ({cycles.length})
          </Text>
          <Text style={[styles.durationEstimate, isDark && styles.durationEstimateDark]}>
            ~{Math.round(estimatedDuration)} min
          </Text>
        </View>

        {cycles.map((cycle, index) => (
          <View key={index} style={[styles.cycleCard, isDark && styles.cycleCardDark]}>
            <View style={styles.cycleHeader}>
              <Text style={[styles.cycleNumber, isDark && styles.cycleNumberDark]}>
                Cycle {index + 1}
              </Text>
              {cycles.length > 1 && (
                <TouchableOpacity onPress={() => removeCycle(index)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Type de cycle */}
            <View style={styles.cycleTypeRow}>
              {['exercise', 'rest', 'transition'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.cycleTypeChip,
                    cycle.type === t && styles.cycleTypeChipActive,
                  ]}
                  onPress={() => updateCycle(index, 'type', t)}
                >
                  <Text
                    style={[
                      styles.cycleTypeText,
                      cycle.type === t && styles.cycleTypeTextActive,
                    ]}
                  >
                    {t === 'exercise' ? 'Exercice' : t === 'rest' ? 'Repos' : 'Transition'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selecteur d'exercice (si type exercise) */}
            {cycle.type === 'exercise' && (
              <TouchableOpacity
                style={[styles.exerciseSelector, isDark && styles.exerciseSelectorDark]}
                onPress={() => openExerciseSelector(index)}
              >
                {cycle.exerciseImage ? (
                  <Image
                    source={{ uri: cycle.exerciseImage }}
                    style={styles.exerciseThumbnail}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.exercisePlaceholder, isDark && styles.exercisePlaceholderDark]}>
                    <Ionicons name="barbell-outline" size={20} color={isDark ? '#555' : '#CCC'} />
                  </View>
                )}
                <Text
                  style={[
                    styles.exerciseSelectorText,
                    isDark && styles.exerciseSelectorTextDark,
                    !cycle.exerciseName && styles.exerciseSelectorPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {cycle.exerciseName || 'Choisir un exercice...'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#888' : '#999'}
                />
              </TouchableOpacity>
            )}

            {/* Dynamic fields based on exercise type */}
            {cycle.type === 'exercise' && (() => {
              const fieldType = getExerciseFields(cycle.exerciseType);

              if (fieldType === 'muscu') {
                return (
                  <>
                    <View style={styles.durationRow}>
                      <Text style={[styles.durationLabel, isDark && styles.durationLabelDark]}>
                        Poids (kg):
                      </Text>
                      <TextInput
                        style={[styles.durationInput, isDark && styles.durationInputDark]}
                        keyboardType="numeric"
                        placeholder="Ex: 20"
                        value={String(cycle.weight || '')}
                        onChangeText={(val) => updateCycle(index, 'weight', parseInt(val) || 0)}
                      />
                    </View>
                    <View style={styles.durationRow}>
                      <Text style={[styles.durationLabel, isDark && styles.durationLabelDark]}>
                        Répétitions *:
                      </Text>
                      <TextInput
                        style={[styles.durationInput, isDark && styles.durationInputDark]}
                        keyboardType="numeric"
                        placeholder="Ex: 10"
                        value={String(cycle.repetitions || '')}
                        onChangeText={(val) => updateCycle(index, 'repetitions', parseInt(val) || 0)}
                      />
                    </View>
                  </>
                );
              } else if (fieldType === 'yoga') {
                return (
                  <View style={styles.durationRow}>
                    <Text style={[styles.durationLabel, isDark && styles.durationLabelDark]}>
                      Durée (min) *:
                    </Text>
                    <TextInput
                      style={[styles.durationInput, isDark && styles.durationInputDark]}
                      keyboardType="numeric"
                      placeholder="Ex: 30"
                      value={String(cycle.durationMin || '')}
                      onChangeText={(val) => updateCycle(index, 'durationMin', parseInt(val) || 0)}
                    />
                  </View>
                );
              } else if (fieldType === 'stretch') {
                return (
                  <View style={styles.durationRow}>
                    <Text style={[styles.durationLabel, isDark && styles.durationLabelDark]}>
                      Durée (sec) *:
                    </Text>
                    <TextInput
                      style={[styles.durationInput, isDark && styles.durationInputDark]}
                      keyboardType="numeric"
                      placeholder="Ex: 60"
                      value={String(cycle.durationSec || '')}
                      onChangeText={(val) => updateCycle(index, 'durationSec', parseInt(val) || 0)}
                    />
                  </View>
                );
              } else {
                // Default cardio
                return (
                  <>
                    <View style={styles.durationRow}>
                      <Text style={[styles.durationLabel, isDark && styles.durationLabelDark]}>
                        Durée (sec) *:
                      </Text>
                      <TextInput
                        style={[styles.durationInput, isDark && styles.durationInputDark]}
                        keyboardType="numeric"
                        placeholder="Ex: 30"
                        value={String(cycle.durationSec || '')}
                        onChangeText={(val) => updateCycle(index, 'durationSec', parseInt(val) || 0)}
                      />
                    </View>
                    <View style={styles.durationRow}>
                      <Text style={[styles.durationLabel, isDark && styles.durationLabelDark]}>
                        Intensité (1-10) *:
                      </Text>
                      <TextInput
                        style={[styles.durationInput, isDark && styles.durationInputDark]}
                        keyboardType="numeric"
                        placeholder="Ex: 5"
                        value={String(cycle.intensity || '')}
                        onChangeText={(val) => updateCycle(index, 'intensity', parseInt(val) || 0)}
                      />
                    </View>
                  </>
                );
              }
            })()}

            {/* Rest/Transition duration */}
            {cycle.type !== 'exercise' && (
              <View style={styles.durationRow}>
                <Text style={[styles.durationLabel, isDark && styles.durationLabelDark]}>
                  Durée (sec):
                </Text>
                <TextInput
                  style={[styles.durationInput, isDark && styles.durationInputDark]}
                  keyboardType="numeric"
                  value={String(cycle.restSec || '')}
                  onChangeText={(val) => updateCycle(index, 'restSec', parseInt(val) || 0)}
                />
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addCycleButton} onPress={addCycle}>
          <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.addCycleText}>Ajouter un cycle</Text>
        </TouchableOpacity>
      </View>

      {/* Spacer */}
      <View style={{ height: 100 }} />

      {/* ExerciseSelector Modal */}
      <ExerciseSelector
        visible={exerciseSelectorVisible}
        onClose={() => {
          setExerciseSelectorVisible(false);
          setSelectedCycleIndex(null);
        }}
        onSelect={handleExerciseSelect}
        currentExercise={selectedCycleIndex !== null ? cycles[selectedCycleIndex] : null}
      />
    </ScrollView>
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
  content: {
    padding: theme.spacing.md,
  },
  saveButton: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  labelDark: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  coverImagePicker: {
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  coverImagePickerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  coverImageContainer: {
    flex: 1,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeCoverButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  coverImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  coverImageTextDark: {
    color: '#888',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  chipDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  chipTextDark: {
    color: '#888',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  durationEstimate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  durationEstimateDark: {
    color: '#888',
  },
  cycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cycleCardDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#404040',
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cycleNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  cycleNumberDark: {
    color: '#FFFFFF',
  },
  cycleTypeRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  cycleTypeChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F0F0F0',
  },
  cycleTypeChipActive: {
    backgroundColor: theme.colors.primary,
  },
  cycleTypeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  cycleTypeTextActive: {
    color: '#FFFFFF',
  },
  cycleInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  cycleInputDark: {
    backgroundColor: '#333',
    color: '#FFFFFF',
  },
  exerciseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exerciseSelectorDark: {
    backgroundColor: '#333',
    borderColor: '#404040',
  },
  exerciseThumbnail: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
  },
  exercisePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exercisePlaceholderDark: {
    backgroundColor: '#404040',
  },
  exerciseSelectorText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  exerciseSelectorTextDark: {
    color: '#FFFFFF',
  },
  exerciseSelectorPlaceholder: {
    color: '#999',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  durationLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  durationLabelDark: {
    color: '#888',
  },
  durationInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    width: 80,
    textAlign: 'center',
  },
  durationInputDark: {
    backgroundColor: '#333',
    color: '#FFFFFF',
  },
  addCycleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  addCycleText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
  },
  premiumGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  premiumTitleDark: {
    color: '#FFFFFF',
  },
  premiumText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  premiumTextDark: {
    color: '#888',
  },
});
