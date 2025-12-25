import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

export default function MatchingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textDark]}>Matching</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Trouve ton partenaire sport
          </Text>
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, isDark && styles.cardDark]}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people" size={64} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
              Bientot disponible
            </Text>
            <Text style={[styles.emptyText, isDark && styles.subtitleDark]}>
              Trouve des partenaires de sport pres de chez toi pour t'entrainer ensemble
            </Text>
          </View>

          {/* Features preview */}
          <View style={styles.features}>
            {[
              { icon: 'location', text: 'Partenaires proches' },
              { icon: 'fitness', text: 'Memes objectifs' },
              { icon: 'chatbubbles', text: 'Messagerie integree' },
            ].map((feature, index) => (
              <View key={index} style={[styles.featureItem, isDark && styles.cardDark]}>
                <Ionicons name={feature.icon} size={24} color={theme.colors.primary} />
                <Text style={[styles.featureText, isDark && styles.textDark]}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  subtitleDark: {
    color: '#888888',
  },
  textDark: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: theme.spacing.xl,
  },
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
  },
});
