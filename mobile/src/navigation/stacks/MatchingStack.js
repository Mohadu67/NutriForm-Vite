import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MatchingScreen from '../../screens/matching/MatchingScreen';
import MatchesListScreen from '../../screens/matching/MatchesListScreen';

// Chat (accessible depuis le matching uniquement)
import ConversationsScreen from '../../screens/chat/ConversationsScreen';
import ChatDetailScreen from '../../screens/chat/ChatDetailScreen';
import AIChatScreen from '../../screens/chat/AIChatScreen';

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

      {/* Chat - accessible depuis le matching */}
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
