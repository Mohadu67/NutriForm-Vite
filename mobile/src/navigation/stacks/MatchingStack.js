import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MatchingScreen from '../../screens/matching/MatchingScreen';
import MatchesListScreen from '../../screens/matching/MatchesListScreen';

// Conversations list (ChatDetail et AIChat sont au niveau racine)
import ConversationsScreen from '../../screens/chat/ConversationsScreen';

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
      <Stack.Screen
        name="MatchesList"
        component={MatchesListScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
