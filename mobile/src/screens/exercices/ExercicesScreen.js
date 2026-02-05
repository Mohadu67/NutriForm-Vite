import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../../theme';
import { BodyPicker, ZONE_LABELS } from '../../components/BodyPicker';
import { useWorkout } from '../../contexts/WorkoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { getExercises } from '../../api/exercises';
import { getSessions } from '../../api/workouts';
import useExerciseFilters from '../../hooks/useExerciseFilters';
import logger from '../../services/logger';

// Cle storage pour favoris
const FAVORITES_KEY = '@exercices_favorites';

// Base de donnees locale des exercices
const EXERCICES_DATA = [
  // PECTORAUX
  { id: 'bench-press', name: 'Developpe couche', muscle: 'pectoraux', secondary: ['triceps', 'epaules'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'incline-bench', name: 'Developpe incline', muscle: 'pectoraux', secondary: ['epaules', 'triceps'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'decline-bench', name: 'Developpe decline', muscle: 'pectoraux', secondary: ['triceps'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'dumbbell-fly', name: 'Ecarte couche', muscle: 'pectoraux', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'cable-crossover', name: 'Cable crossover', muscle: 'pectoraux', secondary: [], equipment: 'poulie', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'push-ups', name: 'Pompes', muscle: 'pectoraux', secondary: ['triceps', 'epaules'], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'dips-chest', name: 'Dips pectoraux', muscle: 'pectoraux', secondary: ['triceps'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },

  // DOS
  { id: 'pull-ups', name: 'Tractions', muscle: 'dos-superieur', secondary: ['biceps'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'lat-pulldown', name: 'Tirage vertical', muscle: 'dos-superieur', secondary: ['biceps'], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'barbell-row', name: 'Rowing barre', muscle: 'dos-inferieur', secondary: ['biceps'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'dumbbell-row', name: 'Rowing haltere', muscle: 'dos-inferieur', secondary: ['biceps'], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'seated-row', name: 'Tirage horizontal', muscle: 'dos-inferieur', secondary: ['biceps'], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'deadlift', name: 'Souleve de terre', muscle: 'dos-inferieur', secondary: ['fessiers', 'cuisses-externes'], equipment: 'barre', difficulty: 'avance', type: 'muscu', image: null },
  { id: 'face-pull', name: 'Face pull', muscle: 'dos-superieur', secondary: ['epaules'], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },

  // EPAULES
  { id: 'overhead-press', name: 'Developpe militaire', muscle: 'epaules', secondary: ['triceps'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'dumbbell-shoulder', name: 'Developpe epaules', muscle: 'epaules', secondary: ['triceps'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'lateral-raise', name: 'Elevations laterales', muscle: 'epaules', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'front-raise', name: 'Elevations frontales', muscle: 'epaules', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'rear-delt-fly', name: 'Oiseau', muscle: 'epaules', secondary: ['dos-superieur'], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'arnold-press', name: 'Arnold press', muscle: 'epaules', secondary: ['triceps'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'shrugs', name: 'Shrugs', muscle: 'dos-superieur', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'pike-pushups', name: 'Pompes pike', muscle: 'epaules', secondary: ['triceps'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'handstand-pushups', name: 'Pompes poirier', muscle: 'epaules', secondary: ['triceps'], equipment: 'poids_corps', difficulty: 'avance', type: 'poids_du_corps', image: null },

  // BICEPS
  { id: 'barbell-curl', name: 'Curl barre', muscle: 'biceps', secondary: [], equipment: 'barre', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'dumbbell-curl', name: 'Curl halteres', muscle: 'biceps', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'hammer-curl', name: 'Curl marteau', muscle: 'biceps', secondary: ['avant-bras'], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'preacher-curl', name: 'Curl pupitre', muscle: 'biceps', secondary: [], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'concentration-curl', name: 'Curl concentration', muscle: 'biceps', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'cable-curl', name: 'Curl poulie', muscle: 'biceps', secondary: [], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'chin-ups', name: 'Tractions supination', muscle: 'biceps', secondary: ['dos-superieur'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },

  // TRICEPS
  { id: 'triceps-pushdown', name: 'Pushdown triceps', muscle: 'triceps', secondary: [], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'skull-crushers', name: 'Barre au front', muscle: 'triceps', secondary: [], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'overhead-triceps', name: 'Extension triceps', muscle: 'triceps', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'dips-triceps', name: 'Dips triceps', muscle: 'triceps', secondary: ['pectoraux'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'close-grip-bench', name: 'Developpe serre', muscle: 'triceps', secondary: ['pectoraux'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'kickback', name: 'Kickback', muscle: 'triceps', secondary: [], equipment: 'halteres', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'diamond-pushups', name: 'Pompes diamant', muscle: 'triceps', secondary: ['pectoraux'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'bench-dips', name: 'Dips sur banc', muscle: 'triceps', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },

  // JAMBES - QUADRICEPS
  { id: 'squat', name: 'Squat', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'front-squat', name: 'Front squat', muscle: 'cuisses-externes', secondary: ['abdos-centre'], equipment: 'barre', difficulty: 'avance', type: 'muscu', image: null },
  { id: 'leg-press', name: 'Presse a cuisses', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'leg-extension', name: 'Leg extension', muscle: 'cuisses-externes', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'lunges', name: 'Fentes', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'bulgarian-split', name: 'Split squat bulgare', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'pistol-squat', name: 'Pistol squat', muscle: 'cuisses-externes', secondary: ['fessiers'], equipment: 'poids_corps', difficulty: 'avance', type: 'poids_du_corps', image: null },
  { id: 'jump-squat', name: 'Jump squat', muscle: 'cuisses-externes', secondary: ['fessiers', 'mollets'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'wall-sit', name: 'Chaise', muscle: 'cuisses-externes', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },

  // JAMBES - ISCHIO
  { id: 'leg-curl', name: 'Leg curl', muscle: 'cuisses-internes', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'romanian-deadlift', name: 'Souleve de terre roumain', muscle: 'cuisses-internes', secondary: ['fessiers', 'dos-inferieur'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'good-morning', name: 'Good morning', muscle: 'cuisses-internes', secondary: ['dos-inferieur'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'nordic-curl', name: 'Nordic curl', muscle: 'cuisses-internes', secondary: [], equipment: 'poids_corps', difficulty: 'avance', type: 'poids_du_corps', image: null },

  // FESSIERS
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'fessiers', secondary: ['cuisses-internes'], equipment: 'barre', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'glute-bridge', name: 'Pont fessier', muscle: 'fessiers', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'cable-kickback', name: 'Kickback fessier', muscle: 'fessiers', secondary: [], equipment: 'poulie', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'sumo-squat', name: 'Squat sumo', muscle: 'fessiers', secondary: ['cuisses-internes'], equipment: 'halteres', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'donkey-kicks', name: 'Donkey kicks', muscle: 'fessiers', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'fire-hydrant', name: 'Fire hydrant', muscle: 'fessiers', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },

  // MOLLETS
  { id: 'standing-calf', name: 'Mollets debout', muscle: 'mollets', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'seated-calf', name: 'Mollets assis', muscle: 'mollets', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'calf-press', name: 'Presse mollets', muscle: 'mollets', secondary: [], equipment: 'machine', difficulty: 'debutant', type: 'muscu', image: null },
  { id: 'single-leg-calf', name: 'Mollets unilateral', muscle: 'mollets', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },

  // ABDOS
  { id: 'crunch', name: 'Crunch', muscle: 'abdos-centre', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'plank', name: 'Planche', muscle: 'abdos-centre', secondary: ['abdos-lateraux'], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'leg-raise', name: 'Releve de jambes', muscle: 'abdos-centre', secondary: [], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'russian-twist', name: 'Russian twist', muscle: 'abdos-lateraux', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'bicycle-crunch', name: 'Crunch bicyclette', muscle: 'abdos-lateraux', secondary: ['abdos-centre'], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'cable-crunch', name: 'Crunch poulie', muscle: 'abdos-centre', secondary: [], equipment: 'poulie', difficulty: 'intermediaire', type: 'muscu', image: null },
  { id: 'ab-wheel', name: 'Roue abdominale', muscle: 'abdos-centre', secondary: [], equipment: 'accessoire', difficulty: 'avance', type: 'poids_du_corps', image: null },
  { id: 'mountain-climbers', name: 'Mountain climbers', muscle: 'abdos-centre', secondary: ['epaules'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'dead-bug', name: 'Dead bug', muscle: 'abdos-centre', secondary: [], equipment: 'poids_corps', difficulty: 'debutant', type: 'poids_du_corps', image: null },
  { id: 'v-ups', name: 'V-ups', muscle: 'abdos-centre', secondary: [], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'side-plank', name: 'Planche laterale', muscle: 'abdos-lateraux', secondary: [], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'poids_du_corps', image: null },
  { id: 'hanging-leg-raise', name: 'Releve jambes suspendu', muscle: 'abdos-centre', secondary: [], equipment: 'poids_corps', difficulty: 'avance', type: 'poids_du_corps', image: null },

  // CARDIO
  { id: 'running', name: 'Course a pied', muscle: 'cardio', secondary: ['cuisses-externes', 'mollets'], equipment: 'aucun', difficulty: 'debutant', type: 'cardio', image: null },
  { id: 'cycling', name: 'Velo', muscle: 'cardio', secondary: ['cuisses-externes'], equipment: 'velo', difficulty: 'debutant', type: 'cardio', image: null },
  { id: 'rowing-machine', name: 'Rameur', muscle: 'cardio', secondary: ['dos-inferieur', 'biceps'], equipment: 'rameur', difficulty: 'intermediaire', type: 'cardio', image: null },
  { id: 'jump-rope', name: 'Corde a sauter', muscle: 'cardio', secondary: ['mollets'], equipment: 'corde', difficulty: 'debutant', type: 'cardio', image: null },
  { id: 'burpees', name: 'Burpees', muscle: 'cardio', secondary: ['pectoraux', 'cuisses-externes'], equipment: 'poids_corps', difficulty: 'intermediaire', type: 'cardio', image: null },
  { id: 'jumping-jacks', name: 'Jumping jacks', muscle: 'cardio', secondary: [], equipment: 'aucun', difficulty: 'debutant', type: 'cardio', image: null },
  { id: 'high-knees', name: 'Montees de genoux', muscle: 'cardio', secondary: ['abdos-centre'], equipment: 'aucun', difficulty: 'debutant', type: 'cardio', image: null },
  { id: 'box-jumps', name: 'Box jumps', muscle: 'cardio', secondary: ['cuisses-externes', 'mollets'], equipment: 'accessoire', difficulty: 'intermediaire', type: 'cardio', image: null },
  { id: 'stair-climber', name: 'Escalier', muscle: 'cardio', secondary: ['cuisses-externes', 'fessiers'], equipment: 'machine', difficulty: 'intermediaire', type: 'cardio', image: null },
  { id: 'battle-ropes', name: 'Battle ropes', muscle: 'cardio', secondary: ['epaules', 'abdos-centre'], equipment: 'accessoire', difficulty: 'intermediaire', type: 'cardio', image: null },

  // ETIREMENTS
  { id: 'stretch-quad', name: 'Etirement quadriceps', muscle: 'cuisses-externes', secondary: [], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
  { id: 'stretch-hamstring', name: 'Etirement ischio-jambiers', muscle: 'cuisses-internes', secondary: [], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
  { id: 'stretch-chest', name: 'Etirement pectoraux', muscle: 'pectoraux', secondary: [], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
  { id: 'stretch-back', name: 'Etirement dos', muscle: 'dos-superieur', secondary: ['dos-inferieur'], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
  { id: 'stretch-shoulder', name: 'Etirement epaules', muscle: 'epaules', secondary: [], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
  { id: 'stretch-hip', name: 'Etirement hanches', muscle: 'fessiers', secondary: ['cuisses-internes'], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
  { id: 'child-pose', name: 'Posture de l\'enfant', muscle: 'dos-inferieur', secondary: ['epaules'], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
  { id: 'cat-cow', name: 'Chat-vache', muscle: 'dos-inferieur', secondary: ['abdos-centre'], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
  { id: 'pigeon-pose', name: 'Posture du pigeon', muscle: 'fessiers', secondary: ['cuisses-internes'], equipment: 'aucun', difficulty: 'intermediaire', type: 'etirement', image: null },
  { id: 'cobra-stretch', name: 'Etirement cobra', muscle: 'abdos-centre', secondary: ['dos-inferieur'], equipment: 'aucun', difficulty: 'debutant', type: 'etirement', image: null },
];

// Mapping muscles vers zones body picker (avec variantes API)
const MUSCLE_TO_ZONE = {
  // Format local
  'pectoraux': 'pectoraux',
  'dos-superieur': 'dos-superieur',
  'dos-inferieur': 'dos-inferieur',
  'epaules': 'epaules',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'avant-bras': 'avant-bras',
  'cuisses-externes': 'cuisses-externes',
  'cuisses-internes': 'cuisses-internes',
  'fessiers': 'fessiers',
  'mollets': 'mollets',
  'abdos-centre': 'abdos-centre',
  'abdos-lateraux': 'abdos-lateraux',
  'cardio': 'cardio',

  // Variantes possibles de l'API
  'chest': 'pectoraux',
  'pecs': 'pectoraux',
  'back': 'dos-superieur',
  'upper-back': 'dos-superieur',
  'lower-back': 'dos-inferieur',
  'shoulders': 'epaules',
  'arms': 'biceps',
  'forearms': 'avant-bras',
  'quads': 'cuisses-externes',
  'quadriceps': 'cuisses-externes',
  'hamstrings': 'cuisses-internes',
  // Adducteurs et Abducteurs
  'adducteurs': 'cuisses-internes',
  'adductor': 'cuisses-internes',
  'abducteurs': 'cuisses-externes',
  'abductor': 'cuisses-externes',
  'glutes': 'fessiers',
  'calves': 'mollets',
  'abs': 'abdos-centre',
  'core': 'abdos-centre',
  'obliques': 'abdos-lateraux',
};

const MUSCLE_LABELS = {
  'pectoraux': 'Pectoraux',
  'dos-superieur': 'Dos superieur',
  'dos-inferieur': 'Dos inferieur',
  'epaules': 'Epaules',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'avant-bras': 'Avant-bras',
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
  'corde': 'Corde',
  'accessoire': 'Accessoire',
};

const DIFFICULTY_LABELS = {
  'debutant': { label: 'Debutant', color: '#22C55E' },
  'intermediaire': { label: 'Intermediaire', color: '#F59E0B' },
  'avance': { label: 'Avance', color: '#EF4444' },
};

const TYPE_CONFIG = {
  'muscu': { label: 'Muscu', icon: 'barbell', color: '#F7B186' },
  'poids_du_corps': { label: 'Poids du corps', icon: 'body', color: '#06B6D4' },
  'cardio': { label: 'Cardio', icon: 'heart', color: '#EF4444' },
  'etirement': { label: 'Etirement', icon: 'flower', color: '#10B981' },
};

const EQUIPMENT_LIST = ['barre', 'halteres', 'poulie', 'machine', 'poids_corps', 'aucun'];

export default function ExercicesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useAuth();
  const { currentWorkout, isWorkoutActive, getCompletedSetsCount, getTotalSetsCount, addExercise, isExerciseInWorkout, startWorkout } = useWorkout();

  // Compteur de séances restantes pour les utilisateurs free
  const MAX_SESSIONS_FREE = 5;
  const isUserFree = user?.subscriptionTier === 'free';

  // DEBUG
  useEffect(() => {
    console.log('[EXERCICES DEBUG] User subscription:', {
      tier: user?.subscriptionTier,
      isUserFree,
      user: user
    });
  }, [user]);

  const [showBodyPicker, setShowBodyPicker] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);

  // API states
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Utiliser le hook de filtrage pour gérer tous les filtres
  const {
    searchText,
    selectedMuscles,
    selectedEquipments,
    selectedTypes,
    showFavoritesOnly,
    setSearchText,
    setSelectedMuscles,
    setSelectedEquipments,
    setSelectedTypes,
    setShowFavoritesOnly,
    filteredExercises,
    activeFiltersCount,
    clearFilters,
  } = useExerciseFilters({ exercises, favorites });

  // Charger les exercices depuis l'API au demarrage
  useEffect(() => {
    loadExercises();
    loadFavorites();
    loadSessionCount();
  }, []);

  // Charger le nombre total de séances complétées
  const loadSessionCount = async () => {
    try {
      const result = await getSessions({ limit: 1000 });
      if (result.success && result.data) {
        const count = result.data.length;
        setTotalSessions(count);
        console.log('[SESSIONS COUNT] Total sessions loaded:', count);
      }
    } catch (error) {
      console.error('Error loading session count:', error);
    }
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getExercises({ limit: 200 });

      if (result.success && result.data.length > 0) {
        // Transformer les donnees API vers le format attendu
        const formattedExercises = result.data.map(exo => {
          // Normaliser le type de l'exercice
          let exerciseType = 'muscu'; // valeur par défaut

          // Le champ type est un tableau, chercher le type le plus spécifique
          const types = exo.type || [exo.category];

          // Mapper les différents formats de types de l'API
          const typeMap = {
            'poids-du-corps': 'poids_du_corps',
            'poids du corps': 'poids_du_corps',
            'bodyweight': 'poids_du_corps',
            'stretching': 'etirement',
            'étirement': 'etirement',
            'cardio': 'cardio',
            'hiit': 'cardio',
            'muscu': 'muscu',
            'musculation': 'muscu',
          };

          // Prioriser poids_du_corps si présent dans le tableau type
          const hasBodyweight = types.some(t =>
            ['poids-du-corps', 'poids du corps', 'bodyweight'].includes(t?.toLowerCase())
          );

          if (hasBodyweight) {
            exerciseType = 'poids_du_corps';
          } else if (types.length > 0) {
            // Sinon prendre le premier type et le mapper
            const apiType = types[0];
            exerciseType = typeMap[apiType?.toLowerCase()] || apiType;
          }

          // Normaliser le muscle principal via le mapping
          const normalizeMuscle = (muscleName) => {
            if (!muscleName) return 'abdos-centre'; // défaut
            const normalized = muscleName.toLowerCase().replace(/\s+/g, '-');
            return MUSCLE_TO_ZONE[normalized] || MUSCLE_TO_ZONE[muscleName.toLowerCase()] || normalized;
          };

          // Normaliser l'équipement
          const normalizeEquipment = (equipmentName) => {
            if (!equipmentName) return 'aucun';
            const equipMap = {
              'poids-du-corps': 'poids_corps',
              'poids du corps': 'poids_corps',
              'bodyweight': 'poids_corps',
              'body weight': 'poids_corps',
              'barre': 'barre',
              'barbell': 'barre',
              'halteres': 'halteres',
              'haltère': 'halteres',
              'haltères': 'halteres',
              'dumbbell': 'halteres',
              'dumbbells': 'halteres',
              'poulie': 'poulie',
              'cable': 'poulie',
              'machine': 'machine',
              'aucun': 'aucun',
              'none': 'aucun',
            };
            const normalized = equipmentName.toLowerCase().trim();
            return equipMap[normalized] || normalized;
          };

          const primaryMuscle = normalizeMuscle(exo.primaryMuscle);
          const secondaryMuscles = (exo.secondaryMuscles || []).map(m => normalizeMuscle(m));
          const allMuscles = (exo.muscles || [exo.primaryMuscle]).map(m => normalizeMuscle(m));
          const normalizedEquipment = normalizeEquipment(exo.equipment?.[0] || 'aucun');

          return {
            id: exo.slug || exo.exoId,
            exoId: exo.exoId,
            name: exo.name,
            muscle: primaryMuscle,
            secondary: secondaryMuscles,
            muscles: allMuscles,
            equipment: normalizedEquipment,
            equipmentList: (exo.equipment || []).map(e => normalizeEquipment(e)),
            difficulty: exo.difficulty || 'intermediaire',
            type: exerciseType,
            category: exo.category,
            image: exo.mainImage,
            explanation: exo.explanation,
            slug: exo.slug,
          };
        });
        setExercises(formattedExercises);
        logger.exercises.info(`Loaded ${formattedExercises.length} exercises from API`);

        // Debug: afficher quelques muscles pour vérifier le mapping
        if (formattedExercises.length > 0) {
          const uniqueMuscles = [...new Set(formattedExercises.map(ex => ex.muscle))];
          logger.exercises.debug('Unique muscles', uniqueMuscles.slice(0, 10));

          // Debug: afficher tous les équipements uniques
          const uniqueEquipments = [...new Set(formattedExercises.map(ex => ex.equipment))];
          logger.exercises.debug('Unique equipments found', uniqueEquipments);

          // Debug: afficher quelques exemples d'exercices avec leurs équipements
          const samples = formattedExercises.slice(0, 5).map(ex => ({
            name: ex.name,
            equipment: ex.equipment,
            type: ex.type,
            muscle: ex.muscle
          }));
          logger.exercises.debug('Sample exercises', samples);
        }
      } else {
        // Fallback vers donnees locales
        logger.exercises.warn('API failed, using local data');
        setExercises(EXERCICES_DATA);
      }
    } catch (err) {
      logger.exercises.error('Error loading exercises', err);
      setError(err.message);
      setExercises(EXERCICES_DATA);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      logger.storage.error('Error loading favorites', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      logger.storage.error('Error saving favorites', error);
    }
  };

  const toggleFavorite = useCallback((exerciceId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(exerciceId)
        ? prev.filter(id => id !== exerciceId)
        : [...prev, exerciceId];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  // Toggle type selection
  const toggleType = useCallback((type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Toggle equipment selection
  const toggleEquipment = useCallback((equipment) => {
    setSelectedEquipments(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  }, []);

  // Le filtrage est maintenant géré par le hook useExerciseFilters

  const handleExercicePress = useCallback((exercice) => {
    navigation.navigate('ExerciceDetail', { exercice, favorites, onToggleFavorite: toggleFavorite });
  }, [navigation, favorites, toggleFavorite]);

  // Ajout rapide d'un exercice a la seance (sans demarrer le chrono)
  const handleQuickAddExercise = useCallback((exercice) => {
    // Ajouter l'exercice (cree une preparation si aucune seance en cours)
    // Le chrono ne demarre que quand l'utilisateur le decide
    addExercise(exercice);
  }, [addExercise]);

  const handleApplyFilter = useCallback(() => {
    setShowBodyPicker(false);
  }, []);

  const handleClearMuscles = useCallback(() => {
    setSelectedMuscles([]);
  }, []);

  // clearFilters est maintenant géré par clearFilters du hook

  // Render exercice item
  const renderExercice = useCallback(({ item }) => {
    const difficulty = DIFFICULTY_LABELS[item.difficulty] || DIFFICULTY_LABELS.intermediaire;
    const muscleLabel = ZONE_LABELS[MUSCLE_TO_ZONE[item.muscle]] || item.muscle;
    const isFavorite = favorites.includes(item.id);
    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.muscu;
    const isInWorkout = isExerciseInWorkout(item.id);

    return (
      <TouchableOpacity
        style={[styles.exerciceCard, isDark && styles.exerciceCardDark]}
        onPress={() => handleExercicePress(item)}
        activeOpacity={0.7}
      >
        {/* Image ou placeholder */}
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.exerciceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.exerciceImage, { backgroundColor: `${typeConfig.color}15` }]}>
            <Ionicons name={typeConfig.icon} size={28} color={typeConfig.color} />
          </View>
        )}

        {/* Info */}
        <View style={styles.exerciceInfo}>
          <Text style={[styles.exerciceName, isDark && styles.exerciceNameDark]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.exerciceMuscle, isDark && styles.exerciceMuscleDark]}>
            {muscleLabel}
          </Text>
          <View style={styles.exerciceTags}>
            <View style={[styles.difficultyTag, { backgroundColor: `${difficulty.color}20` }]}>
              <Text style={[styles.difficultyText, { color: difficulty.color }]}>
                {difficulty.label}
              </Text>
            </View>
            <Text style={[styles.equipmentText, isDark && styles.equipmentTextDark]}>
              {EQUIPMENT_LABELS[item.equipment]}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.exerciceActions}>
          {/* Quick add button */}
          <TouchableOpacity
            style={[
              styles.quickAddButton,
              isInWorkout && styles.quickAddButtonActive,
            ]}
            onPress={() => !isInWorkout && handleQuickAddExercise(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isInWorkout}
          >
            <Ionicons
              name={isInWorkout ? 'checkmark' : 'add'}
              size={18}
              color="#FFF"
            />
          </TouchableOpacity>

          {/* Favorite button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#EF4444' : (isDark ? '#555' : '#CCC')}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [isDark, favorites, handleExercicePress, toggleFavorite, isExerciseInWorkout, handleQuickAddExercise]);

  const ListHeader = useMemo(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, isDark && styles.textDark]}>Exercices</Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {filteredExercises.length} exercice{filteredExercises.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {/* Favorites toggle */}
          <TouchableOpacity
            style={[
              styles.favoritesToggle,
              showFavoritesOnly && styles.favoritesToggleActive,
              isDark && !showFavoritesOnly && styles.favoritesToggleDark,
            ]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Ionicons
              name={showFavoritesOnly ? 'heart' : 'heart-outline'}
              size={20}
              color={showFavoritesOnly ? '#FFF' : (isDark ? '#888' : '#666')}
            />
            {favorites.length > 0 && (
              <Text style={[
                styles.favoritesCount,
                showFavoritesOnly && styles.favoritesCountActive,
                isDark && !showFavoritesOnly && styles.favoritesCountDark,
              ]}>
                {favorites.length}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, isDark && styles.cardDark]}>
        <Ionicons name="search" size={20} color={isDark ? '#888' : theme.colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, isDark && styles.textDark]}
          placeholder="Rechercher un exercice..."
          placeholderTextColor={isDark ? '#888' : theme.colors.text.tertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={isDark ? '#888' : theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Compteur de séances pour users free */}
      {isUserFree && (
        <TouchableOpacity
          style={[
            styles.sessionsCounterCard,
            isDark && styles.sessionsCounterCardDark,
            totalSessions >= MAX_SESSIONS_FREE && styles.sessionsCounterCardLimitReached
          ]}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'Subscription' })}
          activeOpacity={0.7}
        >
          <View style={styles.sessionsCounterContent}>
            <Ionicons
              name={totalSessions >= MAX_SESSIONS_FREE ? 'warning' : 'flash'}
              size={20}
              color={totalSessions >= MAX_SESSIONS_FREE ? '#EF4444' : '#F7B186'}
            />
            <View style={styles.sessionsCounterText}>
              <Text style={[styles.sessionsCounterLabel, isDark && styles.textDark]}>
                {totalSessions >= MAX_SESSIONS_FREE ? 'Limite atteinte' : 'Séances enregistrées'}
              </Text>
              <Text
                style={[
                  styles.sessionsCounterValue,
                  isDark && styles.textMutedDark,
                  totalSessions >= MAX_SESSIONS_FREE && styles.sessionsCounterValueWarning
                ]}
              >
                {totalSessions}/{MAX_SESSIONS_FREE}
              </Text>
            </View>
          </View>
          <View style={styles.sessionsCounterProgress}>
            <View
              style={[
                styles.progressBar,
                totalSessions >= MAX_SESSIONS_FREE && styles.progressBarFull,
                { width: `${Math.min(100, (totalSessions / MAX_SESSIONS_FREE) * 100)}%` }
              ]}
            />
          </View>
          <Text style={[styles.sessionsCounterCTA, totalSessions >= MAX_SESSIONS_FREE && styles.sessionsCounterCTAWarning]}>
            {totalSessions >= MAX_SESSIONS_FREE ? 'Devenez Premium' : 'Passer Premium →'}
          </Text>
          {totalSessions >= MAX_SESSIONS_FREE && (
            <Text style={[styles.sessionsCounterWarningText, isDark && styles.textMutedDark]}>
              Les nouvelles séances ne seront pas sauvegardées
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Type filter tabs - Multi-selection */}
      <View style={styles.filterSectionHeader}>
        <Text style={[styles.filterSectionTitle, isDark && styles.textMutedDark]}>Type d'exercice</Text>
        {selectedTypes.length > 0 && (
          <TouchableOpacity onPress={() => setSelectedTypes([])}>
            <Text style={[styles.clearSectionText, isDark && styles.clearSectionTextDark]}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeScroll}
        contentContainerStyle={styles.typeScrollContent}
      >
        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const isSelected = selectedTypes.includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.typeTab,
                isDark && styles.typeTabDark,
                isSelected && styles.typeTabActive,
                isSelected && isDark && styles.typeTabActiveDark,
              ]}
              onPress={() => toggleType(key)}
            >
              {isSelected && (
                <Ionicons name="checkmark-circle" size={16} color={isDark ? '#F7B186' : theme.colors.primary} />
              )}
              <Ionicons
                name={config.icon}
                size={18}
                color={isSelected ? (isDark ? '#F7B186' : theme.colors.primary) : (isDark ? '#9CA3AF' : '#6B7280')}
              />
              <Text style={[
                styles.typeTabText,
                isDark && styles.typeTabTextDark,
                isSelected && styles.typeTabTextActive,
                isSelected && isDark && styles.typeTabTextActiveDark,
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Equipment filter - Multi-selection */}
      <View style={styles.filterSectionHeader}>
        <Text style={[styles.filterSectionTitle, isDark && styles.textMutedDark]}>Équipement</Text>
        {selectedEquipments.length > 0 && (
          <TouchableOpacity onPress={() => setSelectedEquipments([])}>
            <Text style={[styles.clearSectionText, isDark && styles.clearSectionTextDark]}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.equipmentScroll}
        contentContainerStyle={styles.equipmentScrollContent}
      >
        {EQUIPMENT_LIST.map((equip) => {
          const isSelected = selectedEquipments.includes(equip);
          return (
            <TouchableOpacity
              key={equip}
              style={[
                styles.equipmentChip,
                isDark && styles.equipmentChipDark,
                isSelected && styles.equipmentChipActive,
                isSelected && isDark && styles.equipmentChipActiveDark,
              ]}
              onPress={() => toggleEquipment(equip)}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={14} color={isDark ? '#F7B186' : theme.colors.primary} style={{ marginRight: 4 }} />
              )}
              <Text style={[
                styles.equipmentChipText,
                isDark && styles.equipmentChipTextDark,
                isSelected && styles.equipmentChipTextActive,
                isSelected && isDark && styles.equipmentChipTextActiveDark,
              ]}>
                {EQUIPMENT_LABELS[equip]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filter by muscle button */}
      <TouchableOpacity
        style={[styles.filterButton, isDark && styles.cardDark]}
        onPress={() => setShowBodyPicker(true)}
        activeOpacity={0.7}
      >
        <View style={styles.filterButtonContent}>
          <View style={[styles.filterIconContainer, selectedMuscles.length > 0 && styles.filterIconContainerActive]}>
            <Ionicons name="body" size={22} color={selectedMuscles.length > 0 ? '#FFF' : theme.colors.primary} />
          </View>
          <View style={styles.filterTextContainer}>
            <Text style={[styles.filterTitle, isDark && styles.textDark]}>
              Filtrer par muscle
            </Text>
            <Text style={[styles.filterSubtitle, isDark && styles.subtitleDark]} numberOfLines={1}>
              {selectedMuscles.length > 0
                ? selectedMuscles.map(id => ZONE_LABELS[id]).join(', ')
                : 'Selectionne les zones a travailler'}
            </Text>
          </View>
        </View>
        {selectedMuscles.length > 0 ? (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{selectedMuscles.length}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : theme.colors.text.tertiary} />
        )}
      </TouchableOpacity>

      {/* Active filters summary */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersRow}>
          <Text style={[styles.activeFiltersText, isDark && styles.activeFiltersTextDark]}>
            {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Effacer tout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results header */}
      <Text style={[styles.resultsHeader, isDark && styles.resultsHeaderDark]}>
        {showFavoritesOnly ? 'Mes favoris' : (activeFiltersCount > 0 || searchText ? 'Resultats' : 'Tous les exercices')}
      </Text>
    </>
  ), [isDark, filteredExercises.length, showFavoritesOnly, favorites, searchText, selectedTypes, selectedEquipments, selectedMuscles, activeFiltersCount]);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, isDark && styles.emptyIconContainerDark]}>
        <Ionicons
          name={showFavoritesOnly ? 'heart-outline' : 'search-outline'}
          size={48}
          color={isDark ? '#555' : '#CCC'}
        />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
        {showFavoritesOnly ? 'Aucun favori' : 'Aucun exercice trouve'}
      </Text>
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        {showFavoritesOnly
          ? 'Ajoute des exercices a tes favoris en appuyant sur le coeur'
          : 'Essaie de modifier tes filtres ou ta recherche'}
      </Text>
      {(activeFiltersCount > 0 || searchText) && (
        <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
          <Text style={styles.emptyButtonText}>Effacer les filtres</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
            Chargement des exercices...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercice}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshing={loading}
        onRefresh={loadExercises}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {/* Modal Body Picker */}
      <Modal
        visible={showBodyPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBodyPicker(false)}
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.containerDark]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
            <TouchableOpacity onPress={() => setShowBodyPicker(false)}>
              <Ionicons name="close" size={28} color={isDark ? '#FFF' : theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>
              Selectionner les muscles
            </Text>
            <TouchableOpacity onPress={handleClearMuscles}>
              <Text style={styles.modalReset}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Body Picker */}
          <FlatList
            data={[1]}
            keyExtractor={() => 'body-picker'}
            renderItem={() => (
              <View style={styles.bodyPickerContainer}>
                <BodyPicker
                  value={selectedMuscles}
                  onChange={setSelectedMuscles}
                  multiple={true}
                  showLabels={true}
                  height={380}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />

          {/* Apply Button */}
          <View style={[styles.modalFooter, isDark && styles.modalFooterDark]}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilter}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>
                {selectedMuscles.length > 0
                  ? `Voir ${filteredExercises.length} exercice${filteredExercises.length !== 1 ? 's' : ''}`
                  : 'Voir tous les exercices'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Floating Workout Button - affiche si seance active OU en preparation */}
      {currentWorkout && currentWorkout.exercises?.length > 0 && (
        <TouchableOpacity
          style={[
            styles.floatingWorkoutButton,
            !isWorkoutActive && styles.floatingWorkoutButtonPrep,
          ]}
          onPress={() => navigation.navigate('WorkoutSession')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingWorkoutContent}>
            <View style={[
              styles.floatingWorkoutIcon,
              !isWorkoutActive && styles.floatingWorkoutIconPrep,
            ]}>
              <Ionicons name={isWorkoutActive ? 'fitness' : 'list'} size={22} color="#FFF" />
            </View>
            <View style={styles.floatingWorkoutInfo}>
              <Text style={styles.floatingWorkoutTitle}>
                {isWorkoutActive ? 'Seance en cours' : 'Preparation'}
              </Text>
              <Text style={styles.floatingWorkoutSubtitle}>
                {currentWorkout.exercises.length} exercice{currentWorkout.exercises.length > 1 ? 's' : ''}
                {isWorkoutActive && ` • ${getCompletedSetsCount()}/${getTotalSetsCount()} series`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  loadingTextDark: {
    color: '#888',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  subtitleDark: {
    color: '#888888',
  },
  textDark: {
    color: '#FFFFFF',
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    minHeight: 36,
  },
  favoritesToggleActive: {
    backgroundColor: '#EF4444',
  },
  favoritesToggleDark: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  favoritesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  favoritesCountActive: {
    color: '#FFF',
  },
  favoritesCountDark: {
    color: '#CCC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    padding: 0,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearSectionText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  clearSectionTextDark: {
    color: '#F7B186',
  },
  textMutedDark: {
    color: '#9CA3AF',
  },
  typeScroll: {
    marginBottom: theme.spacing.md,
  },
  typeScrollContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  typeTabDark: {
    backgroundColor: '#1F1F1F',
    borderColor: '#333',
  },
  typeTabActive: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  typeTabActiveDark: {
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    borderColor: '#F7B186',
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeTabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  typeTabTextDark: {
    color: '#9CA3AF',
  },
  typeTabTextActiveDark: {
    color: '#F7B186',
  },
  equipmentScroll: {
    marginBottom: theme.spacing.md,
  },
  equipmentScrollContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  equipmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  equipmentChipActive: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  equipmentChipDark: {
    backgroundColor: '#1F1F1F',
    borderColor: '#333',
  },
  equipmentChipActiveDark: {
    backgroundColor: 'rgba(247, 177, 134, 0.15)',
    borderColor: '#F7B186',
  },
  equipmentChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  equipmentChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  equipmentChipTextDark: {
    color: '#9CA3AF',
  },
  equipmentChipTextActiveDark: {
    color: '#F7B186',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconContainerActive: {
    backgroundColor: theme.colors.primary,
  },
  filterTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  filterTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  filterSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  filterBadge: {
    backgroundColor: theme.colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: 4,
  },
  activeFiltersText: {
    fontSize: 13,
    color: '#666',
  },
  activeFiltersTextDark: {
    color: '#888',
  },
  clearFiltersText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  resultsHeader: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  resultsHeaderDark: {
    color: '#FFFFFF',
  },
  exerciceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciceCardDark: {
    backgroundColor: '#2A2A2A',
  },
  exerciceImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  exerciceInfo: {
    flex: 1,
  },
  exerciceName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  exerciceNameDark: {
    color: '#FFFFFF',
  },
  exerciceMuscle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: 2,
  },
  exerciceMuscleDark: {
    color: theme.colors.primary,
  },
  exerciceTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  difficultyTag: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  equipmentText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  equipmentTextDark: {
    color: '#666',
  },
  exerciceActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAddButtonActive: {
    backgroundColor: '#16A34A',
  },
  favoriteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyIconContainerDark: {
    backgroundColor: '#2A2A2A',
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTextDark: {
    color: '#888',
  },
  emptyButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalHeaderDark: {
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalReset: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  bodyPickerContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  modalFooterDark: {
    borderTopColor: '#333',
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },

  // Floating Workout Button
  floatingWorkoutButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingWorkoutButtonPrep: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  floatingWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  floatingWorkoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  floatingWorkoutIconPrep: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  floatingWorkoutInfo: {
    flex: 1,
  },
  floatingWorkoutTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  floatingWorkoutSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  // Compteur de séances
  sessionsCounterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#F7B186',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionsCounterCardDark: {
    backgroundColor: '#1F2937',
    borderLeftColor: '#A78BFA',
  },
  sessionsCounterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sessionsCounterText: {
    flex: 1,
  },
  sessionsCounterLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  sessionsCounterValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#F7B186',
    marginTop: 2,
  },
  sessionsCounterProgress: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F7B186',
    borderRadius: 2,
  },
  sessionsCounterCTA: {
    fontSize: theme.fontSize.sm,
    color: '#F7B186',
    fontWeight: theme.fontWeight.semiBold,
    textAlign: 'right',
  },
  sessionsCounterCardLimitReached: {
    borderLeftColor: '#EF4444',
  },
  sessionsCounterValueWarning: {
    color: '#EF4444',
  },
  progressBarFull: {
    backgroundColor: '#EF4444',
  },
  sessionsCounterCTAWarning: {
    color: '#EF4444',
  },
  sessionsCounterWarningText: {
    fontSize: theme.fontSize.xs,
    color: '#EF4444',
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeight.medium,
  },
});
