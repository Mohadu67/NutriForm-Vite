import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/contexts/AuthContext';
import { WorkoutProvider } from './src/contexts/WorkoutContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { RecipeProvider } from './src/contexts/RecipeContext';
import { ProgramProvider } from './src/contexts/ProgramContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { ThemeProvider, useTheme } from './src/theme';
import Navigation from './src/navigation';
import notificationService from './src/services/notificationService';
import HealthDisclaimerModal from './src/components/HealthDisclaimerModal';
import HealthConnectOnboarding from './src/components/HealthConnectOnboarding';

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
          <ChatProvider>
            <RecipeProvider>
              <ProgramProvider>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <Navigation />
                <HealthDisclaimerModal />
                <HealthConnectOnboarding />
              </ProgramProvider>
            </RecipeProvider>
          </ChatProvider>
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
