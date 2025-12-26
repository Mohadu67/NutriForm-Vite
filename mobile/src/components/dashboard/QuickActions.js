import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * QuickActions - Boutons d'actions rapides en row
 */
export const QuickActions = ({ navigation, subscriptionTier = 'free' }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isPremium = subscriptionTier === 'premium';
  const primaryColor = theme.colors.primary;

  return (
    <View style={styles.container}>
      {/* Programmes */}
      <TouchableOpacity
        style={styles.primaryAction}
        onPress={() => navigation?.navigate('Programmes')}
        activeOpacity={0.8}
      >
        <Ionicons name="list" size={20} color="#FFFFFF" />
        <Text style={styles.primaryActionText}>Programmes</Text>
      </TouchableOpacity>

      {/* Calculs santé */}
      <TouchableOpacity
        style={[styles.secondaryAction, isDark && styles.secondaryActionDark]}
        onPress={() => navigation?.navigate('Outils')}
        activeOpacity={0.7}
      >
        <Ionicons name="calculator" size={18} color={primaryColor} />
        <Text style={[styles.secondaryActionText, { color: primaryColor }]}>
          Calculs
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  secondaryActionDark: {
    backgroundColor: '#2A2A2A',
  },
  secondaryActionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});
