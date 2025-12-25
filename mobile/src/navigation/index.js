import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../screens/auth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

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
          component={MainNavigator}
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
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
