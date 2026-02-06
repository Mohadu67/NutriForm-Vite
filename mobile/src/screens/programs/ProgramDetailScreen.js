import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProgram } from '../../contexts/ProgramContext';
import { useAuth } from '../../contexts/AuthContext';
import { getExercise } from '../../api/exercises';
import CycleItem from '../../components/programs/CycleItem';
import RatingDisplay from '../../components/common/RatingDisplay';
import { theme } from '../../theme';

// Configuration des types
const PROGRAM_TYPES = {
  hiit: { label: 'HIIT', icon: 'flash', color: '#EF4444' },
  circuit: { label: 'Circuit', icon: 'reload', color: '#F59E0B' },
  tabata: { label: 'Tabata', icon: 'timer', color: '#22C55E' },
  emom: { label: 'EMOM', icon: 'stopwatch', color: '#3B82F6' },
  amrap: { label: 'AMRAP', icon: 'trending-up', color: '#8B5CF6' },
  superset: { label: 'Superset', icon: 'swap-horizontal', color: '#EC4899' },
  custom: { label: 'Custom', icon: 'construct', color: '#6B7280' },
};

const DIFFICULTIES = {
  'débutant': { label: 'Débutant', color: '#22C55E' },
  'intermédiaire': { label: 'Intermédiaire', color: '#F59E0B' },
  'avancé': { label: 'Avancé', color: '#EF4444' },
};

