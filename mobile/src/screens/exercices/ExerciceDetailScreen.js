import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  Animated,
  Vibration,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../theme';
import { useWorkout } from '../../contexts/WorkoutContext';

const { width } = Dimensions.get('window');
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

// Temps de repos recommande
const getRestTime = (exercice) => {
  const difficulty = exercice.difficulty;
  const type = exercice.type;

  if (type === 'cardio' || type === 'etirement') return 30;
  if (difficulty === 'avance') return 120;
  if (difficulty === 'intermediaire') return 90;
  return 60;
};

// Timer Component
const RestTimer = ({ initialTime, onComplete, isDark }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  const timeOptions = [30, 60, 90, 120, 180];

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setIsRunning(true);
    setTimeLeft(selectedTime);
    progressAnim.setValue(1);

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: selectedTime * 1000,
      useNativeDriver: false,
    }).start();

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          Vibration.vibrate([0, 500, 200, 500]);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTimeLeft(selectedTime);
    progressAnim.setValue(1);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.timerContainer, isDark && styles.timerContainerDark]}>
      <View style={styles.timerHeader}>
        <Ionicons name="timer-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.timerTitle, isDark && styles.textDark]}>Temps de repos</Text>
      </View>

      {!isRunning ? (
        <>
          <View style={styles.timeOptionsRow}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  selectedTime === time && styles.timeOptionActive,
                  isDark && selectedTime !== time && styles.timeOptionDark,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeOptionText,
                  selectedTime === time && styles.timeOptionTextActive,
                  isDark && selectedTime !== time && styles.timeOptionTextDark,
                ]}>
                  {formatTime(time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.startTimerButton} onPress={startTimer}>
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.startTimerText}>Demarrer</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.timerDisplay}>
            <Text style={[styles.timerText, isDark && styles.textDark]}>{formatTime(timeLeft)}</Text>
          </View>
          <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <TouchableOpacity style={styles.stopTimerButton} onPress={stopTimer}>
            <Ionicons name="stop" size={20} color="#FFF" />
            <Text style={styles.stopTimerText}>Arreter</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default function ExerciceDetailScreen({ navigation, route }) {
  const { exercice } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { addExercise, isExerciseInWorkout, isWorkoutActive, currentWorkout } = useWorkout();
  const isInWorkout = isExerciseInWorkout(exercice.id);

  const [isFavorite, setIsFavorite] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;

  const difficultyConfig = DIFFICULTY_CONFIG[exercice.difficulty] || DIFFICULTY_CONFIG.intermediaire;
  const typeConfig = TYPE_CONFIG[exercice.type] || TYPE_CONFIG.muscu;
  const instructions = getDefaultInstructions(exercice);
  const tip = getTips(exercice);
  const restTime = getRestTime(exercice);

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
      console.log('Erreur chargement favori:', error);
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
      console.log('Erreur toggle favori:', error);
    }
  };

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAddToWorkout = useCallback(() => {
    if (isInWorkout) {
      // Aller directement a la seance
      navigation.navigate('WorkoutSession');
      return;
    }

    // Animation du bouton
    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();

    // Ajouter l'exercice
    addExercise(exercice);
    Vibration.vibrate(100);

    // Feedback visuel
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 2000);

    // Proposer d'aller a la seance
    Alert.alert(
      'Exercice ajoute !',
      `${exercice.name} a ete ajoute a ta seance.`,
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Voir la seance', onPress: () => navigation.navigate('WorkoutSession') },
      ]
    );
  }, [exercice, isInWorkout, addExercise, navigation, buttonAnim]);

  // Variantes/exercices similaires (meme muscle, difficulte differente)
  const variants = useMemo(() => {
    // Liste simplifiee de variantes basees sur le muscle
    const variantsByMuscle = {
      'pectoraux': ['Pompes', 'Ecarte poulie', 'Developpe machine'],
      'dos-superieur': ['Tirage vertical', 'Rowing machine', 'Pullover'],
      'dos-inferieur': ['Hyperextensions', 'Rowing assis', 'Good morning'],
      'epaules': ['Elevations laterales', 'Face pull', 'Shrugs'],
      'biceps': ['Curl incline', 'Curl concentre', 'Curl poulie'],
      'triceps': ['Pushdown', 'Dips', 'Extension nuque'],
      'cuisses-externes': ['Presse', 'Fentes', 'Leg extension'],
      'cuisses-internes': ['Leg curl', 'Romanian deadlift', 'Good morning'],
      'fessiers': ['Hip thrust', 'Fentes arriere', 'Step ups'],
      'mollets': ['Mollets debout', 'Mollets assis', 'Mollets presse'],
      'abdos-centre': ['Crunch', 'Planche', 'Releve de jambes'],
      'abdos-lateraux': ['Russian twist', 'Planche laterale', 'Woodchop'],
      'cardio': ['Course', 'Velo', 'Rameur', 'Corde a sauter'],
    };

    return (variantsByMuscle[exercice.muscle] || [])
      .filter(v => v.toLowerCase() !== exercice.name.toLowerCase())
      .slice(0, 3);
  }, [exercice]);

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
        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteHeaderButton}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#EF4444' : (isDark ? '#888' : '#666')}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image/GIF de l'exercice */}
        <View style={[styles.imageContainer, isDark && styles.imageContainerDark]}>
          {exercice.image ? (
            <Image
              source={{ uri: exercice.image }}
              style={styles.exerciseImage}
              resizeMode="cover"
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

          {/* Repos */}
          <View style={[styles.quickInfoCard, isDark && styles.cardDark]}>
            <View style={[styles.quickInfoIcon, { backgroundColor: '#06B6D420' }]}>
              <Ionicons name="time-outline" size={20} color="#06B6D4" />
            </View>
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Repos</Text>
            <Text style={[styles.quickInfoValue, isDark && styles.textDark]}>
              {restTime}s
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

        {/* Timer */}
        <RestTimer initialTime={restTime} isDark={isDark} />

        {/* Conseil */}
        <View style={[styles.tipSection, isDark && styles.tipSectionDark]}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={20} color="#FFC107" />
            <Text style={[styles.tipTitle, isDark && styles.textDark]}>Conseil Pro</Text>
          </View>
          <Text style={[styles.tipText, isDark && styles.textMutedDark]}>{tip}</Text>
        </View>

        {/* Variantes */}
        {variants.length > 0 && (
          <View style={[styles.section, isDark && styles.cardDark]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shuffle" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Variantes</Text>
            </View>
            <View style={styles.variantsContainer}>
              {variants.map((variant, index) => (
                <View key={index} style={[styles.variantChip, isDark && styles.variantChipDark]}>
                  <Ionicons name="swap-horizontal" size={14} color={theme.colors.primary} />
                  <Text style={[styles.variantText, isDark && styles.textDark]}>{variant}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Espace pour le bouton */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton ajouter a la seance */}
      <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
        {showAddedFeedback && (
          <View style={styles.addedFeedback}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={styles.addedFeedbackText}>Ajoute a ta seance !</Text>
          </View>
        )}
        <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
          <TouchableOpacity
            style={[
              styles.startButton,
              isInWorkout && styles.viewSessionButton,
            ]}
            onPress={handleAddToWorkout}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isInWorkout ? "fitness" : "add-circle"}
              size={22}
              color="#FFF"
            />
            <Text style={styles.startButtonText}>
              {isInWorkout ? "Voir ma seance" : "Ajouter a ma seance"}
            </Text>
            {isInWorkout && currentWorkout && (
              <View style={styles.exerciseCountBadge}>
                <Text style={styles.exerciseCountText}>
                  {currentWorkout.exercises.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  favoriteHeaderButton: {
    padding: 8,
    marginRight: -8,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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

  // Timer
  timerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timerContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  timeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  timeOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  timeOptionDark: {
    backgroundColor: '#333',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  timeOptionTextActive: {
    color: '#FFF',
  },
  timeOptionTextDark: {
    color: '#888',
  },
  startTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 10,
  },
  startTimerText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  stopTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
  },
  stopTimerText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
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

  // Variants
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
  },
  variantChipDark: {
    backgroundColor: `${theme.colors.primary}30`,
  },
  variantText: {
    fontSize: 13,
    color: '#333',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  bottomBarDark: {
    backgroundColor: '#1E1E1E',
    borderTopColor: '#333',
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  viewSessionButton: {
    backgroundColor: '#22C55E',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseCountBadge: {
    backgroundColor: '#FFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  exerciseCountText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  addedFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  addedFeedbackText: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '500',
  },

  // Text colors
  textDark: {
    color: '#FFF',
  },
  textMutedDark: {
    color: '#888',
  },
});
