import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ExercicesScreen from '../../screens/exercices/ExercicesScreen';
import ExerciceDetailScreen from '../../screens/exercices/ExerciceDetailScreen';

const Stack = createNativeStackNavigator();

export default function ExercicesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Exercices" component={ExercicesScreen} />
      <Stack.Screen name="ExerciceDetail" component={ExerciceDetailScreen} />
    </Stack.Navigator>
  );
}