export default function ProgramDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { programId, program: initialProgram } = route.params || {};
  const { user } = useAuth();
  const {
    fetchProgramById,
    toggleFavorite,
    favorites,
    isPremium,
    deleteProgram,
    proposeProgram,
    unpublishProgram,
    rateProgram,
  } = useProgram();

  const [program, setProgram] = useState(initialProgram);
  const [loading, setLoading] = useState(!initialProgram);
  const [userRating, setUserRating] = useState(initialProgram?.userRating || 0);
  const [enrichedCycles, setEnrichedCycles] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);

  // Cache pour éviter les appels API multiples pour le même exercice
  const exerciseCache = React.useRef({});

  // Enrichir les cycles avec les images des exercices
  const enrichCyclesWithImages = async (cycles) => {
    if (!cycles || cycles.length === 0) return cycles;

    const enriched = await Promise.all(
      cycles.map(async (cycle) => {
        // Si c'est un exercice
        if (cycle.type === 'exercise') {
          // Si a déjà une image valide et des données, utiliser les données existantes
          if (cycle.exerciseImage && cycle.exerciseData) {
            return cycle;
          }

          // Créer une clé de cache basée sur l'ID ou le nom
          const cacheKey = cycle.exerciseId || cycle.exerciseName?.toLowerCase();

          // Vérifier le cache
          if (cacheKey && exerciseCache.current[cacheKey]) {
            const cachedData = exerciseCache.current[cacheKey];
            return {
              ...cycle,
              exerciseId: cachedData._id || cachedData.exoId || cycle.exerciseId,
              exerciseName: cachedData.name || cycle.exerciseName,
              exerciseImage: cachedData.mainImage || (cachedData.images && cachedData.images[0]?.url),
              exerciseData: cachedData,
            };
          }

          // Essayer de récupérer les données complètes de l'exercice
          let exerciseData = null;

          // D'abord essayer par ID
          if (cycle.exerciseId) {
            try {
              const result = await getExercise(cycle.exerciseId);
              if (result.success && result.data) {
                exerciseData = result.data;
              }
            } catch (e) {
              console.log('[ProgramDetail] Failed to get exercise by ID:', cycle.exerciseId);
            }
          }

          // Si pas trouvé et qu'on a un nom, chercher par slug
          if (!exerciseData && cycle.exerciseName) {
            try {
              // Générer le slug en gardant les accents et caractères spéciaux
              const slug = cycle.exerciseName
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9\-àâäéèêëïîôùûüç]/g, '');
              const result = await getExercise(slug);
              if (result.success && result.data) {
                exerciseData = result.data;
              }
            } catch (e) {
              console.log('[ProgramDetail] Failed to get exercise by slug');
            }
          }

          if (exerciseData) {
            // Mettre en cache
            if (cacheKey) {
              exerciseCache.current[cacheKey] = exerciseData;
            }

            const imageUrl = exerciseData.mainImage || (exerciseData.images && exerciseData.images[0]?.url);
            console.log('[ProgramDetail] Enriched cycle:', cycle.exerciseName, '-> Image:', imageUrl);
            return {
              ...cycle,
              exerciseId: exerciseData._id || exerciseData.exoId || cycle.exerciseId,
              exerciseName: exerciseData.name || cycle.exerciseName,
              exerciseImage: imageUrl,
              exerciseData: exerciseData,
            };
          } else {
            console.log('[ProgramDetail] Could not find exercise:', cycle.exerciseName || cycle.exerciseId);
          }
        }
        return cycle;
      })
    );
    return enriched;
  };

  // Toujours charger le programme pour avoir les données à jour (ratingsCount, userRating)
  useEffect(() => {
    if (programId) {
      loadProgram();
    }
  }, [programId]);

  const loadProgram = async () => {
    setLoading(true);
    const data = await fetchProgramById(programId);
    if (data) {
      console.log('[ProgramDetail] Program loaded:', {
        name: data.name,
        avgRating: data.avgRating,
        ratingsCount: data.ratingsCount,
      });
      setProgram(data);
      // Mettre à jour la note de l'utilisateur si elle existe
      if (data.userRating !== undefined) {
        setUserRating(data.userRating);
      }
      // Enrichir les cycles avec les images
      const enriched = await enrichCyclesWithImages(data.cycles);
      setEnrichedCycles(enriched);
    }
    setLoading(false);
  };

  // Ouvrir le modal de détail exercice
  const handleCyclePress = async (cycle) => {
    if (cycle.type !== 'exercise') return;

    if (cycle.exerciseData) {
      setSelectedExercise(cycle.exerciseData);
      setExerciseModalVisible(true);
    } else if (cycle.exerciseId) {
      try {
        const result = await getExercise(cycle.exerciseId);
        if (result.success && result.data) {
          setSelectedExercise(result.data);
          setExerciseModalVisible(true);
        }
      } catch (e) {
        console.log('[ProgramDetail] Failed to load exercise:', cycle.exerciseId);
      }
    }
  };

  const typeConfig = PROGRAM_TYPES[program?.type] || PROGRAM_TYPES.custom;
  const difficultyConfig = DIFFICULTIES[program?.difficulty] || DIFFICULTIES['intermédiaire'];

  // Calculer la durée réelle à partir des cycles
  const calculateActualDuration = (cycles) => {
    if (!cycles || cycles.length === 0) return 0;

    let totalSeconds = 0;

    cycles.forEach((cycle) => {
      if (cycle.type === 'rest' || cycle.type === 'transition') {
        // Pour les cycles de repos, utiliser restSec
        totalSeconds += cycle.restSec || 0;
      } else {
        // Pour les exercices
        const cycleDuration = (cycle.durationSec || 0) + ((cycle.durationMin || 0) * 60);

        if (cycleDuration > 0) {
          // Si une durée explicite est définie, l'utiliser
          totalSeconds += cycleDuration;
        } else if (cycle.reps && cycle.sets) {
          // Estimation: 3 secondes par rep + 60s repos entre sets
          const exerciseTime = cycle.reps * cycle.sets * 3;
          const restBetweenSets = (cycle.sets - 1) * 60;
          totalSeconds += exerciseTime + restBetweenSets;
        } else if (cycle.reps) {
          // Simple estimation pour reps sans sets
          totalSeconds += cycle.reps * 3;
        }

        // Ajouter le repos de fin d'exercice SEULEMENT si ce n'est pas un cycle de repos séparé
        // On vérifie si le prochain cycle n'est pas déjà un repos
        const cycleIndex = cycles.indexOf(cycle);
        const nextCycle = cycles[cycleIndex + 1];
        if (cycle.restSec && (!nextCycle || nextCycle.type !== 'rest')) {
          totalSeconds += cycle.restSec;
        }
      }
    });

    return Math.round(totalSeconds / 60);
  };

  // Calculer les stats
  const calculatedDuration = calculateActualDuration(program?.cycles);
  const duration = calculatedDuration > 0 ? calculatedDuration : (program?.estimatedDuration || 0);
  const cyclesCount = program?.cycles?.length || 0;
  const isFavorite = program && favorites.includes(program._id);
  // L'utilisateur ne peut modifier que ses propres programmes (createdBy === 'user' et userId match)
  // Les programmes créés par admin ne peuvent pas être modifiés par les users
  const isOwner = program && user && program.createdBy === 'user' && program.userId === user._id;

  // Actions
  const handleBack = () => navigation.goBack();

  const handleToggleFavorite = () => {
    if (program) {
      toggleFavorite(program._id);
    }
  };

  const handleStart = () => {
    // Passer les cycles enrichis au runner pour avoir les images
    const enrichedProgram = {
      ...program,
      cycles: enrichedCycles.length > 0 ? enrichedCycles : program.cycles,
    };
    navigation.navigate('ProgramRunner', { programId: program._id, program: enrichedProgram });
  };

  const handleEdit = () => {
    navigation.navigate('ProgramForm', { mode: 'edit', program });
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le programme',
      'Êtes-vous sûr de vouloir supprimer ce programme ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProgram(program._id);
            if (success) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handlePropose = async () => {
    const success = await proposeProgram(program._id);
    if (success) {
      Alert.alert('Succès', 'Votre programme a été soumis pour approbation');
      loadProgram();
    }
  };

  const handleUnpublish = async () => {
    const success = await unpublishProgram(program._id);
    if (success) {
      loadProgram();
    }
  };

  const handleRate = async (rating) => {
    const result = await rateProgram(program._id, rating);
    console.log('[ProgramDetail] handleRate result:', result, 'program exists:', !!program);
    // Update local and program state with new ratings data
    if (result.success && program) {
      setUserRating(result.userRating);
      setProgram({
        ...program,
        avgRating: result.avgRating,
        ratingsCount: result.ratingsCount,
      });
      Alert.alert(
        'Succès',
        'Votre note a été enregistrée avec succès!',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Erreur',
        'Impossible d\'enregistrer votre note. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.loadingContainerDark]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.errorContainer, isDark && styles.errorContainerDark]}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={[styles.errorText, isDark && styles.errorTextDark]}>
          Programme introuvable
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          {program.coverImage ? (
            <Image source={{ uri: program.coverImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: `${typeConfig.color}30` }]}>
              <Ionicons name={typeConfig.icon} size={80} color={typeConfig.color} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />

          {/* Header buttons */}
          <SafeAreaView style={styles.headerButtons} edges={['top']}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavorite}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFavorite ? '#EF4444' : '#FFF'}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Hero info */}
          <View style={styles.heroInfo}>
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
              <Ionicons name={typeConfig.icon} size={14} color="#FFF" />
              <Text style={styles.typeBadgeText}>{typeConfig.label}</Text>
            </View>
            <Text style={styles.heroTitle}>{program.name}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, isDark && styles.statsRowDark]}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>{duration}</Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>min</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={24} color="#EF4444" />
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>
              {program.estimatedCalories || '~'}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>kcal</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="layers-outline" size={24} color="#3B82F6" />
            <Text style={[styles.statValue, isDark && styles.statValueDark]}>{cyclesCount}</Text>
            <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>cycles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.difficultyDot, { backgroundColor: difficultyConfig.color }]} />
            <Text style={[styles.statValue, isDark && styles.statValueDark, { fontSize: 14 }]}>
              {difficultyConfig.label}
            </Text>
          </View>
        </View>

        {/* Rating */}
        <RatingDisplay
          avgRating={program.avgRating}
          ratingsCount={program.ratingsCount}
          size="large"
        />

        {/* Description */}
        {program.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Description
            </Text>
            <Text style={[styles.description, isDark && styles.descriptionDark]}>
              {program.description}
            </Text>
          </View>
        )}

        {/* Tags */}
        {(program.muscleGroups?.length > 0 || program.equipment?.length > 0) && (
          <View style={styles.section}>
            {program.muscleGroups?.length > 0 && (
              <View style={styles.tagsRow}>
                <Text style={[styles.tagsLabel, isDark && styles.tagsLabelDark]}>Muscles:</Text>
                <View style={styles.tags}>
                  {program.muscleGroups.map((muscle, i) => (
                    <View key={i} style={[styles.tag, isDark && styles.tagDark]}>
                      <Text style={[styles.tagText, isDark && styles.tagTextDark]}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {program.equipment?.length > 0 && (
              <View style={styles.tagsRow}>
                <Text style={[styles.tagsLabel, isDark && styles.tagsLabelDark]}>Équipement:</Text>
                <View style={styles.tags}>
                  {program.equipment.map((equip, i) => (
                    <View key={i} style={[styles.tag, isDark && styles.tagDark]}>
                      <Text style={[styles.tagText, isDark && styles.tagTextDark]}>{equip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Cycles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            Cycles ({cyclesCount})
          </Text>
          {(enrichedCycles.length > 0 ? enrichedCycles : program.cycles)?.map((cycle, index) => (
            <CycleItem
              key={index}
              cycle={cycle}
              index={index}
              onPress={cycle.type === 'exercise' ? () => handleCyclePress(cycle) : undefined}
            />
          ))}
        </View>

        {/* Owner actions */}
        {isOwner && isPremium && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Actions
            </Text>
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Modifier</Text>
              </TouchableOpacity>
              {program.status === 'private' && (
                <TouchableOpacity style={styles.actionButton} onPress={handlePropose}>
                  <Ionicons name="globe-outline" size={20} color="#3B82F6" />
                  <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>
                    Proposer au public
                  </Text>
                </TouchableOpacity>
              )}
              {program.status === 'pending' && (
                <>
                  <View style={[styles.actionButton, styles.pendingButton]}>
                    <Ionicons name="time-outline" size={20} color="#F59E0B" />
                    <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>
                      En attente d'approbation
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.actionButton} onPress={handleUnpublish}>
                    <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                    <Text style={[styles.actionButtonText, { color: '#6B7280' }]}>
                      Annuler la soumission
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {program.status === 'public' && (
                <TouchableOpacity style={styles.actionButton} onPress={handleUnpublish}>
                  <Ionicons name="eye-off-outline" size={20} color="#6B7280" />
                  <Text style={[styles.actionButtonText, { color: '#6B7280' }]}>
                    Retirer du public
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rate (for all non-owners) */}
        {!isOwner && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Noter ce programme
            </Text>
            <View style={styles.rateStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRate(star)}>
                  <Ionicons
                    name={star <= userRating ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Start button */}
      <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Ionicons name="play" size={24} color="#FFF" />
          <Text style={styles.startButtonText}>Démarrer le programme</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Detail Modal */}
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setExerciseModalVisible(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]} numberOfLines={1}>
              {selectedExercise?.name || 'Exercice'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Exercise Image */}
            <View style={[styles.exerciseImageContainer, isDark && styles.exerciseImageContainerDark]}>
              {selectedExercise?.mainImage ? (
                selectedExercise.mainImage.includes('.svg') ? (
                  <SvgUri width={200} height={200} uri={selectedExercise.mainImage} />
                ) : (
                  <Image
                    source={{ uri: selectedExercise.mainImage }}
                    style={styles.exerciseModalImage}
                    resizeMode="contain"
                  />
                )
              ) : (
                <Ionicons name="barbell-outline" size={80} color={isDark ? '#444' : '#CCC'} />
              )}
            </View>

            {/* Exercise Info */}
            <View style={styles.exerciseInfo}>
              <View style={styles.exerciseMetaRow}>
                {selectedExercise?.primaryMuscle && (
                  <View style={[styles.metaBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.metaBadgeText, { color: theme.colors.primary }]}>
                      {selectedExercise.primaryMuscle}
                    </Text>
                  </View>
                )}
                {selectedExercise?.difficulty && (
                  <View style={[styles.metaBadge, { backgroundColor: '#F59E0B20' }]}>
                    <Text style={[styles.metaBadgeText, { color: '#F59E0B' }]}>
                      {selectedExercise.difficulty}
                    </Text>
                  </View>
                )}
              </View>

              {selectedExercise?.explanation && (
                <View style={styles.explanationSection}>
                  <Text style={[styles.explanationTitle, isDark && styles.explanationTitleDark]}>
                    Instructions
                  </Text>
                  <Text style={[styles.explanationText, isDark && styles.explanationTextDark]}>
                    {selectedExercise.explanation}
                  </Text>
                </View>
              )}

              {selectedExercise?.tips && selectedExercise.tips.length > 0 && (
                <View style={styles.tipsSection}>
                  <Text style={[styles.explanationTitle, isDark && styles.explanationTitleDark]}>
                    Conseils
                  </Text>
                  {selectedExercise.tips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                      <Text style={[styles.tipText, isDark && styles.tipTextDark]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {selectedExercise?.equipment && selectedExercise.equipment.length > 0 && (
                <View style={styles.equipmentSection}>
                  <Text style={[styles.explanationTitle, isDark && styles.explanationTitleDark]}>
                    Equipement
                  </Text>
                  <View style={styles.equipmentRow}>
                    {selectedExercise.equipment.map((eq, index) => (
                      <View key={index} style={[styles.equipmentBadge, isDark && styles.equipmentBadgeDark]}>
                        <Text style={[styles.equipmentText, isDark && styles.equipmentTextDark]}>{eq}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
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
    backgroundColor: '#F5F5F5',
  },
  loadingContainerDark: {
    backgroundColor: '#1A1A1A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: theme.spacing.lg,
  },
  errorContainerDark: {
    backgroundColor: '#1A1A1A',
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorTextDark: {
    color: '#FFFFFF',
  },
  backButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  heroContainer: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  typeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: theme.spacing.md,
    marginTop: -20,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRowDark: {
    backgroundColor: '#2A2A2A',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 4,
  },
  statValueDark: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  statLabelDark: {
    color: '#888',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  ratingContainerDark: {},
  ratingStars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  ratingTextDark: {
    color: '#888',
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  descriptionDark: {
    color: '#AAA',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  tagsLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
    minWidth: 80,
  },
  tagsLabelDark: {
    color: '#888',
  },
  tags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagDark: {
    backgroundColor: '#404040',
  },
  tagText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  tagTextDark: {
    color: '#AAA',
  },
  ownerActions: {
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pendingButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  deleteButton: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  rateStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bottomBarDark: {
    backgroundColor: '#2A2A2A',
    borderTopColor: '#404040',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalContainerDark: {
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
  },
  exerciseImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImageContainerDark: {
    backgroundColor: '#2A2A2A',
  },
  exerciseModalImage: {
    width: 200,
    height: 200,
  },
  exerciseInfo: {
    padding: theme.spacing.lg,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  metaBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  metaBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  explanationSection: {
    marginBottom: theme.spacing.lg,
  },
  explanationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  explanationTitleDark: {
    color: '#FFFFFF',
  },
  explanationText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  explanationTextDark: {
    color: '#AAA',
  },
  tipsSection: {
    marginBottom: theme.spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  tipTextDark: {
    color: '#AAA',
  },
  equipmentSection: {
    marginBottom: theme.spacing.lg,
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  equipmentBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F3F4F6',
  },
  equipmentBadgeDark: {
    backgroundColor: '#333',
  },
  equipmentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  equipmentTextDark: {
    color: '#AAA',
  },
});
