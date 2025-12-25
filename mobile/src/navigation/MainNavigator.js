import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Platform } from 'react-native';

import HomeStack from './stacks/HomeStack';
import ExercicesStack from './stacks/ExercicesStack';
import MatchingStack from './stacks/MatchingStack';
import ChatStack from './stacks/ChatStack';
import ProfileStack from './stacks/ProfileStack';

import { theme } from '../theme';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  {
    name: 'HomeTab',
    component: HomeStack,
    label: 'Accueil',
    icon: 'home',
  },
  {
    name: 'ExercicesTab',
    component: ExercicesStack,
    label: 'Exercices',
    icon: 'barbell',
  },
  {
    name: 'MatchingTab',
    component: MatchingStack,
    label: 'Matching',
    icon: 'people',
  },
  {
    name: 'ChatTab',
    component: ChatStack,
    label: 'Chat',
    icon: 'chatbubbles',
  },
  {
    name: 'ProfileTab',
    component: ProfileStack,
    label: 'Profil',
    icon: 'person',
  },
];

export default function MainNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? '#888888' : theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopColor: isDark ? '#333333' : theme.colors.border.light,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.icon : `${tab.icon}-outline`}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
