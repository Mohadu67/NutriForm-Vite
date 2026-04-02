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
  const { addExercise, startWorkout, currentWorkout } = useWorkout();
  const injectedRef = useRef(null);

  useEffect(() => {
    if (!shared?.session) return;
    const session = shared.session;
    if (session.status !== 'active' && session.status !== 'building') return;
    if (!session.exercises || session.exercises.length === 0) return;
    if (injectedRef.current === String(session._id)) return;
    if (currentWorkout?.exercises?.length > 0) {
      injectedRef.current = String(session._id);
      return;
    }
    injectedRef.current = String(session._id);
    for (const ex of session.exercises) {
      addExercise({
        id: ex.exerciseId || ('shared_' + ex.exerciseName + '_' + ex.order),
        name: ex.exerciseName,
        type: Array.isArray(ex.type) ? ex.type[0] : (ex.type || 'muscu'),
        muscles: ex.muscles || [],
        muscle: ex.primaryMuscle || (ex.muscles && ex.muscles[0]) || '',
        primaryMuscle: ex.primaryMuscle || (ex.muscles && ex.muscles[0]) || '',
        secondaryMuscles: ex.secondaryMuscles || [],
        equipment: Array.isArray(ex.equipment) ? ex.equipment[0] || '' : (ex.equipment || ''),
        category: ex.category || '',
      });
    }
    if (session.status === 'active') startWorkout();
  }, [shared?.session?._id, shared?.session?.status]);

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
