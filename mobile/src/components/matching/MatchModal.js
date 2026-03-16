import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

const THEME_COLORS = {
  primaryGradient: [colors.primary, colors.primaryDark],
  warmGradient: colors.gradients.warm,
};

/**
 * Modal de célébration d'un match mutuel.
 * Affiche une animation avec confetti, avatars et boutons d'action.
 */
export function MatchModal({ visible, matchedProfile, onClose, onSendMessage }) {
  const isDark = useColorScheme() === 'dark';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heartBeatAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      const heartBeat = Animated.loop(
        Animated.sequence([
          Animated.timing(heartBeatAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(heartBeatAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      heartBeat.start();
      return () => heartBeat.stop();
    }
  }, [visible]);

  const modalRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            isDark && styles.contentDark,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Confetti */}
          <View style={styles.confettiContainer}>
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.confetti,
                  {
                    left: `${(i * 8) + 4}%`,
                    backgroundColor: [colors.primary, colors.accent, colors.secondary, colors.warning][i % 4],
                    transform: [{ rotate: `${i * 30}deg` }],
                  },
                ]}
              />
            ))}
          </View>

          {/* Animated heart */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [
                  { scale: heartBeatAnim },
                  { rotate: modalRotation },
                ],
              },
            ]}
          >
            <LinearGradient colors={THEME_COLORS.warmGradient} style={styles.icon}>
              <Ionicons name="heart" size={48} color="#FFF" />
            </LinearGradient>
          </Animated.View>

          <Text style={[styles.title, isDark && styles.textLight]}>
            C'est un match !
          </Text>
          <Text style={[styles.text, isDark && styles.textMuted]}>
            Toi et {matchedProfile?.user?.username} vous êtes mutuellement likés
          </Text>

          {/* Avatars */}
          <View style={styles.avatars}>
            <View style={styles.avatarWrapper}>
              <LinearGradient colors={THEME_COLORS.primaryGradient} style={styles.avatarGradient}>
                <View style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
                  <Ionicons name="person" size={24} color={isDark ? colors.dark.textTertiary : colors.light.textTertiary} />
                </View>
              </LinearGradient>
            </View>
            <View style={[styles.heartIcon, isDark && styles.heartIconDark]}>
              <Ionicons name="heart" size={20} color={colors.accent} />
            </View>
            <View style={styles.avatarWrapper}>
              <LinearGradient colors={THEME_COLORS.warmGradient} style={styles.avatarGradient}>
                {matchedProfile?.user?.photo ? (
                  <Image source={{ uri: matchedProfile.user.photo }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
                    <Ionicons name="person" size={24} color={isDark ? colors.dark.textTertiary : colors.light.textTertiary} />
                  </View>
                )}
              </LinearGradient>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.outlineButton, isDark && styles.outlineButtonDark]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.outlineText, isDark && styles.textLight]}>Continuer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gradientButtonWrapper}
              onPress={onSendMessage}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={THEME_COLORS.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Ionicons name="chatbubble" size={18} color="#FFF" />
                <Text style={styles.gradientButtonText}>Envoyer un message</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    overflow: 'hidden',
  },
  contentDark: {
    backgroundColor: '#1A1D24',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -4,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  textLight: {
    color: '#FFF',
  },
  textMuted: {
    color: '#8A8E96',
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  avatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  avatarPlaceholder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#2A2E36',
  },
  heartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -8,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heartIconDark: {
    backgroundColor: '#2A2E36',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  outlineButtonDark: {
    borderColor: '#3A3E46',
  },
  outlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  gradientButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  gradientButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
