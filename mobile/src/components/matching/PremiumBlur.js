import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * PremiumBlur — Overlay flou Premium réutilisable.
 *
 * Props :
 *   icon        – nom Ionicons (ex. "chatbubbles", "people")
 *   iconColor   – couleur de l'icône (défaut "#F7B186")
 *   title       – titre principal
 *   subtitle    – texte descriptif
 *   buttonText  – libellé du bouton CTA (défaut "Passer Premium")
 *   onPress     – callback du bouton CTA
 *   isDark      – mode sombre
 *   smallText   – texte optionnel sous le bouton
 */
export default function PremiumBlur({
  icon = 'star',
  iconColor = '#F7B186',
  title,
  subtitle,
  buttonText = 'Passer Premium',
  onPress,
  isDark = false,
  smallText,
}) {
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={[styles.content, isDark && styles.contentDark]} pointerEvents="auto">
        <Ionicons name={icon} size={48} color={iconColor} />
        <Text style={[styles.title, isDark && styles.titleDark]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          {subtitle}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Ionicons name="star" size={20} color="#FFF" />
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
        {smallText ? (
          <Text style={[styles.smallText, isDark && styles.smallTextDark]}>
            {smallText}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 20,
  },
  contentDark: {
    backgroundColor: '#1A1D24',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginTop: 20,
    textAlign: 'center',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitleDark: {
    color: '#7A7D85',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7B186',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  smallText: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  smallTextDark: {
    color: '#7A7D85',
  },
});
