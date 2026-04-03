import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Pressable, Text, Animated, TouchableOpacity, PanResponder, Dimensions } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import HomeStack from './stacks/HomeStack';
import ExercicesStack from './stacks/ExercicesStack';
import FluxStack from './stacks/FluxStack';
import ProfileStack from './stacks/ProfileStack';

import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSharedSession } from '../contexts/SharedSessionContext';
import { useTheme } from '../theme';
import WorkoutContent from '../components/workout/WorkoutContent';

const Tab = createBottomTabNavigator();
const { height: SCREEN_H } = Dimensions.get('window');

const LIGHT_COLORS = {
  bg: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.97)',
  accent: '#E8895A',
  accentLabel: '#D4754A',
  activePill: 'rgba(232, 137, 90, 0.12)',
  iconInactive: '#9A9A9A',
  textMuted: '#888888',
  border: 'rgba(0, 0, 0, 0.10)',
  shadow: '#C8A090',
};

const DARK_COLORS = {
  bg: '#12151A',
  glass: 'rgba(18, 21, 27, 0.97)',
  accent: '#F7B186',
  accentLabel: '#F9C4A3',
  activePill: 'rgba(247, 177, 134, 0.15)',
  iconInactive: '#8A8E96',
  textMuted: '#8A8E96',
  border: 'rgba(255, 255, 255, 0.08)',
  shadow: '#000000',
};

const ICON_MAP = {
  HomeTab: 'home',
  ExercicesTab: 'barbell',
  FluxTab: 'newspaper',
  ProfileTab: 'person',
};

const TAB_BAR_HEIGHT = 62;
const MINI_BAR_HEIGHT = 44;
const COLLAPSED_H = TAB_BAR_HEIGHT + MINI_BAR_HEIGHT;
const MID_H = SCREEN_H * 0.55;
const FULL_H = SCREEN_H * 0.88;

const SPRING = { speed: 14, bounciness: 4, useNativeDriver: false };

const BASE_TAB_CONFIG = [
  { name: 'HomeTab', component: HomeStack, label: 'Home', requiresPremium: false },
  { name: 'ExercicesTab', component: ExercicesStack, label: 'Train', requiresPremium: false },
  { name: 'FluxTab', component: FluxStack, label: 'Flux', requiresPremium: false },
  { name: 'ProfileTab', component: ProfileStack, label: 'Moi', requiresPremium: false },
];

const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  return routeName === 'ProgramRunner';
};

// ─── Live timer ──────────────────────────────────────────────────────────────
function MiniTimer({ startTime, colors: C }) {
  const [elapsed, setElapsed] = useState('00:00');
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return <Text style={[miniStyles.timer, { color: C.accent }]}>{elapsed}</Text>;
}

