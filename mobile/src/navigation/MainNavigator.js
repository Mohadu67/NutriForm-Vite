import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Platform } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import HomeStack from './stacks/HomeStack';
import ExercicesStack from './stacks/ExercicesStack';
import MatchingStack from './stacks/MatchingStack';
import ProfileStack from './stacks/ProfileStack';

import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

// Configuration de base des tabs - Navigation simplifiée
// Chat accessible depuis Matching uniquement, Recettes/Programmes depuis dashboard
const BASE_TAB_CONFIG = [
  {
    name: 'HomeTab',
    component: HomeStack,
    label: 'Accueil',
    icon: 'home',
    requiresPremium: false,
  },
  {
    name: 'ExercicesTab',
    component: ExercicesStack,
    label: 'Exercices',
    icon: 'barbell',
    requiresPremium: false,
  },
  {
    name: 'MatchingTab',
    component: MatchingStack,
    label: 'Matching',
    icon: 'people',
    requiresPremium: true, // Réservé aux premium
  },
  {
    name: 'ProfileTab',
    component: ProfileStack,
    label: 'Profil',
    icon: 'person',
    requiresPremium: false,
  },
];

// Fonction pour déterminer si la tab bar doit être cachée
const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route);

  // Liste des écrans où la tab bar doit être cachée
  const hideOnScreens = ['ChatDetail', 'AIChat', 'ProgramRunner'];

  if (hideOnScreens.includes(routeName)) {
    return { display: 'none' };
  }

  return undefined;
};

export default function MainNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();

  // Vérifier si l'utilisateur est premium
  // Le backend retourne isPremium directement, ou subscriptionTier === 'premium'
  const isPremium = user?.isPremium || user?.subscriptionTier === 'premium' || user?.role === 'admin';

  // Filtrer les tabs en fonction du statut premium
  const TAB_CONFIG = useMemo(() => {
    return BASE_TAB_CONFIG.filter(tab => {
      // Si le tab requiert premium et l'utilisateur n'est pas premium, ne pas l'afficher
      if (tab.requiresPremium && !isPremium) {
        return false;
      }
      return true;
    });
  }, [isPremium]);

  const defaultTabBarStyle = {
    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
    borderTopColor: isDark ? '#333333' : theme.colors.border.light,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    height: Platform.OS === 'ios' ? 88 : 64,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? '#888888' : theme.colors.text.tertiary,
        tabBarStyle: defaultTabBarStyle,
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
          options={({ route }) => ({
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.icon : `${tab.icon}-outline`}
                size={24}
                color={color}
              />
            ),
            // Cacher la tab bar sur certains écrans (Matching pour chat/programmes)
            tabBarStyle: tab.name === 'MatchingTab'
              ? getTabBarVisibility(route) ?? defaultTabBarStyle
              : defaultTabBarStyle,
          })}
        />
      ))}
    </Tab.Navigator>
  );
}
