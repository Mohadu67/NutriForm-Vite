import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { WorkoutProvider } from './src/contexts/WorkoutContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { RecipeProvider } from './src/contexts/RecipeContext';
import { ProgramProvider } from './src/contexts/ProgramContext';
import Navigation from './src/navigation';
import notificationService from './src/services/notificationService';
import Toast from './src/components/ui/Toast';
import HealthDisclaimerModal from './src/components/HealthDisclaimerModal';
import { logger } from './src/services/logger';

export default function App() {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState({});

  useEffect(() => {
    // Enregistrer pour les notifications push
    notificationService.registerForPushNotifications();

    // Configurer les listeners de notifications
    notificationService.setupNotificationListeners(
      // Quand une notification est reçue (app au premier plan)
      (notification) => {
        logger.notifications.info('Notification reçue', notification);
        const { title, body, data } = notification.request.content;

        // Afficher le toast in-app
        showToast(title, body, data);
      },
      // Quand l'utilisateur tape sur une notification
      (response) => {
        logger.notifications.info('Notification tapped', response);
        const { data } = response.notification.request.content;

        // Naviguer vers la conversation (géré par Navigation)
        if (data?.conversationId) {
          // TODO: Implémenter la navigation vers la conversation
          logger.notifications.debug('Navigate to conversation', data.conversationId);
        }
      }
    );

    return () => {
      notificationService.cleanup();
    };
  }, []);

  const showToast = (title, message, data = {}) => {
    setToastData({ title, message, ...data });
    setToastVisible(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <WorkoutProvider>
            <ChatProvider>
              <RecipeProvider>
                <ProgramProvider>
                  <StatusBar style="dark" />
                  <Navigation />

                  {/* Toast pour les notifications in-app */}
                  <Toast
                    visible={toastVisible}
                    title={toastData.title}
                    message={toastData.message}
                    avatar={toastData.avatar}
                    onPress={() => {
                      setToastVisible(false);
                      // TODO: Navigation vers la conversation
                      if (toastData.conversationId) {
                        logger.notifications.debug('Navigate to conversation from toast', toastData.conversationId);
                      }
                    }}
                    onDismiss={() => setToastVisible(false)}
                  />

                  {/* Disclaimer santé au premier lancement */}
                  <HealthDisclaimerModal />
                </ProgramProvider>
              </RecipeProvider>
            </ChatProvider>
          </WorkoutProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
