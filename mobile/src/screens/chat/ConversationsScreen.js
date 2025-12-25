import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';

export default function ConversationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textDark]}>Messages</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Tes conversations
          </Text>
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, isDark && styles.cardDark]}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles" size={64} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
              Pas encore de messages
            </Text>
            <Text style={[styles.emptyText, isDark && styles.subtitleDark]}>
              Trouve un partenaire dans l'onglet Matching pour commencer a discuter
            </Text>
          </View>

          {/* AI Coach teaser */}
          <View style={[styles.aiCard, isDark && styles.cardDark]}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconCircle}>
                <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.aiInfo}>
                <Text style={[styles.aiTitle, isDark && styles.textDark]}>Coach IA</Text>
                <Text style={[styles.aiSubtitle, isDark && styles.subtitleDark]}>
                  Ton assistant fitness personnel
                </Text>
              </View>
            </View>
            <Text style={[styles.aiText, isDark && styles.subtitleDark]}>
              Pose tes questions sur l'entrainement, la nutrition et plus encore
            </Text>
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
    marginBottom: theme.spacing.lg,
  },
  cardDark: {
    backgroundColor: '#2A2A2A',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  aiIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiInfo: {
    marginLeft: theme.spacing.md,
  },
  aiTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  aiSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  aiText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});
