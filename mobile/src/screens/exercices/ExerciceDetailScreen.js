import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Vibration,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeImage from '../../components/ui/SafeImage';
import theme from '../../theme';
import { useWorkout } from '../../contexts/WorkoutContext';
import logger from '../../services/logger';

const FAVORITES_KEY = '@exercices_favorites';

// Labels pour l'affichage
const MUSCLE_LABELS = {
  'pectoraux': 'Pectoraux',
  'dos-superieur': 'Dos superieur',
  'dos-inferieur': 'Dos inferieur',
  'epaules': 'Epaules',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'cuisses-externes': 'Quadriceps',
  'cuisses-internes': 'Ischio-jambiers',
  'fessiers': 'Fessiers',
  'mollets': 'Mollets',
  'abdos-centre': 'Abdominaux',
  'abdos-lateraux': 'Obliques',
  'cardio': 'Cardio',
};

const EQUIPMENT_LABELS = {
  'barre': 'Barre',
  'halteres': 'Halteres',
  'poulie': 'Poulie',
  'machine': 'Machine',
  'poids_corps': 'Poids du corps',
  'aucun': 'Aucun',
  'velo': 'Velo',
  'rameur': 'Rameur',
  'corde': 'Corde a sauter',
  'accessoire': 'Accessoire',
};

const DIFFICULTY_CONFIG = {
  'debutant': { label: 'Debutant', color: '#22C55E', icon: 'leaf-outline' },
  'intermediaire': { label: 'Intermediaire', color: '#F59E0B', icon: 'barbell-outline' },
  'avance': { label: 'Avance', color: '#EF4444', icon: 'flame-outline' },
};

const TYPE_CONFIG = {
  'muscu': { label: 'Musculation', color: '#8B5CF6', icon: 'barbell' },
  'poids_du_corps': { label: 'Poids du corps', color: '#06B6D4', icon: 'body' },
  'cardio': { label: 'Cardio', color: '#EF4444', icon: 'heart' },
  'etirement': { label: 'Etirement', color: '#10B981', icon: 'flower' },
};

// Instructions par defaut selon le type d'exercice
const getDefaultInstructions = (exercice) => {
  const type = exercice.type || 'muscu';

  if (type === 'cardio') {
    return [
      'Echauffez-vous pendant 5 minutes a faible intensite',
      'Maintenez une cadence reguliere et controlee',
      'Respirez de maniere fluide et naturelle',
      'Gardez une posture droite et les epaules detendues',
      'Terminez par un retour au calme progressif',
    ];
  }

  if (type === 'etirement') {
    return [
      'Etirez-vous lentement sans a-coups',
      'Maintenez la position 20 a 30 secondes',
      'Respirez profondement et regulierement',
      'Ne forcez jamais au-dela de la douleur',
      'Repetez de chaque cote si necessaire',
    ];
  }

  if (type === 'poids_du_corps') {
    return [
      'Adoptez une position stable et equilibree',
      'Engagez vos abdominaux pour stabiliser le tronc',
      'Effectuez le mouvement de maniere controlee',
      'Gardez une amplitude complete du mouvement',
      'Expirez pendant l\'effort, inspirez au retour',
    ];
  }

  // Musculation par defaut
  return [
    'Placez-vous dans la position de depart correcte',
    'Contractez les muscles cibles avant de commencer',
    'Effectuez le mouvement de maniere lente et controlee',
    'Expirez pendant l\'effort, inspirez lors du retour',
    'Maintenez la tension musculaire tout au long du mouvement',
  ];
};

// Conseils selon le groupe musculaire
const getTips = (exercice) => {
  const muscle = exercice.muscle;

  const tipsByMuscle = {
    'pectoraux': 'Gardez les omoplates serrees et le dos legerement cambre pour une meilleure activation.',
    'dos-superieur': 'Tirez avec les coudes, pas les mains. Serrez les omoplates en fin de mouvement.',
    'dos-inferieur': 'Gardez le dos droit et engagez les abdominaux pour proteger la colonne.',
    'epaules': 'Ne montez pas les epaules vers les oreilles pendant l\'effort.',
    'biceps': 'Gardez les coudes fixes le long du corps pour isoler le muscle.',
    'triceps': 'Verrouillez les coudes en haut du mouvement sans hyperextension.',
    'cuisses-externes': 'Poussez a travers les talons, gardez les genoux alignes avec les pieds.',
    'cuisses-internes': 'Controlez la descente, ne rebondissez pas en bas du mouvement.',
    'fessiers': 'Serrez fort les fessiers en haut du mouvement pendant 1 seconde.',
    'mollets': 'Montez sur la pointe des pieds au maximum, descendez lentement.',
    'abdos-centre': 'Gardez le bas du dos plaque au sol, ne tirez pas sur la nuque.',
    'abdos-lateraux': 'Pivotez le buste, pas juste les epaules.',
    'cardio': 'Trouvez votre rythme et maintenez-le regulierement.',
  };

  return tipsByMuscle[muscle] || 'Concentrez-vous sur la qualite du mouvement plutot que la quantite.';
};