// ─── Mini bar ────────────────────────────────────────────────────────────────
function WorkoutMiniBar({ isExpanded, colors: C }) {
  const { currentWorkout, getCompletedSetsCount, getTotalSetsCount } = useWorkout();
  const shared = useSharedSession();
  const hasLocal = currentWorkout && currentWorkout.exercises?.length > 0;
  const hasShared = shared?.session && (shared.session.status === 'active' || shared.session.status === 'building');

  if (!hasLocal && !hasShared) return null;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isExpanded) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -3, duration: 700, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    bounce.start();
    return () => { pulse.stop(); bounce.stop(); };
  }, [isExpanded, pulseAnim, bounceAnim]);

  const isActive = hasLocal && !!currentWorkout.startTime;
  const count = hasLocal ? currentWorkout.exercises.length : (shared?.session?.exercises?.length || 0);
  const completed = hasLocal ? getCompletedSetsCount() : 0;
  const total = hasLocal ? getTotalSetsCount() : 0;
  const partnerName = shared?.partner?.pseudo || shared?.partner?.username || '';

  return (
    <View style={[miniStyles.container, { borderTopColor: C.border }]}>
      <Animated.View
        style={[
          miniStyles.handleWrap,
          !isExpanded && { transform: [{ translateY: bounceAnim }, { scaleX: pulseAnim }] },
        ]}
      >
        <View style={[miniStyles.handle, { backgroundColor: hasShared ? '#72baa1' : C.accent }]} />
      </Animated.View>
      <View style={miniStyles.row}>
        <View style={miniStyles.info}>
          {isActive ? (
            <>
              <View style={miniStyles.liveDot} />
              <MiniTimer startTime={currentWorkout.startTime} colors={C} />
              <Text style={[miniStyles.sep, { color: C.textMuted }]}>•</Text>
              <Text style={[miniStyles.detail, { color: C.textMuted }]}>{completed}/{total} series</Text>
            </>
          ) : hasShared && !hasLocal ? (
            <>
              <Ionicons name="people" size={18} color="#72baa1" />
              <Text style={[miniStyles.detail, { color: C.textMuted }]}>
                Séance avec {partnerName} • {count} exo{count > 1 ? 's' : ''}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="barbell-outline" size={20} color={C.accent} />
              <Text style={[miniStyles.detail, { color: C.textMuted }]}>{count} exercice{count > 1 ? 's' : ''}</Text>
            </>
          )}
        </View>
        <View style={[miniStyles.chevron, { backgroundColor: hasShared && !hasLocal ? '#72baa120' : `${C.accent}20` }]}>
          <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-up'} size={16} color={hasShared && !hasLocal ? '#72baa1' : C.accent} />
        </View>
      </View>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  container: {
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  handleWrap: {
    alignSelf: 'center',
    paddingVertical: 0,
    marginBottom: 0,
    paddingTop:12,
  },
  handle: {
    width: 100,
    height: 6,
    borderRadius: 4,
    opacity: 0.70,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 5 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  timer: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sep: { fontSize: 11 },
  detail: { fontSize: 14, fontWeight: '500' },
  chevron: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

// ─── Tab item ────────────────────────────────────────────────────────────────
function TabItem({ route, isFocused, onPress, onLongPress, label, unreadCount, colors: C }) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconName = ICON_MAP[route.name];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start()}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabInner, isFocused && { backgroundColor: C.activePill }, { transform: [{ scale }] }]}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isFocused ? iconName : `${iconName}-outline`}
            size={22}
            color={isFocused ? C.accent : C.iconInactive}
          />
          {unreadCount > 0 && <View style={[styles.badge, { borderColor: C.bg }]} />}
        </View>
        <Text style={[styles.label, isFocused ? { color: C.accentLabel, fontWeight: '700' } : styles.labelInactive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Floating tab bar (extensible) ───────────────────────────────────────────
function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useChat();
  const { currentWorkout } = useWorkout();
  const { isDark } = useTheme();
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

  const shared = useSharedSession();
  const hasSharedBuilding = shared?.session && shared.session.status === 'building';
  const hasSharedActive = shared?.session && (shared.session.status === 'active' || shared.session.status === 'building');
  const partnerName = shared?.partner?.pseudo || shared?.partner?.username || 'Partenaire';
  const hasLocalExercises = !!(currentWorkout && currentWorkout.exercises?.length > 0);
  const hasWorkout = hasLocalExercises || hasSharedActive;
  const heightAnim = useRef(new Animated.Value(TAB_BAR_HEIGHT)).current;
  const currentHeight = useRef(TAB_BAR_HEIGHT);
  const startDragH = useRef(TAB_BAR_HEIGHT);
  const [expanded, setExpanded] = useState(false);

  // Ref pour que le PanResponder ait toujours accès à la dernière version
  const animateToRef = useRef(null);

  // Animate to target height
  const animateTo = useCallback((target) => {
    currentHeight.current = target;
    setExpanded(target > COLLAPSED_H + 20);
    Animated.spring(heightAnim, { toValue: target, ...SPRING }).start();
  }, [heightAnim]);

  animateToRef.current = animateTo;

  const INVITE_BAR_HEIGHT = 40;
  const hasPendingInvite = !!shared?.pendingInvite;
  const hasSharedBanner = !hasPendingInvite && hasSharedActive && !hasWorkout;
  const extraHeight = (hasPendingInvite || hasSharedBanner) ? INVITE_BAR_HEIGHT : 0;

  // When workout/invite appears/disappears, animate height
  useEffect(() => {
    if (hasWorkout) {
      if (currentHeight.current <= TAB_BAR_HEIGHT + extraHeight) {
        animateTo(COLLAPSED_H);
      }
    } else if (extraHeight > 0) {
      animateTo(TAB_BAR_HEIGHT + extraHeight);
    } else {
      animateTo(TAB_BAR_HEIGHT);
      setExpanded(false);
    }
  }, [hasWorkout, animateTo, extraHeight]);

  // Pan on the mini bar area
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderGrant: () => {
        startDragH.current = currentHeight.current;
      },
      onPanResponderMove: (_, gs) => {
        const newH = Math.max(COLLAPSED_H, Math.min(startDragH.current - gs.dy, FULL_H));
        heightAnim.setValue(newH);
      },
      onPanResponderRelease: (_, gs) => {
        const vy = gs.vy;
        const draggedUp = gs.dy < 0;
        const go = animateToRef.current;

        // Flick ou drag → 2 niveaux seulement : collapsed ↔ full
        if (draggedUp || vy < -0.2) {
          go(FULL_H);
        } else {
          go(COLLAPSED_H);
        }
      },
    })
  ).current;

  // Tap on mini bar to toggle collapsed ↔ full
  const handleMiniBarTap = useCallback(() => {
    if (currentHeight.current < FULL_H - 10) {
      animateTo(FULL_H);
    } else {
      animateTo(COLLAPSED_H);
    }
  }, [animateTo]);

  const bottomOffset = Math.max(insets.bottom, 4);

  // Animated border radius
  const borderRadius = heightAnim.interpolate({
    inputRange: [COLLAPSED_H, MID_H, FULL_H],
    outputRange: [24, 18, 0],
    extrapolate: 'clamp',
  });

  // Animated horizontal margin (wider as it expands)
  const horizontalMargin = heightAnim.interpolate({
    inputRange: [COLLAPSED_H, MID_H, FULL_H],
    outputRange: [12, 6, 0],
    extrapolate: 'clamp',
  });

  // Animated bottom offset (flush at full)
  const animatedBottom = heightAnim.interpolate({
    inputRange: [COLLAPSED_H, MID_H, FULL_H],
    outputRange: [bottomOffset, bottomOffset / 2, 0],
    extrapolate: 'clamp',
  });

  const innerContent = (
    <View style={styles.contentColumn}>
      {/* Workout content (above mini bar, grows as navbar extends) */}
      {hasWorkout && (
        <View style={styles.workoutArea}>
          <WorkoutContent onClose={() => animateTo(COLLAPSED_H)} tabNavigation={navigation} />
        </View>
      )}

      {/* Mini bar with pan handler */}
      {hasWorkout && (
        <Animated.View {...panResponder.panHandlers}>
          <TouchableOpacity activeOpacity={1} onPress={handleMiniBarTap}>
            <WorkoutMiniBar isExpanded={expanded} colors={COLORS} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bandeau invitation pending — Accepter / Refuser */}
      {shared?.pendingInvite && (
        <View style={[styles.inviteBanner, { borderTopColor: COLORS.border }]}>
          <View style={styles.sharedBannerDot} />
          <Ionicons name="people" size={16} color="#72baa1" />
          <Text style={[styles.sharedBannerText, { color: isDark ? '#fff' : '#333' }]} numberOfLines={1}>
            {shared.pendingInvite.initiator?.username || shared.pendingInvite.initiator?.pseudo || 'Gym bro'} t'invite
          </Text>
          <TouchableOpacity
            style={styles.inviteAcceptBtn}
            onPress={async () => {
              try {
                await shared.respond(shared.pendingInvite.sharedSessionId, true);
              } catch {}
            }}
          >
            <Text style={styles.inviteAcceptTxt}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.inviteDeclineBtn}
            onPress={() => shared.respond(shared.pendingInvite.sharedSessionId, false).catch(() => {})}
          >
            <Ionicons name="close" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* Le WorkoutContent gère l'affichage de la vue partenaire quand hasSharedActive */}

      {/* Tab row - always at bottom */}
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              label={label}
              unreadCount={route.name === 'FluxTab' ? unreadCount : 0}
              colors={COLORS}
            />
          );
        })}
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.floatingWrapper, { bottom: animatedBottom, height: heightAnim, borderRadius, left: horizontalMargin, right: horizontalMargin, shadowColor: COLORS.shadow }]}>
      {isDark ? (
        <View style={[styles.darkContainer, { borderColor: COLORS.border, backgroundColor: COLORS.glass }]}>
          {innerContent}
        </View>
      ) : (
        <BlurView intensity={100} tint="light" style={[styles.blurView, { borderColor: COLORS.border }]}>
          {innerContent}
        </BlurView>
      )}
    </Animated.View>
  );
}

