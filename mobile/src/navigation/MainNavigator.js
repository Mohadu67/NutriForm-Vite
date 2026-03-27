import React, { useMemo, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Pressable, Text, Animated } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import HomeStack from './stacks/HomeStack';
import ExercicesStack from './stacks/ExercicesStack';
import FluxStack from './stacks/FluxStack';
import ProfileStack from './stacks/ProfileStack';

import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

const Tab = createBottomTabNavigator();

const COLORS = {
  bg: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.97)',
  accent: '#E8895A',         // peach plus saturé → meilleur contraste sur blanc
  accentLabel: '#D4754A',    // encore plus foncé pour le texte
  activePill: 'rgba(232, 137, 90, 0.12)',
  iconInactive: '#9A9A9A',   // gris moyen, lisible sur blanc
  textMuted: '#888888',
  border: 'rgba(0, 0, 0, 0.10)',
  shadow: '#C8A090',         // shadow teintée peach, plus élégant
};

const ICON_MAP = {
  HomeTab:     'home',
  ExercicesTab:'barbell',
  FluxTab:     'newspaper',
  ProfileTab:  'person',
};

const TAB_BAR_HEIGHT = 68;

const BASE_TAB_CONFIG = [
  { name: 'HomeTab',      component: HomeStack,      label: 'Home',     requiresPremium: false },
  { name: 'ExercicesTab', component: ExercicesStack, label: 'Train',    requiresPremium: false },
  { name: 'FluxTab',      component: FluxStack,      label: 'Flux',     requiresPremium: false },
  { name: 'ProfileTab',   component: ProfileStack,   label: 'Moi',      requiresPremium: false },
];

const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  return ['ProgramRunner'].includes(routeName);
};

// ─── Tab item with spring scale animation ────────────────────────────────────
function TabItem({ route, isFocused, onPress, onLongPress, label, unreadCount }) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconName = ICON_MAP[route.name];

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabInner,
          isFocused && styles.tabInnerActive,
          { transform: [{ scale }] },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={isFocused ? iconName : `${iconName}-outline`}
            size={24}
            color={isFocused ? COLORS.accent : COLORS.iconInactive}
          />
          {unreadCount > 0 && <View style={styles.badge} />}
        </View>

        <Text
          style={[
            styles.label,
            isFocused ? styles.labelActive : styles.labelInactive,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Floating glass tab bar ───────────────────────────────────────────────────
function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useChat();

  const bottomOffset = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomOffset }]}>
      <BlurView intensity={60} tint="light" style={styles.blurView}>
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                label={label}
                unreadCount={route.name === 'FluxTab' ? unreadCount : 0}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

// ─── Main Navigator ───────────────────────────────────────────────────────────
export default function MainNavigator() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const isPremium = user?.isPremium || user?.subscriptionTier === 'premium' || user?.role === 'admin';

  const TAB_CONFIG = useMemo(() => {
    return BASE_TAB_CONFIG.filter(tab => !(tab.requiresPremium && !isPremium));
  }, [isPremium]);

  const sceneBottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 16;

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      sceneContainerStyle={{ paddingBottom: sceneBottomPadding }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {TAB_CONFIG.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={({ route }) => ({
            tabBarLabel: tab.label,
            tabBarStyle: getTabBarVisibility(route) ? { display: 'none' } : undefined,
          })}
        />
      ))}
    </Tab.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Floating wrapper positionne la bar au-dessus du safe area
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: TAB_BAR_HEIGHT,
    borderRadius: 36,
    overflow: 'hidden',
    // Shadow iOS
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    // Shadow Android
    elevation: 12,
  },

  blurView: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },

  // Pill highlight sur l'item actif
  tabInnerActive: {
    backgroundColor: COLORS.activePill,
  },

  iconWrap: {
    position: 'relative',
  },

  label: {
    fontSize: 13,
    letterSpacing: -0.2,
  },

  labelActive: {
    color: COLORS.accentLabel,
    fontWeight: '700',
  },

  labelInactive: {
    display: 'none',
  },

  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
});
