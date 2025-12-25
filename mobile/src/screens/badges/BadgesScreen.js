import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

// Definition des badges disponibles
const ALL_BADGES = [
  // Seances
  { id: 'first_session', emoji: '🎯', name: 'Premiere seance', description: 'Complete ta premiere seance', category: 'seances', requirement: 1 },
  { id: 'sessions_5', emoji: '💪', name: '5 seances', description: 'Complete 5 seances', category: 'seances', requirement: 5 },
  { id: 'sessions_10', emoji: '🔥', name: '10 seances', description: 'Complete 10 seances', category: 'seances', requirement: 10 },
  { id: 'sessions_25', emoji: '⚡', name: '25 seances', description: 'Complete 25 seances', category: 'seances', requirement: 25 },
  { id: 'sessions_50', emoji: '🏆', name: '50 seances', description: 'Complete 50 seances', category: 'seances', requirement: 50 },
  { id: 'sessions_100', emoji: '👑', name: 'Centurion', description: 'Complete 100 seances', category: 'seances', requirement: 100 },

  // Streak
  { id: 'streak_3', emoji: '🔥', name: 'Serie de 3', description: '3 jours consecutifs', category: 'streak', requirement: 3 },
  { id: 'streak_7', emoji: '🌟', name: 'Semaine parfaite', description: '7 jours consecutifs', category: 'streak', requirement: 7 },
  { id: 'streak_14', emoji: '💎', name: '2 semaines', description: '14 jours consecutifs', category: 'streak', requirement: 14 },
  { id: 'streak_30', emoji: '🏅', name: 'Mois parfait', description: '30 jours consecutifs', category: 'streak', requirement: 30 },

  // Special
  { id: 'early_bird', emoji: '🌅', name: 'Leve-tot', description: 'Seance avant 7h', category: 'special' },
  { id: 'night_owl', emoji: '🦉', name: 'Oiseau de nuit', description: 'Seance apres 22h', category: 'special' },
  { id: 'weekend_warrior', emoji: '⚔️', name: 'Guerrier du weekend', description: 'Seance samedi et dimanche', category: 'special' },
  { id: 'variety', emoji: '🎨', name: 'Variete', description: 'Travaille 6 groupes musculaires differents', category: 'special' },
];

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'seances', label: 'Seances' },
  { id: 'streak', label: 'Serie' },
  { id: 'special', label: 'Special' },
];

/**
 * BadgesScreen - Collection de badges
 */
export default function BadgesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [unlockedBadges, setUnlockedBadges] = useState([]);

  // Charger les stats pour determiner les badges debloques
  const loadStats = useCallback(async () => {
    try {
      const response = await apiClient.get(endpoints.history.summary);
      setStats(response.data);

      // Calculer les badges debloques
      const data = response.data || {};
      const totalSessions = data.totalSessions || 0;
      const streak = data.streakDays || 0;

      const unlocked = [];

      // Badges seances
      if (totalSessions >= 1) unlocked.push('first_session');
      if (totalSessions >= 5) unlocked.push('sessions_5');
      if (totalSessions >= 10) unlocked.push('sessions_10');
      if (totalSessions >= 25) unlocked.push('sessions_25');
      if (totalSessions >= 50) unlocked.push('sessions_50');
      if (totalSessions >= 100) unlocked.push('sessions_100');

      // Badges streak
      if (streak >= 3) unlocked.push('streak_3');
      if (streak >= 7) unlocked.push('streak_7');
      if (streak >= 14) unlocked.push('streak_14');
      if (streak >= 30) unlocked.push('streak_30');

      setUnlockedBadges(unlocked);
    } catch (error) {
      console.error('[BADGES] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  // Filtrer les badges par categorie
  const filteredBadges = selectedCategory === 'all'
    ? ALL_BADGES
    : ALL_BADGES.filter(b => b.category === selectedCategory);

  // Compter les badges
  const totalBadges = ALL_BADGES.length;
  const unlockedCount = unlockedBadges.length;
  const progress = Math.round((unlockedCount / totalBadges) * 100);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
          Badges
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.badgeCount, { color: theme.colors.primary }]}>
            {unlockedCount}/{totalBadges}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Progress Card */}
        <View style={[styles.progressCard, isDark && styles.progressCardDark]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, isDark && styles.progressTitleDark]}>
              Ta collection
            </Text>
            <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
              {progress}%
            </Text>
          </View>
          <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
            <View
              style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]}
            />
          </View>
          <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
            {unlockedCount} badge{unlockedCount !== 1 ? 's' : ''} debloque{unlockedCount !== 1 ? 's' : ''} sur {totalBadges}
          </Text>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                isDark && styles.categoryPillDark,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryText,
                isDark && styles.categoryTextDark,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Badges Grid */}
        <View style={styles.badgesGrid}>
          {filteredBadges.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id);

            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  isDark && styles.badgeCardDark,
                  !isUnlocked && styles.badgeCardLocked,
                ]}
              >
                <View style={[
                  styles.badgeEmoji,
                  !isUnlocked && styles.badgeEmojiLocked,
                ]}>
                  <Text style={styles.badgeEmojiText}>
                    {isUnlocked ? badge.emoji : '🔒'}
                  </Text>
                </View>
                <Text style={[
                  styles.badgeName,
                  isDark && styles.badgeNameDark,
                  !isUnlocked && styles.badgeNameLocked,
                ]} numberOfLines={1}>
                  {badge.name}
                </Text>
                <Text style={[
                  styles.badgeDesc,
                  isDark && styles.badgeDescDark,
                  !isUnlocked && styles.badgeDescLocked,
                ]} numberOfLines={2}>
                  {badge.description}
                </Text>
                {isUnlocked && (
                  <View style={styles.unlockedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Prochain badge */}
        {unlockedCount < totalBadges && (
          <View style={[styles.nextBadgeCard, isDark && styles.nextBadgeCardDark]}>
            <Ionicons name="trophy-outline" size={24} color={theme.colors.primary} />
            <View style={styles.nextBadgeContent}>
              <Text style={[styles.nextBadgeTitle, isDark && styles.nextBadgeTitleDark]}>
                Prochain badge
              </Text>
              <Text style={[styles.nextBadgeText, isDark && styles.nextBadgeTextDark]}>
                Continue tes efforts pour debloquer plus de badges !
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerRight: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  badgeCount: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCardDark: {
    backgroundColor: '#2A2A2A',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  progressTitleDark: {
    color: '#FFFFFF',
  },
  progressPercent: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressBarDark: {
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  progressTextDark: {
    color: '#888',
  },
  categoriesScroll: {
    marginBottom: theme.spacing.md,
  },
  categoriesContainer: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  categoryPill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.full,
  },
  categoryPillDark: {
    backgroundColor: '#333',
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  categoryTextDark: {
    color: '#888',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  badgeCardDark: {
    backgroundColor: '#2A2A2A',
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  badgeEmojiLocked: {
    backgroundColor: '#F3F4F6',
  },
  badgeEmojiText: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameDark: {
    color: '#FFFFFF',
  },
  badgeNameLocked: {
    color: theme.colors.text.tertiary,
  },
  badgeDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeDescDark: {
    color: '#888',
  },
  badgeDescLocked: {
    color: theme.colors.text.tertiary,
  },
  unlockedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  nextBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  nextBadgeCardDark: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  nextBadgeContent: {
    flex: 1,
  },
  nextBadgeTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  nextBadgeTitleDark: {
    color: '#FFFFFF',
  },
  nextBadgeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  nextBadgeTextDark: {
    color: '#999',
  },
});