// ─── Main Navigator ──────────────────────────────────────────────────────────
export default function MainNavigator() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const isPremium = user?.isPremium || user?.subscriptionTier === 'premium' || user?.role === 'admin';

  const TAB_CONFIG = useMemo(() => {
    return BASE_TAB_CONFIG.filter(tab => !(tab.requiresPremium && !isPremium));
  }, [isPremium]);

  const sceneBottomPadding = TAB_BAR_HEIGHT + MINI_BAR_HEIGHT + Math.max(insets.bottom, 16) + 40;
  const sceneBg = isDark ? DARK_COLORS.bg : LIGHT_COLORS.bg;

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      sceneContainerStyle={{ paddingBottom: sceneBottomPadding, backgroundColor: sceneBg }}
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  blurView: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  darkContainer: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  contentColumn: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  workoutArea: {
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 4,
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
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  iconWrap: {
    position: 'relative',
  },
  label: {
    fontSize: 12,
    letterSpacing: -0.3,
  },
  labelInactive: {
    display: 'none',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
  },
  sharedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  sharedBannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#72baa1' },
  sharedBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
  sharedBannerSub: { fontSize: 11, color: '#888' },
  inviteBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  inviteAcceptBtn: { backgroundColor: '#22C55E', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  inviteAcceptTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  inviteDeclineBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 5, borderRadius: 8 },
});