export default function ExerciceDetailScreen({ navigation, route }) {
  const { exercice } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { addExercise, isExerciseInWorkout } = useWorkout();
  const isInWorkout = isExerciseInWorkout(exercice.id);

  const [isFavorite, setIsFavorite] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const difficultyConfig = DIFFICULTY_CONFIG[exercice.difficulty] || DIFFICULTY_CONFIG.intermediaire;
  const typeConfig = TYPE_CONFIG[exercice.type] || TYPE_CONFIG.muscu;
  const instructions = getDefaultInstructions(exercice);
  const tip = getTips(exercice);

  // Charger l'etat favori
  useEffect(() => {
    loadFavoriteStatus();
  }, []);

  const loadFavoriteStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const favorites = JSON.parse(stored);
        setIsFavorite(favorites.includes(exercice.id));
      }
    } catch (error) {
      logger.app.debug('Erreur chargement favori:', error);
    }
  };

  const toggleFavorite = async () => {
    // Animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      let favorites = stored ? JSON.parse(stored) : [];

      if (isFavorite) {
        favorites = favorites.filter(id => id !== exercice.id);
      } else {
        favorites.push(exercice.id);
        Vibration.vibrate(50);
      }

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      logger.app.debug('Erreur toggle favori:', error);
    }
  };

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAddToWorkout = useCallback(() => {
    if (isInWorkout) return;
    addExercise(exercice);
    Vibration.vibrate(100);
  }, [exercice, isInWorkout, addExercise]);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]} numberOfLines={1}>
          {exercice.name}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.headerAction}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#EF4444' : (isDark ? '#888' : '#666')}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddToWorkout}
            style={[styles.headerAction, styles.addAction, isInWorkout && styles.addActionDone]}
            disabled={isInWorkout}
          >
            <Ionicons
              name={isInWorkout ? 'checkmark' : 'add'}
              size={22}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image/GIF de l'exercice */}
        <View style={[styles.imageContainer, isDark && styles.imageContainerDark]}>
          {exercice.image ? (
            <SafeImage
              source={{ uri: exercice.image }}
              style={styles.exerciseImage}
              resizeMode="cover"
              placeholderIcon="barbell-outline"
              placeholderSize={80}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: `${typeConfig.color}15` }]}>
              <Ionicons name={typeConfig.icon} size={80} color={typeConfig.color} />
              <Text style={[styles.imagePlaceholderText, isDark && styles.textMutedDark]}>
                Image non disponible
              </Text>
            </View>
          )}
        </View>

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
          <Ionicons name={typeConfig.icon} size={14} color="#FFF" />
          <Text style={styles.typeBadgeText}>{typeConfig.label}</Text>
        </View>

        {/* Infos rapides */}
        <View style={styles.quickInfoRow}>
          {/* Difficulte */}
          <View style={[styles.quickInfoCard, isDark && styles.cardDark]}>
            <View style={[styles.quickInfoIcon, { backgroundColor: `${difficultyConfig.color}20` }]}>
              <Ionicons name={difficultyConfig.icon} size={20} color={difficultyConfig.color} />
            </View>
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Niveau</Text>
            <Text style={[styles.quickInfoValue, { color: difficultyConfig.color }]}>
              {difficultyConfig.label}
            </Text>
          </View>

          {/* Equipement */}
          <View style={[styles.quickInfoCard, isDark && styles.cardDark]}>
            <View style={[styles.quickInfoIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="barbell-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Equipement</Text>
            <Text style={[styles.quickInfoValue, isDark && styles.textDark]} numberOfLines={1}>
              {EQUIPMENT_LABELS[exercice.equipment] || exercice.equipment}
            </Text>
          </View>

        </View>

        {/* Muscles travailles */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="body" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Muscles cibles</Text>
          </View>

          <View style={styles.musclesContainer}>
            {/* Muscle principal */}
            <View style={[styles.muscleTag, styles.primaryMuscle]}>
              <Ionicons name="star" size={12} color="#FFF" />
              <Text style={styles.primaryMuscleText}>
                {MUSCLE_LABELS[exercice.muscle] || exercice.muscle}
              </Text>
            </View>

            {/* Muscles secondaires */}
            {exercice.secondary && exercice.secondary.map((muscle, index) => (
              <View key={index} style={[styles.muscleTag, styles.secondaryMuscle, isDark && styles.secondaryMuscleDark]}>
                <Text style={[styles.secondaryMuscleText, isDark && styles.textDark]}>
                  {MUSCLE_LABELS[muscle] || muscle}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Execution</Text>
          </View>

          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <Text style={[styles.instructionText, isDark && styles.textDark]}>
                {instruction}
              </Text>
            </View>
          ))}
        </View>

        {/* Conseil */}
        <View style={[styles.tipSection, isDark && styles.tipSectionDark]}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={20} color="#FFC107" />
            <Text style={[styles.tipTitle, isDark && styles.textDark]}>Conseil Pro</Text>
          </View>
          <Text style={[styles.tipText, isDark && styles.textMutedDark]}>{tip}</Text>
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
    backgroundColor: '#121212',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAction: {
    backgroundColor: theme.colors.primary,
  },
  addActionDone: {
    backgroundColor: '#22C55E',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 180,
  },

  // Image
  imageContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  exerciseImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
  },

  // Type badge
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  typeBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Quick info
  quickInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
  },
  quickInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#999',
  },
  quickInfoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  // Sections
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Muscles
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  primaryMuscle: {
    backgroundColor: theme.colors.primary,
  },
  primaryMuscleText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  secondaryMuscle: {
    backgroundColor: '#F0F0F0',
  },
  secondaryMuscleDark: {
    backgroundColor: '#333',
  },
  secondaryMuscleText: {
    color: '#666',
    fontSize: 13,
  },

  // Instructions
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Tip
  tipSection: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipSectionDark: {
    backgroundColor: '#2A2500',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Text colors
  textDark: {
    color: '#FFF',
  },
  textMutedDark: {
    color: '#888',
  },
});
