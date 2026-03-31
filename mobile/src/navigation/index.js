import { createRef, useState, useCallback, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../screens/auth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import NotificationHandler from '../components/NotificationHandler';
import SetPasswordModal from '../components/ui/SetPasswordModal';
import authService from '../api/auth';
import { storage } from '../services/storageService';

// Ref de navigation globale pour naviguer depuis n'importe ou (ex: ChatContext)
export const navigationRef = createRef();

// Écrans de chat au niveau racine pour couvrir la navbar
import ChatDetailScreen from '../screens/chat/ChatDetailScreen';
import AIChatScreen from '../screens/chat/AIChatScreen';
import UserPublicProfileScreen from '../screens/social/UserPublicProfileScreen';

const ONBOARDING_SEEN_KEY = 'onboarding_seen';

const Stack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

// Stack qui wrap MainNavigator + écrans de chat en overlay
function MainWithChat() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainNavigator} />
      <MainStack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <MainStack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <MainStack.Screen
        name="UserProfile"
        component={UserPublicProfileScreen}
        options={{
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
    </MainStack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, user, updateUser } = useAuth();
  const [dismissedSetPassword, setDismissedSetPassword] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null); // null = loading

  // Vérifier si l'onboarding a déjà été vu (AsyncStorage)
  useEffect(() => {
    (async () => {
      const seen = await storage.get(ONBOARDING_SEEN_KEY);
      setHasSeenOnboarding(!!seen);
    })();
  }, []);

  // Appelé quand l'onboarding est terminé (depuis OnboardingContext)
  const onOnboardingDone = useCallback(async () => {
    await storage.set(ONBOARDING_SEEN_KEY, { seen: true, at: Date.now() });
    setHasSeenOnboarding(true);
  }, []);

  const showSetPassword = isAuthenticated && user?.hasSetPassword === false && !dismissedSetPassword;

  const handleSetPassword = useCallback(async (password) => {
    await authService.setPassword(password);
    updateUser({ hasSetPassword: true });
  }, [updateUser]);

  // Attendre le chargement de l'auth ET du flag onboarding
  if (isLoading || hasSeenOnboarding === null) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          // Premier lancement : onboarding AVANT auth
          <Stack.Screen
            name="Onboarding"
            options={{ animation: 'fade', animationDuration: 400 }}
          >
            {() => <OnboardingNavigator onDone={onOnboardingDone} />}
          </Stack.Screen>
        ) : isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={MainWithChat}
            options={{
              animation: 'fade_from_bottom',
              animationDuration: 400,
            }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animation: 'fade',
              animationDuration: 300,
            }}
          />
        )}
      </Stack.Navigator>

      <SetPasswordModal
        visible={showSetPassword}
        onClose={() => setDismissedSetPassword(true)}
        onSubmit={handleSetPassword}
      />
    </>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
      <NotificationHandler />
    </NavigationContainer>
  );
}

// Fonction utilitaire pour naviguer depuis n'importe ou
export function navigate(name, params) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  }
}
