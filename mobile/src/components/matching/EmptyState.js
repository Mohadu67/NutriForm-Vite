import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme, colors } from '../../theme';
import { THEME_COLORS } from '../../constants/matching';

/**
 * EmptyState — Composant d'état vide réutilisable pour le matching.
 *
 * Props :
 *   icon          – nom Ionicons (ex. "chatbubbles", "people", "heart-outline")
 *   title         – titre principal
 *   subtitle      – texte descriptif
 *   actionLabel   – libellé du bouton d'action (optionnel)
 *   actionIcon    – icône du bouton d'action (défaut "people")
 *   onAction      – callback du bouton d'action
 *   isDark        – mode sombre
 *   useGradient   – utiliser un gradient pour l'icône (défaut true)
 *   isLoading     – afficher un loader dans le bouton
 *   disabled      – désactiver le bouton
 *   style         – style additionnel pour le container
 */
export default function EmptyState({
  icon = 'alert-circle-outline',
  title,
  subtitle,
  actionLabel,
  actionIcon = 'people',
  onAction,
  isDark = false,
  useGradient = true,
  isLoading = false,
  disabled = false,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {useGradient ? (
        <LinearGradient
          colors={isDark ? ['#1A1D24', '#22262E'] : ['#F5F6FA', '#F0F1F5']}
          style={styles.iconContainer}
        >
          <LinearGradient
            colors={THEME_COLORS.primaryGradient}
            style={styles.iconInner}
          >
            <Ionicons name={icon} size={40} color="#FFF" />
          </LinearGradient>
        </LinearGradient>
      ) : (
        <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
          <Ionicons name={icon} size={64} color={isDark ? '#555' : '#CCC'} />
        </View>
      )}
      <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
      <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
        {subtitle}
      </Text>
      {actionLabel && onAction ? (
        useGradient ? (
          <TouchableOpacity
            style={styles.ctaButtonWrapper}
            onPress={onAction}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={THEME_COLORS.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.ctaButton, (disabled || isLoading) && styles.ctaButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name={actionIcon} size={20} color="#FFF" />
                  <Text style={styles.ctaButtonText}>{actionLabel}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.simpleButton}
            onPress={onAction}
            disabled={disabled || isLoading}
          >
            <Ionicons name={actionIcon} size={20} color="#FFF" />
            <Text style={styles.simpleButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 40,
  },
  // Gradient icon (MatchingScreen style)
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Simple circle icon (MatchesListScreen style)
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircleDark: {
    backgroundColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  subtitleDark: {
    color: '#7A7D85',
  },
  // Gradient CTA button
  ctaButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 10,
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  // Simple button (MatchesListScreen style)
  simpleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  simpleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
