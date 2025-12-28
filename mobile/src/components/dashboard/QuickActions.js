import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * QuickActions - Boutons d'actions rapides
 * Programmes et Recettes accessibles depuis le dashboard
 */
export const QuickActions = ({ navigation, subscriptionTier = 'free' }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryColor = theme.colors.primary;

  return (
    <View style={styles.container}>
      {/* Row 1: Programmes et Recettes */}
      <View style={styles.row}>
        {/* Programmes */}
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation?.navigate('Programs')}
          activeOpacity={0.8}
        >
          <Ionicons name="fitness" size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Programmes</Text>
        </TouchableOpacity>

        {/* Recettes */}
        <TouchableOpacity
          style={[styles.primaryAction, { backgroundColor: '#22C55E' }]}
          onPress={() => navigation?.navigate('Recipes')}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant" size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Recettes</Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: Calculs */}
      <TouchableOpacity
        style={[styles.secondaryAction, isDark && styles.secondaryActionDark]}
        onPress={() => navigation?.navigate('Calculators')}
        activeOpacity={0.7}
      >
        <Ionicons name="calculator" size={18} color={primaryColor} />
        <Text style={[styles.secondaryActionText, { color: primaryColor }]}>
          Calculateurs IMC, Calories, 1RM...
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
    fontWeight: theme.fontWeight.semiBold,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
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
