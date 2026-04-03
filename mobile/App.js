import 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
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
  const { addExercise, startWorkout, currentWorkout, setWorkoutStartTime } = useWorkout();
  const injectedRef = useRef(null);

  // Track combien d'exos on a déjà injecté pour cette session
  const injectedCountRef = useRef(0);

  useEffect(() => {
    if (!shared?.session) {
      injectedRef.current = null;
      injectedCountRef.current = 0;
      return;
    }
    const session = shared.session;
    if (session.status !== 'active' && session.status !== 'building') return;

    const sessionId = String(session._id);
    const sharedExercises = session.exercises || [];

    // Reset si c'est une nouvelle session
    if (injectedRef.current !== sessionId) {
      injectedRef.current = sessionId;
      injectedCountRef.current = 0;
    }

    // Injecter les nouveaux exercices (ceux qu'on n'a pas encore ajoutés)
    const newExercises = sharedExercises.slice(injectedCountRef.current);
    for (const ex of newExercises) {
      // ID stable basé sur exerciseId ou exerciseName (pas order qui peut changer)
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
  }, [shared?.session?._id, shared?.session?.status, shared?.session?.exercises?.length]);

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
