import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { WorkoutProvider } from './src/contexts/WorkoutContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { RecipeProvider } from './src/contexts/RecipeContext';
import { ProgramProvider } from './src/contexts/ProgramContext';
import { ToastProvider } from './src/contexts/ToastContext';
import Navigation from './src/navigation';
import notificationService from './src/services/notificationService';
import HealthDisclaimerModal from './src/components/HealthDisclaimerModal';
import HealthConnectOnboarding from './src/components/HealthConnectOnboarding';

export default function App() {
  useEffect(() => {
    // Enregistrer pour les notifications push
    notificationService.registerForPushNotifications();

    // Configurer la couleur de la barre système Android (transparente)
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync('transparent');
    }

    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <WorkoutProvider>
              <ChatProvider>
                <RecipeProvider>
                  <ProgramProvider>
                    <StatusBar style="dark" />
                    <Navigation />
                    <HealthDisclaimerModal />
                    <HealthConnectOnboarding />
                  </ProgramProvider>
                </RecipeProvider>
              </ChatProvider>
            </WorkoutProvider>
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
