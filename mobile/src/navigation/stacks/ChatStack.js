import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ConversationsScreen from '../../screens/chat/ConversationsScreen';

const Stack = createNativeStackNavigator();

export default function ChatStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
    </Stack.Navigator>
  );
}
