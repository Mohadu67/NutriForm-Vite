import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ConversationsScreen from '../../screens/chat/ConversationsScreen';
import ChatDetailScreen from '../../screens/chat/ChatDetailScreen';
import AIChatScreen from '../../screens/chat/AIChatScreen';

const Stack = createNativeStackNavigator();

export default function ChatStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
