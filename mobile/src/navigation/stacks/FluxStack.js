import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FluxScreen from '../../screens/social/FluxScreen';
import UserPublicProfileScreen from '../../screens/social/UserPublicProfileScreen';
import MatchingScreen from '../../screens/matching/MatchingScreen';
import MatchesListScreen from '../../screens/matching/MatchesListScreen';

// ⚠️  ChatDetail et AIChat → définis au niveau root (navigation/index.js) en overlay.
//     ConversationsScreen → déjà intégré dans l'onglet "Messages" de MatchingScreen.

const Stack = createNativeStackNavigator();

export default function FluxStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Flux" component={FluxScreen} />
      <Stack.Screen name="UserPublicProfile" component={UserPublicProfileScreen} />
      <Stack.Screen
        name="Matching"
        component={MatchingScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="MatchesList" component={MatchesListScreen} />
    </Stack.Navigator>
  );
}
