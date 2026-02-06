import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
  Animated,
  Vibration,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SafeImage from '../../components/ui/SafeImage';
import { useWorkout } from '../../contexts/WorkoutContext';
import {
  useSmartTracking,
  useExerciseData,
  useProgressionSuggestion,
  getSmartSuggestedValues,
} from '../../hooks/useSmartTracking';
import { detectRecord, calculateDifference } from '../../utils/progressionHelper';
import theme from '../../theme';

const TYPE_CONFIG = {
  'muscu': { icon: 'barbell', color: '#8B5CF6' },
  'poids_du_corps': { icon: 'body', color: '#06B6D4' },
  'cardio': { icon: 'heart', color: '#EF4444' },
  'etirement': { icon: 'flower', color: '#10B981' },
};

// Timer Component
const WorkoutTimer = ({ startTime, isDark }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
      <Text style={[styles.timerText, isDark && styles.textDark]}>{formatTime(elapsed)}</Text>
    </View>
  );
};

// Set Row Component avec suivi intelligent
const SetRow = ({ set, index, exerciceId, onUpdate, onToggle, onRemove, canRemove, isDark, exerciseData, smartEnabled, isSuggested }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Analyse de la serie (record, difference)
  const record = useMemo(() => {
    if (!smartEnabled || !exerciseData || set.weight === 0 || set.reps === 0) return null;
    return detectRecord(set, exerciseData);
  }, [smartEnabled, exerciseData, set.weight, set.reps, set]);

  const difference = useMemo(() => {
    if (!smartEnabled || !exerciseData || set.weight === 0 || set.reps === 0) return null;
    return calculateDifference(set, exerciseData, index);
  }, [smartEnabled, exerciseData, set.weight, set.reps, index, set]);

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();

    if (!set.completed) {
      Vibration.vibrate(50);
    }
    onToggle(exerciceId, index);
  };

  return (
    <Animated.View style={[
      styles.setRow,
      set.completed && styles.setRowCompleted,
      isDark && styles.setRowDark,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <Text style={[styles.setNumber, isDark && styles.textMuted]}>{index + 1}</Text>

      <View style={styles.setInputGroup}>
        <TextInput
          style={[
            styles.setInput,
            isDark && styles.setInputDark,
            isSuggested && styles.setInputSuggested,
          ]}
          value={set.weight > 0 ? set.weight.toString() : ''}
          onChangeText={(val) => onUpdate(exerciceId, index, { weight: parseFloat(val) || 0, isSuggested: false })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={isDark ? '#555' : '#CCC'}
        />
        <Text style={[styles.setInputLabel, isDark && styles.textMuted]}>kg</Text>
      </View>

      <View style={styles.setInputGroup}>
        <TextInput
          style={[
            styles.setInput,
            isDark && styles.setInputDark,
            isSuggested && styles.setInputSuggested,
          ]}
          value={set.reps > 0 ? set.reps.toString() : ''}
          onChangeText={(val) => onUpdate(exerciceId, index, { reps: parseInt(val) || 0, isSuggested: false })}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={isDark ? '#555' : '#CCC'}
        />
        <Text style={[styles.setInputLabel, isDark && styles.textMuted]}>reps</Text>
      </View>

      {/* Badges intelligents */}
      <View style={styles.setBadges}>
        {isSuggested && (
          <View style={styles.suggestedBadge}>
            <Ionicons name="bulb" size={12} color="#F59E0B" />
          </View>
        )}
        {record && (
          <View style={styles.recordBadge}>
            <Ionicons name={record.icon || 'trophy'} size={12} color="#EF4444" />
          </View>
        )}
        {difference?.hasChange && !record && (
          <Text style={[
            styles.diffText,
            difference.isPositive ? styles.diffPositive : styles.diffNegative,
          ]}>
            {difference.weightDiff !== 0 && `${difference.weightDiff > 0 ? '+' : ''}${difference.weightDiff}kg`}
            {difference.weightDiff !== 0 && difference.repsDiff !== 0 && ' '}
            {difference.repsDiff !== 0 && `${difference.repsDiff > 0 ? '+' : ''}${difference.repsDiff}r`}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.checkButton, set.completed && styles.checkButtonActive]}
        onPress={handleToggle}
      >
        <Ionicons
          name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={set.completed ? '#22C55E' : (isDark ? '#555' : '#CCC')}
        />
      </TouchableOpacity>

      {canRemove && (
        <TouchableOpacity
          style={styles.removeSetButton}
          onPress={() => onRemove(exerciceId, index)}
        >
          <Ionicons name="close" size={18} color="#EF4444" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// Exercise Card Component avec suivi intelligent
const ExerciseCard = ({ exerciseData, onAddSet, onRemoveSet, onUpdateSet, onToggleSet, onRemoveExercise, onMoveUp, onMoveDown, isFirst, isLast, isDark, smartEnabled, onAddSmartSet }) => {
  const { exercice, sets } = exerciseData;
  const typeConfig = TYPE_CONFIG[exercice.type] || TYPE_CONFIG.muscu;
  const completedSets = sets.filter(s => s.completed).length;
  const [showInstructions, setShowInstructions] = useState(false);
  const isPdc = exercice.type === 'poids_du_corps';

  // Donnees historiques pour cet exercice
  const { data: historyData, isLoading: historyLoading } = useExerciseData(
    exercice.id,
    exercice.name,
    smartEnabled
  );

  // Suggestion de progression
  const suggestion = useProgressionSuggestion(historyData, isPdc, exercice.name, smartEnabled);

  // Handler pour ajouter une serie intelligente
  const handleAddSet = useCallback(() => {
    if (smartEnabled && (historyData || sets.length > 0)) {
      const suggested = getSmartSuggestedValues(sets, historyData, isPdc, smartEnabled);
      onAddSmartSet(exercice.id, suggested);
    } else {
      onAddSet(exercice.id);
    }
  }, [smartEnabled, historyData, sets, isPdc, exercice.id, onAddSet, onAddSmartSet]);

  // Instructions par défaut (simplified version)
  const getInstructions = () => {
    if (exercice.explanation) return exercice.explanation.split('\n');
    return [
      'Placez-vous dans la position de depart correcte',
      'Contractez les muscles cibles avant de commencer',
      'Effectuez le mouvement de maniere lente et controlee',
      'Expirez pendant l\'effort, inspirez lors du retour',
      'Maintenez la tension musculaire tout au long du mouvement',
    ];
  };

  return (
    <View style={[styles.exerciseCard, isDark && styles.exerciseCardDark]}>
      {/* Header */}
      <View style={styles.exerciseHeader}>
        {/* Image/Icon */}
        <TouchableOpacity
          style={[styles.exerciseIconContainer, { backgroundColor: `${typeConfig.color}20` }]}
          onPress={() => setShowInstructions(true)}
        >
          {exercice.image ? (
            <SafeImage
              source={{ uri: exercice.image }}
              style={styles.exerciseImage}
              resizeMode="cover"
              placeholderIcon="barbell-outline"
              placeholderSize={20}
            />
          ) : (
            <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
          )}
        </TouchableOpacity>

        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, isDark && styles.textDark]}>{exercice.name}</Text>
          <Text style={[styles.exerciseProgress, isDark && styles.textMuted]}>
            {completedSets}/{sets.length} series
          </Text>
        </View>

        {/* Reorder buttons */}
        <View style={styles.reorderButtons}>
          <TouchableOpacity
            style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
            onPress={() => !isFirst && onMoveUp(exercice.id)}
            disabled={isFirst}
          >
            <Ionicons name="chevron-up" size={18} color={isFirst ? '#CCC' : theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
            onPress={() => !isLast && onMoveDown(exercice.id)}
            disabled={isLast}
          >
            <Ionicons name="chevron-down" size={18} color={isLast ? '#CCC' : theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.removeExerciseButton}
          onPress={() => onRemoveExercise(exercice.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Instructions Modal */}
      <Modal
        visible={showInstructions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInstructions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInstructions(false)}
        >
          <View style={[styles.instructionsModal, isDark && styles.instructionsModalDark]}>
            {exercice.image && (
              <SafeImage
                source={{ uri: exercice.image }}
                style={styles.instructionsImage}
                resizeMode="cover"
                placeholderIcon="barbell-outline"
                placeholderSize={60}
              />
            )}
            <Text style={[styles.instructionsTitle, isDark && styles.textDark]}>
              {exercice.name}
            </Text>
            <View style={styles.instructionsList}>
              {getInstructions().map((instruction, index) => (
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
            <TouchableOpacity
              style={styles.closeInstructionsButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.closeInstructionsText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Banniere de suggestion intelligente */}
      {smartEnabled && suggestion?.message && (
        <View style={[styles.suggestionBanner, isDark && styles.suggestionBannerDark]}>
          <View style={styles.suggestionContent}>
            <Ionicons name="bulb" size={16} color="#F59E0B" />
            <Text style={[styles.suggestionText, isDark && styles.suggestionTextDark]}>
              {suggestion.message}
            </Text>
          </View>
          {suggestion.isProgression && (
            <View style={styles.suggestionBadge}>
              <Ionicons name="trending-up" size={12} color="#22C55E" />
            </View>
          )}
        </View>
      )}

      {/* Loading historique */}
      {smartEnabled && historyLoading && (
        <View style={styles.historyLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.historyLoadingText, isDark && styles.textMuted]}>
            Chargement historique...
          </Text>
        </View>
      )}

      {/* Sets Header */}
      <View style={styles.setsHeader}>
        <Text style={[styles.setsHeaderText, isDark && styles.textMuted, { flex: 0.5 }]}>Serie</Text>
        <Text style={[styles.setsHeaderText, isDark && styles.textMuted, { flex: 1 }]}>Poids</Text>
        <Text style={[styles.setsHeaderText, isDark && styles.textMuted, { flex: 1 }]}>Reps</Text>
        <Text style={[styles.setsHeaderText, isDark && styles.textMuted, { width: 80 }]}></Text>
      </View>

      {/* Sets */}
      {sets.map((set, index) => (
        <SetRow
          key={index}
          set={set}
          index={index}
          exerciceId={exercice.id}
          onUpdate={onUpdateSet}
          onToggle={onToggleSet}
          onRemove={onRemoveSet}
          canRemove={sets.length > 1}
          isDark={isDark}
          exerciseData={historyData}
          smartEnabled={smartEnabled}
          isSuggested={set.isSuggested}
        />
      ))}

      {/* Add Set Button */}
      <TouchableOpacity
        style={[styles.addSetButton, isDark && styles.addSetButtonDark]}
        onPress={handleAddSet}
      >
        <Ionicons name="add" size={20} color={theme.colors.primary} />
        <Text style={styles.addSetText}>Ajouter une serie</Text>
        {smartEnabled && historyData && (
          <View style={styles.smartBadge}>
            <Ionicons name="sparkles" size={12} color="#F59E0B" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function WorkoutSessionScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Suivi intelligent
  const { isEnabled: smartEnabled, toggleSmartTracking, isLoading: smartLoading } = useSmartTracking();

  const {
    currentWorkout,
    isWorkoutActive,
    startWorkout,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    removeExercise,
    moveExerciseUp,
    moveExerciseDown,
    finishWorkout,
    cancelWorkout,
    getCompletedSetsCount,
    getTotalSetsCount,
  } = useWorkout();

  // Ajouter une serie avec valeurs suggerees
  const handleAddSmartSet = useCallback((exerciceId, suggestedValues) => {
    // Ajouter une serie normale d'abord
    addSet(exerciceId);

    // Puis mettre a jour avec les valeurs suggerees
    // On doit attendre que la serie soit ajoutee
    setTimeout(() => {
      if (currentWorkout) {
        const exerciseData = currentWorkout.exercises.find(e => e.exercice.id === exerciceId);
        if (exerciseData) {
          const newSetIndex = exerciseData.sets.length - 1;
          if (newSetIndex >= 0) {
            updateSet(exerciceId, newSetIndex, {
              weight: suggestedValues.weight || 0,
              reps: suggestedValues.reps || 0,
              isSuggested: true,
            });
          }
        }
      }
    }, 50);
  }, [addSet, updateSet, currentWorkout]);

  const handleFinishWorkout = useCallback(() => {
    const completedSets = getCompletedSetsCount();
    const totalSets = getTotalSetsCount();

    if (completedSets === 0) {
      Alert.alert(
        'Seance vide',
        'Tu n\'as complete aucune serie. Veux-tu vraiment terminer ?',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Terminer', style: 'destructive', onPress: async () => {
            await finishWorkout();
            navigation.goBack();
          }},
        ]
      );
      return;
    }

    Alert.alert(
      'Terminer la seance ?',
      `Tu as complete ${completedSets}/${totalSets} series. Veux-tu sauvegarder cette seance ?`,
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Terminer', onPress: async () => {
          const finished = await finishWorkout();
          if (finished) {
            Alert.alert('Bravo !', `Seance terminee en ${finished.duration} minutes !`);
          }
          navigation.goBack();
        }},
      ]
    );
  }, [finishWorkout, getCompletedSetsCount, getTotalSetsCount, navigation]);

  const handleCancelWorkout = useCallback(() => {
    Alert.alert(
      'Annuler la seance ?',
      'Cette action supprimera toute la seance en cours. Es-tu sur ?',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive', onPress: async () => {
          await cancelWorkout();
          navigation.goBack();
        }},
      ]
    );
  }, [cancelWorkout, navigation]);

  const handleAddExercise = useCallback(() => {
    navigation.navigate('Exercices');
  }, [navigation]);

  const handleRemoveExercise = useCallback((exerciceId) => {
    Alert.alert(
      'Supprimer l\'exercice ?',
      'Toutes les series de cet exercice seront supprimees.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeExercise(exerciceId) },
      ]
    );
  }, [removeExercise]);

  // Séance préparée mais pas encore démarrée
  const isWorkoutPrepared = currentWorkout && !currentWorkout.startTime;

  if (!currentWorkout) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={80} color={isDark ? '#333' : '#DDD'} />
          <Text style={[styles.emptyTitle, isDark && styles.textDark]}>Aucune seance preparee</Text>
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
            Ajoute des exercices depuis la page Exercices pour preparer une seance
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleAddExercise}
          >
            <Ionicons name="add-circle" size={22} color="#FFF" />
            <Text style={styles.startButtonText}>Choisir des exercices</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const completedSets = getCompletedSetsCount();
  const totalSets = getTotalSetsCount();
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#333'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>
            {isWorkoutPrepared ? 'Preparation' : 'Seance en cours'}
          </Text>
          {currentWorkout.startTime && (
            <WorkoutTimer startTime={currentWorkout.startTime} isDark={isDark} />
          )}
        </View>
        <TouchableOpacity onPress={handleCancelWorkout} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar + Smart Toggle */}
      <View style={[styles.progressContainer, isDark && styles.progressContainerDark]}>
        <View style={styles.progressRow}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressLabel, isDark && styles.textMuted]}>Progression</Text>
            <Text style={[styles.progressValue, isDark && styles.textDark]}>
              {completedSets}/{totalSets} series
            </Text>
          </View>

          {/* Toggle Suivi Intelligent */}
          <TouchableOpacity
            style={[
              styles.smartToggle,
              smartEnabled && styles.smartToggleActive,
              isDark && styles.smartToggleDark,
            ]}
            onPress={toggleSmartTracking}
            disabled={smartLoading}
          >
            <Ionicons
              name={smartEnabled ? 'sparkles' : 'sparkles-outline'}
              size={16}
              color={smartEnabled ? '#F59E0B' : (isDark ? '#666' : '#999')}
            />
            <Text style={[
              styles.smartToggleText,
              smartEnabled && styles.smartToggleTextActive,
              isDark && styles.smartToggleTextDark,
            ]}>
              {smartEnabled ? 'Smart ON' : 'Smart'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Exercises List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentWorkout.exercises.map((exerciseData, index) => (
          <ExerciseCard
            key={exerciseData.exercice.id}
            exerciseData={exerciseData}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onUpdateSet={updateSet}
            onToggleSet={toggleSetComplete}
            onRemoveExercise={handleRemoveExercise}
            onMoveUp={moveExerciseUp}
            onMoveDown={moveExerciseDown}
            isFirst={index === 0}
            isLast={index === currentWorkout.exercises.length - 1}
            isDark={isDark}
            smartEnabled={smartEnabled}
            onAddSmartSet={handleAddSmartSet}
          />
        ))}

        {/* Add Exercise Button */}
        <TouchableOpacity
          style={[styles.addExerciseButton, isDark && styles.addExerciseButtonDark]}
          onPress={handleAddExercise}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.addExerciseText}>Ajouter un exercice</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
        {isWorkoutPrepared ? (
          <TouchableOpacity
            style={[styles.finishButton, styles.startWorkoutButton]}
            onPress={() => {
              startWorkout();
              Vibration.vibrate(100);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle" size={22} color="#FFF" />
            <Text style={styles.finishButtonText}>Demarrer la seance</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.finishButton, completedSets === 0 && styles.finishButtonDisabled]}
            onPress={handleFinishWorkout}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={22} color="#FFF" />
            <Text style={styles.finishButtonText}>Terminer la seance</Text>
          </TouchableOpacity>
        )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    padding: 8,
    marginRight: -8,
  },

  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Progress
  progressContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  progressContainerDark: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#333',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Exercise Card
  exerciseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseCardDark: {
    backgroundColor: '#1E1E1E',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exerciseImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  exerciseProgress: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: 8,
  },
  reorderButton: {
    padding: 4,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  removeExerciseButton: {
    padding: 8,
  },

  // Instructions Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  instructionsModalDark: {
    backgroundColor: '#1E1E1E',
  },
  instructionsImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionsList: {
    marginBottom: 16,
  },
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
  closeInstructionsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeInstructionsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Sets Header
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  setsHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    textAlign: 'center',
  },

  // Set Row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  setRowCompleted: {
    backgroundColor: '#22C55E10',
  },
  setRowDark: {
    backgroundColor: 'transparent',
  },
  setNumber: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
  },
  setInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  setInput: {
    width: 50,
    height: 36,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  setInputDark: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
  },
  setInputLabel: {
    fontSize: 12,
    color: '#888',
  },
  checkButton: {
    width: 44,
    alignItems: 'center',
  },
  checkButtonActive: {},
  removeSetButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add Set Button
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: `${theme.colors.primary}10`,
    marginTop: 8,
    gap: 8,
  },
  addSetButtonDark: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },

  // Add Exercise Button
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  addExerciseButtonDark: {
    borderColor: theme.colors.primary,
  },
  addExerciseText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Bottom Bar
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
  finishButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  finishButtonDisabled: {
    backgroundColor: '#22C55E80',
  },
  startWorkoutButton: {
    backgroundColor: theme.colors.primary,
  },
  finishButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
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
  textMuted: {
    color: '#888',
  },

  // Smart Toggle
  smartToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  smartToggleActive: {
    backgroundColor: '#FEF3C7',
  },
  smartToggleDark: {
    backgroundColor: '#2A2A2A',
  },
  smartToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  smartToggleTextActive: {
    color: '#F59E0B',
  },
  smartToggleTextDark: {
    color: '#666',
  },

  // Suggestion Banner
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  suggestionBannerDark: {
    backgroundColor: '#422006',
  },
  suggestionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  suggestionTextDark: {
    color: '#FCD34D',
  },
  suggestionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // History Loading
  historyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  historyLoadingText: {
    fontSize: 12,
    color: '#666',
  },

  // Set Badges
  setBadges: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  suggestedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffText: {
    fontSize: 10,
    fontWeight: '600',
  },
  diffPositive: {
    color: '#22C55E',
  },
  diffNegative: {
    color: '#EF4444',
  },

  // Set Input Suggested
  setInputSuggested: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  // Smart Badge on Add Set Button
  smartBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
