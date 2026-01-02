import { createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../screens/auth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import NotificationHandler from '../components/NotificationHandler';

// Ref de navigation globale pour naviguer depuis n'importe ou (ex: ChatContext)
export const navigationRef = createRef();

// Écrans de chat au niveau racine pour couvrir la navbar
import ChatDetailScreen from '../screens/chat/ChatDetailScreen';
import AIChatScreen from '../screens/chat/AIChatScreen';
import UserProfileScreen from '../screens/matching/UserProfileScreen';

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
        component={UserProfileScreen}
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
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
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
