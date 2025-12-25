import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../../screens/home/HomeScreen';
import NotificationsScreen from '../../screens/notifications/NotificationsScreen';
import HistoryScreen from '../../screens/history/HistoryScreen';
import BadgesScreen from '../../screens/badges/BadgesScreen';

const Stack = createNativeStackNavigator();

// Placeholder screens pour les ecrans non encore crees
const PlaceholderScreen = ({ route }) => {
  const React = require('react');
  const { View, Text, StyleSheet, TouchableOpacity, useColorScheme } = require('react-native');
  const { SafeAreaView } = require('react-native-safe-area-context');
  const { Ionicons } = require('@expo/vector-icons');
  const { useNavigation } = require('@react-navigation/native');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.titleDark]}>{route.name}</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>
        <Ionicons name="construct-outline" size={64} color={isDark ? '#555' : '#CCC'} />
        <Text style={[styles.text, isDark && styles.textDark]}>
          Ecran en construction
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = require('react-native').StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  containerDark: { backgroundColor: '#1A1A1A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#000' },
  titleDark: { color: '#FFF' },
  spacer: { width: 32 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 16, color: '#666' },
  textDark: { color: '#888' },
});

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Badges" component={BadgesScreen} />
      <Stack.Screen name="Leaderboard" component={PlaceholderScreen} />
      <Stack.Screen name="Outils" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}
