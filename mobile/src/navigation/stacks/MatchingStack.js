import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MatchingScreen from '../../screens/matching/MatchingScreen';

const Stack = createNativeStackNavigator();

export default function MatchingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Matching" component={MatchingScreen} />
    </Stack.Navigator>
  );
}
