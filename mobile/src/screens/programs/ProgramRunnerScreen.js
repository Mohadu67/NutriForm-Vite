import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useColorScheme,
  BackHandler,
  Vibration,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProgram } from '../../contexts/ProgramContext';
import { theme } from '../../theme';

// États du runner
const RUNNER_STATES = {
  READY: 'ready',
  RUNNING: 'running',
  PAUSED: 'paused',
  FINISHED: 'finished',
};

// Types de cycles
const CYCLE_TYPES = {
  exercise: { icon: 'barbell', color: theme.colors.primary },
  rest: { icon: 'bed', color: '#22C55E' },
  transition: { icon: 'swap-horizontal', color: '#3B82F6' },
};

export default function ProgramRunnerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { programId, program } = route.params || {};
  const { recordCompletion, isPremium } = useProgram();

  const [runnerState, setRunnerState] = useState(RUNNER_STATES.READY);
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedCycles, setCompletedCycles] = useState([]);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const cycles = program?.cycles || [];
  const currentCycle = cycles[currentCycleIndex];
  const cycleConfig = currentCycle ? CYCLE_TYPES[currentCycle.type] : CYCLE_TYPES.exercise;

  // Calculer la durée du cycle courant
  const getCycleDuration = (cycle) => {
    if (!cycle) return 0;
    if (cycle.type === 'rest' || cycle.type === 'transition') {
      return cycle.restSec || 0;
    }
    return (cycle.durationSec || 0) + ((cycle.durationMin || 0) * 60);
  };

  // Initialiser le timer pour le cycle courant
  useEffect(() => {
    if (currentCycle && runnerState === RUNNER_STATES.READY) {
      setTimeRemaining(getCycleDuration(currentCycle));
    }
  }, [currentCycleIndex, currentCycle]);

  // Gérer le timer
  useEffect(() => {
    if (runnerState === RUNNER_STATES.RUNNING) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleCycleComplete();
            return 0;
          }
          return prev - 1;
        });
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [runnerState]);

  // Empêcher le retour arrière accidentel
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    return () => backHandler.remove();
  }, [runnerState]);

  // Cycle terminé
  const handleCycleComplete = useCallback(() => {
    Vibration.vibrate(200);
    setCompletedCycles((prev) => [...prev, currentCycleIndex]);

    if (currentCycleIndex >= cycles.length - 1) {
      // Programme terminé
      setRunnerState(RUNNER_STATES.FINISHED);
    } else {
      // Passer au cycle suivant
      const nextIndex = currentCycleIndex + 1;
      setCurrentCycleIndex(nextIndex);
      setTimeRemaining(getCycleDuration(cycles[nextIndex]));
    }
  }, [currentCycleIndex, cycles]);

  // Actions
  const handleStart = () => {
    if (runnerState === RUNNER_STATES.READY) {
      startTimeRef.current = Date.now();
      setRunnerState(RUNNER_STATES.RUNNING);
    }
  };

  const handlePause = () => {
    setRunnerState(RUNNER_STATES.PAUSED);
  };

  const handleResume = () => {
    setRunnerState(RUNNER_STATES.RUNNING);
  };

  const handleSkip = () => {
    handleCycleComplete();
  };

  const handleRestart = () => {
    setCurrentCycleIndex(0);
    setTimeRemaining(getCycleDuration(cycles[0]));
    setElapsedTime(0);
    setCompletedCycles([]);
    setRunnerState(RUNNER_STATES.READY);
  };

  const handleExit = () => {
    if (runnerState === RUNNER_STATES.RUNNING || runnerState === RUNNER_STATES.PAUSED) {
      Alert.alert(
        'Quitter le programme',
        'Êtes-vous sûr de vouloir arrêter ? Votre progression sera perdue.',
        [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Quitter',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleFinish = async () => {
    // Enregistrer la session
    const sessionData = {
      cyclesCompleted: completedCycles.length,
      cyclesTotal: cycles.length,
      durationSec: elapsedTime,
      calories: program.estimatedCalories || 0,
    };

    await recordCompletion(programId, sessionData);
    navigation.goBack();
  };

  // Formater le temps
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Nom du cycle
  const getCycleName = (cycle) => {
    if (!cycle) return '';
    if (cycle.type === 'rest') return 'Repos';
    if (cycle.type === 'transition') return 'Transition';
    return cycle.exerciseName || 'Exercice';
  };

  // Prochain cycle
  const nextCycle = cycles[currentCycleIndex + 1];

  // Verifier si une URL est un SVG
  const isSvgUrl = (url) => {
    if (!url) return false;
    return url.includes('.svg') || url.includes('/svg/') || url.includes('format=svg');
  };

  // Rendre l'image de l'exercice ou l'icône par défaut
  const renderCycleVisual = () => {
    const imageUrl = currentCycle?.exerciseImage;

    // Si pas d'image ou type repos/transition, afficher l'icône
    if (!imageUrl || currentCycle?.type !== 'exercise') {
      return (
        <View style={[styles.cycleIcon, { backgroundColor: `${cycleConfig.color}20` }]}>
          <Ionicons name={cycleConfig.icon} size={48} color={cycleConfig.color} />
        </View>
      );
    }

    // Si c'est un SVG
    if (isSvgUrl(imageUrl)) {
      return (
        <View style={[styles.exerciseImageContainer, isDark && styles.exerciseImageContainerDark]}>
          <SvgUri
            width={120}
            height={120}
            uri={imageUrl}
            onError={() => console.log('[ProgramRunner] SVG load error:', imageUrl)}
          />
        </View>
      );
    }

    // Image normale (PNG, JPG, GIF)
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.exerciseImage}
        resizeMode="contain"
      />
    );
  };

  // Écran de fin
  if (runnerState === RUNNER_STATES.FINISHED) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.finishedContainer}>
          <View style={styles.finishedIcon}>
            <Ionicons name="trophy" size={80} color="#F59E0B" />
          </View>
          <Text style={[styles.finishedTitle, isDark && styles.finishedTitleDark]}>
            Bravo !
          </Text>
          <Text style={[styles.finishedSubtitle, isDark && styles.finishedSubtitleDark]}>
            Programme terminé
          </Text>

          <View style={[styles.statsCard, isDark && styles.statsCardDark]}>
            <View style={styles.statRow}>
              <Ionicons name="time" size={24} color={theme.colors.primary} />
              <Text style={[styles.statText, isDark && styles.statTextDark]}>
                Durée: {formatTime(elapsedTime)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Ionicons name="layers" size={24} color="#3B82F6" />
              <Text style={[styles.statText, isDark && styles.statTextDark]}>
                Cycles: {completedCycles.length}/{cycles.length}
              </Text>
            </View>
            {program.estimatedCalories && (
              <View style={styles.statRow}>
                <Ionicons name="flame" size={24} color="#EF4444" />
                <Text style={[styles.statText, isDark && styles.statTextDark]}>
                  Calories: ~{program.estimatedCalories} kcal
                </Text>
              </View>
            )}
          </View>

          <View style={styles.finishedButtons}>
            <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
              <Ionicons name="refresh" size={20} color={theme.colors.primary} />
              <Text style={styles.restartButtonText}>Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
              <Text style={styles.finishButtonText}>Terminer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <Ionicons name="close" size={28} color={isDark ? '#FFF' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
          {currentCycleIndex + 1} / {cycles.length}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${((currentCycleIndex + 1) / cycles.length) * 100}%` },
          ]}
        />
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Cycle image or icon */}
        {renderCycleVisual()}

        {/* Cycle name */}
        <Text style={[styles.cycleName, isDark && styles.cycleNameDark]}>
          {getCycleName(currentCycle)}
        </Text>

        {/* Timer display */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, isDark && styles.timerTextDark]}>
            {formatTime(timeRemaining)}
          </Text>
          {currentCycle?.reps && !getCycleDuration(currentCycle) && (
            <Text style={[styles.repsText, isDark && styles.repsTextDark]}>
              {currentCycle.sets ? `${currentCycle.sets}x` : ''}{currentCycle.reps} reps
            </Text>
          )}
        </View>

        {/* Notes */}
        {currentCycle?.notes && (
          <Text style={[styles.notes, isDark && styles.notesDark]}>
            {currentCycle.notes}
          </Text>
        )}

        {/* Next cycle preview */}
        {nextCycle && runnerState !== RUNNER_STATES.READY && (
          <View style={[styles.nextPreview, isDark && styles.nextPreviewDark]}>
            <Text style={[styles.nextLabel, isDark && styles.nextLabelDark]}>Suivant:</Text>
            <Text style={[styles.nextName, isDark && styles.nextNameDark]}>
              {getCycleName(nextCycle)}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {runnerState === RUNNER_STATES.READY && (
          <TouchableOpacity style={styles.playButton} onPress={handleStart}>
            <Ionicons name="play" size={48} color="#FFF" />
          </TouchableOpacity>
        )}

        {runnerState === RUNNER_STATES.RUNNING && (
          <View style={styles.runningControls}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Ionicons name="play-skip-forward" size={28} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
              <Ionicons name="pause" size={48} color="#FFF" />
            </TouchableOpacity>
            <View style={{ width: 60 }} />
          </View>
        )}

        {runnerState === RUNNER_STATES.PAUSED && (
          <View style={styles.runningControls}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Ionicons name="play-skip-forward" size={28} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playButton} onPress={handleResume}>
              <Ionicons name="play" size={48} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={handleRestart}>
              <Ionicons name="refresh" size={28} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  exitButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  progressTextDark: {
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: theme.spacing.md,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  cycleIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  exerciseImageContainer: {
    width: 140,
    height: 140,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  exerciseImageContainerDark: {
    backgroundColor: '#333',
  },
  exerciseImage: {
    width: 140,
    height: 140,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  cycleName: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  cycleNameDark: {
    color: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '200',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  timerTextDark: {
    color: '#FFFFFF',
  },
  repsText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  repsTextDark: {
    color: theme.colors.primary,
  },
  notes: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  notesDark: {
    color: '#888',
  },
  nextPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  nextPreviewDark: {
    backgroundColor: '#333',
  },
  nextLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  nextLabelDark: {
    color: '#888',
  },
  nextName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  nextNameDark: {
    color: '#FFFFFF',
  },
  controls: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runningControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  skipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Finished screen
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  finishedIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  finishedTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  finishedTitleDark: {
    color: '#FFFFFF',
  },
  finishedSubtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  finishedSubtitleDark: {
    color: '#888',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statsCardDark: {
    backgroundColor: '#2A2A2A',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  statText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
  },
  statTextDark: {
    color: '#FFFFFF',
  },
  finishedButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  restartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  restartButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  finishButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
