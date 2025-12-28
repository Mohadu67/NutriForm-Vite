import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProgramsScreen from '../../screens/programs/ProgramsScreen';
import ProgramDetailScreen from '../../screens/programs/ProgramDetailScreen';
import ProgramRunnerScreen from '../../screens/programs/ProgramRunnerScreen';
import ProgramFormScreen from '../../screens/programs/ProgramFormScreen';
import ProgramHistoryScreen from '../../screens/programs/ProgramHistoryScreen';

const Stack = createNativeStackNavigator();

export default function ProgramsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Programs" component={ProgramsScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen
        name="ProgramRunner"
        component={ProgramRunnerScreen}
        options={{
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ProgramForm"
        component={ProgramFormScreen}
        options={{
          headerShown: true,
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="ProgramHistory" component={ProgramHistoryScreen} />
    </Stack.Navigator>
  );
}
