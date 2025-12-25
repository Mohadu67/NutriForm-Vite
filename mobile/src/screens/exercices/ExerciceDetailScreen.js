import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const { width } = Dimensions.get('window');

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
  'debutant': { label: 'Debutant', color: '#4CAF50', icon: 'fitness-outline' },
  'intermediaire': { label: 'Intermediaire', color: '#FF9800', icon: 'barbell-outline' },
  'avance': { label: 'Avance', color: '#F44336', icon: 'flame-outline' },
};

// Instructions par defaut selon le type d'exercice
const getDefaultInstructions = (exercice) => {
  const type = exercice.type || 'muscu';
  const muscle = exercice.muscle;

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
    'pectoraux': 'Gardez les omoplates serrees et le dos legerement cambre.',
    'dos-superieur': 'Tirez avec les coudes, pas les mains. Serrez les omoplates.',
    'dos-inferieur': 'Gardez le dos droit et engagez les abdominaux.',
    'epaules': 'Ne montez pas les epaules vers les oreilles pendant l\'effort.',
    'biceps': 'Gardez les coudes fixes le long du corps.',
    'triceps': 'Verrouillez les coudes en haut du mouvement.',
    'cuisses-externes': 'Poussez a travers les talons, genoux alignes avec les pieds.',
    'cuisses-internes': 'Controlez la descente, ne rebondissez pas.',
    'fessiers': 'Serrez les fessiers en haut du mouvement.',
    'mollets': 'Montez sur la pointe des pieds au maximum.',
    'abdos-centre': 'Gardez le bas du dos plaque au sol.',
    'abdos-lateraux': 'Evitez de tirer sur la nuque.',
    'cardio': 'Trouvez votre rythme et maintenez-le.',
  };

  return tipsByMuscle[muscle] || 'Concentrez-vous sur la qualite du mouvement plutot que la quantite.';
};

export default function ExerciceDetailScreen({ navigation, route }) {
  const { exercice } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const difficultyConfig = DIFFICULTY_CONFIG[exercice.difficulty] || DIFFICULTY_CONFIG.intermediaire;
  const instructions = getDefaultInstructions(exercice);
  const tip = getTips(exercice);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleStartExercice = useCallback(() => {
    // TODO: Integrer avec la session d'entrainement
    console.log('Demarrer exercice:', exercice.name);
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
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image/GIF Placeholder */}
        <View style={[styles.imageContainer, isDark && styles.imageContainerDark]}>
          {exercice.image ? (
            <Image source={{ uri: exercice.image }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="fitness" size={80} color={theme.colors.primary} />
              <Text style={[styles.imagePlaceholderText, isDark && styles.textMutedDark]}>
                Animation bientot disponible
              </Text>
            </View>
          )}
        </View>

        {/* Infos rapides */}
        <View style={styles.quickInfoRow}>
          {/* Difficulte */}
          <View style={[styles.quickInfoCard, isDark && styles.cardDark]}>
            <Ionicons name={difficultyConfig.icon} size={24} color={difficultyConfig.color} />
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Niveau</Text>
            <Text style={[styles.quickInfoValue, { color: difficultyConfig.color }]}>
              {difficultyConfig.label}
            </Text>
          </View>

          {/* Equipement */}
          <View style={[styles.quickInfoCard, isDark && styles.cardDark]}>
            <Ionicons name="barbell-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Equipement</Text>
            <Text style={[styles.quickInfoValue, isDark && styles.textDark]}>
              {EQUIPMENT_LABELS[exercice.equipment] || exercice.equipment}
            </Text>
          </View>

          {/* Type */}
          <View style={[styles.quickInfoCard, isDark && styles.cardDark]}>
            <Ionicons
              name={exercice.type === 'cardio' ? 'heart-outline' : exercice.type === 'etirement' ? 'body-outline' : 'trophy-outline'}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Type</Text>
            <Text style={[styles.quickInfoValue, isDark && styles.textDark]}>
              {exercice.type === 'muscu' ? 'Musculation' : exercice.type === 'cardio' ? 'Cardio' : 'Etirement'}
            </Text>
          </View>
        </View>

        {/* Muscles travailles */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            <Ionicons name="body" size={18} color={theme.colors.primary} /> Muscles cibles
          </Text>

          <View style={styles.musclesContainer}>
            {/* Muscle principal */}
            <View style={[styles.muscleTag, styles.primaryMuscle]}>
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
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            <Ionicons name="list" size={18} color={theme.colors.primary} /> Execution
          </Text>

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
            <Text style={[styles.tipTitle, isDark && styles.textDark]}>Conseil</Text>
          </View>
          <Text style={[styles.tipText, isDark && styles.textMutedDark]}>{tip}</Text>
        </View>

        {/* Espace pour le bouton */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton ajouter a la seance */}
      <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartExercice}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={22} color="#FFF" />
          <Text style={styles.startButtonText}>Ajouter a ma seance</Text>
        </TouchableOpacity>
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
  headerSpacer: {
    width: 40,
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
    marginBottom: 16,
    height: 220,
  },
  imageContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
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
    gap: 4,
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  quickInfoValue: {
    fontSize: 13,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  // Muscles
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
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
    fontSize: 14,
  },
  secondaryMuscle: {
    backgroundColor: '#F0F0F0',
  },
  secondaryMuscleDark: {
    backgroundColor: '#333',
  },
  secondaryMuscleText: {
    color: '#666',
    fontSize: 14,
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
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Text colors
  textDark: {
    color: '#FFF',
  },
  textMutedDark: {
    color: '#888',
  },
});
