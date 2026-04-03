import 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/contexts/AuthContext';
import { WorkoutProvider, useWorkout } from './src/contexts/WorkoutContext';
import { SharedSessionProvider, useSharedSession } from './src/contexts/SharedSessionContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { RecipeProvider } from './src/contexts/RecipeContext';
import { ProgramProvider } from './src/contexts/ProgramContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { ThemeProvider, useTheme } from './src/theme';
import Navigation from './src/navigation';
import notificationService from './src/services/notificationService';
import HealthDisclaimerModal from './src/components/HealthDisclaimerModal';
import HealthConnectOnboarding from './src/components/HealthConnectOnboarding';

// Sync séance partagée → WorkoutContext (doit être enfant des deux providers)
function SharedSessionSync() {
  const shared = useSharedSession();
  const { addExercise, startWorkout, cancelWorkout, currentWorkout, setWorkoutStartTime } = useWorkout();
  const injectedRef = useRef(null);
  const injectedCountRef = useRef(0);
  const wasSharedRef = useRef(false);

  // Au montage : nettoyer le workout de séance partagée orphelin
  const cancelWorkoutRef = useRef(cancelWorkout);
  cancelWorkoutRef.current = cancelWorkout;
  const cleanedOnceRef = useRef(false);
  useEffect(() => {
    if (cleanedOnceRef.current) return;
    if (shared?.loading) return; // Attendre que le context charge
    cleanedOnceRef.current = true;
    AsyncStorage.getItem('@shared_workout_active').then(flag => {
      if (flag === 'true') {
        const hasSession = shared?.session && (shared.session.status === 'active' || shared.session.status === 'building');
        if (!hasSession) {
          cancelWorkoutRef.current();
          AsyncStorage.removeItem('@shared_workout_active').catch(() => {});
        }
      }
    }).catch(() => {});
  }, [shared?.loading]);

  // Quand la session partagée disparaît en cours de route, clear le workout local
  useEffect(() => {
    const hasSession = shared?.session && (shared.session.status === 'active' || shared.session.status === 'building');
    if (hasSession) {
      wasSharedRef.current = true;
    } else if (wasSharedRef.current) {
      wasSharedRef.current = false;
      cancelWorkoutRef.current();
      AsyncStorage.removeItem('@shared_workout_active').catch(() => {});
    }
  }, [shared?.session]);

  useEffect(() => {
    if (!shared?.session) {
      injectedRef.current = null;
      injectedCountRef.current = 0;
      AsyncStorage.removeItem('@shared_workout_active').catch(() => {});
      return;
    }
    const session = shared.session;
    if (session.status !== 'active' && session.status !== 'building') return;
    AsyncStorage.setItem('@shared_workout_active', 'true').catch(() => {});

    const sessionId = String(session._id);
    const sharedExercises = session.exercises || [];

    // Reset si c'est une nouvelle session
    if (injectedRef.current !== sessionId) {
      injectedRef.current = sessionId;
      injectedCountRef.current = 0;
    }

    // Suppressions sont toujours personnelles (via toggleSelection en building, removeMyExercise en active)
    // Le SharedSessionSync ne supprime jamais d'exos locaux

    // Injecter les nouveaux exercices
    const newExercises = sharedExercises.slice(injectedCountRef.current);
    for (const ex of newExercises) {
      const stableId = ex.exerciseId || ('shared_' + ex.exerciseName.replace(/\s+/g, '_').toLowerCase());
      addExercise({
        id: stableId,
        name: ex.exerciseName,
        type: Array.isArray(ex.type) ? ex.type[0] : (ex.type || 'muscu'),
        muscles: ex.muscles || [],
        muscle: ex.primaryMuscle || (ex.muscles && ex.muscles[0]) || null,
        primaryMuscle: ex.primaryMuscle || (ex.muscles && ex.muscles[0]) || null,
        secondaryMuscles: ex.secondaryMuscles || [],
        equipment: Array.isArray(ex.equipment) ? ex.equipment.join(', ') : (ex.equipment || ''),
        category: ex.category || null,
      });
    }
    injectedCountRef.current = sharedExercises.length;

    // Lancer le timer avec le bon startedAt de la session partagée
    if (session.status === 'active') {
      if (session.startedAt && setWorkoutStartTime) {
        // Reprendre le timestamp original (pas now())
        setWorkoutStartTime(session.startedAt);
      } else {
        startWorkout();
      }
    }
  }, [shared?.session]);

  return null;
}

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    notificationService.registerForPushNotifications();
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync('transparent');
    }
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <WorkoutProvider>
          <SharedSessionProvider>
            <ChatProvider>
              <RecipeProvider>
                <ProgramProvider>
                  <StatusBar style={isDark ? 'light' : 'dark'} />
                  <Navigation />
                  <SharedSessionSync />
                  <HealthDisclaimerModal />
                  <HealthConnectOnboarding />
                </ProgramProvider>
              </RecipeProvider>
            </ChatProvider>
          </SharedSessionProvider>
        </WorkoutProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
