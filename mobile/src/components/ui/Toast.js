import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  useColorScheme,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, colors } from '../../theme';

/**
 * Composant Toast moderne pour les notifications in-app
 * Supporte les messages avec avatar, les notifications systeme, etc.
 */
export default function Toast({
  visible,
  type = 'message', // 'message' | 'success' | 'error' | 'info'
  title,
  message,
  avatar,
  isOnline,
  onPress,
  onDismiss,
  duration = 4000,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Animer l'entree avec spring
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss apres duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  // Configuration selon le type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          gradient: [colors.success, '#3D9140'],
          iconColor: '#FFF',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          gradient: [colors.error, '#C62828'],
          iconColor: '#FFF',
        };
      case 'info':
        return {
          icon: 'information-circle',
          gradient: [colors.info, '#1565C0'],
          iconColor: '#FFF',
        };
      case 'message':
      default:
        return {
          icon: 'chatbubble',
          gradient: [colors.primary, colors.primaryDark],
          iconColor: '#FFF',
        };
    }
  };

  const typeConfig = getTypeConfig();

  if (!visible && translateY._value === -120) {
    return null;
  }

  const themedStyles = {
    containerBg: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    titleColor: isDark ? '#FFFFFF' : '#1A1A1A',
    messageColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    closeColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 100}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blurContainer,
          { borderColor: themedStyles.borderColor },
        ]}
      >
        <TouchableOpacity
          style={[styles.toast, { backgroundColor: themedStyles.containerBg }]}
          onPress={() => {
            hideToast();
            if (onPress) onPress();
          }}
          activeOpacity={0.95}
        >
          {/* Indicateur de type (barre coloree a gauche) */}
          <LinearGradient
            colors={typeConfig.gradient}
            style={styles.typeIndicator}
          />

          {/* Avatar ou icone */}
          <View style={styles.avatarContainer}>
            {avatar ? (
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
                {isOnline !== undefined && (
                  <View
                    style={[
                      styles.onlineIndicator,
                      !isOnline && styles.offlineIndicator,
                    ]}
                  />
                )}
              </View>
            ) : (
              <LinearGradient colors={typeConfig.gradient} style={styles.iconContainer}>
                <Ionicons name={typeConfig.icon} size={22} color={typeConfig.iconColor} />
              </LinearGradient>
            )}
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: themedStyles.titleColor }]} numberOfLines={1}>
              {title}
            </Text>
            {message && (
              <Text style={[styles.message, { color: themedStyles.messageColor }]} numberOfLines={2}>
                {message}
              </Text>
            )}
          </View>

          {/* Bouton fermer */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideToast}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="close" size={18} color={themedStyles.closeColor} />
          </TouchableOpacity>

          {/* Badge "Maintenant" */}
          <View style={styles.timeBadge}>
            <Text style={[styles.timeText, { color: themedStyles.messageColor }]}>
              maintenant
            </Text>
          </View>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 10,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 0,
    position: 'relative',
  },
  typeIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  avatarContainer: {
    marginLeft: 14,
    marginRight: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(247, 177, 134, 0.3)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  offlineIndicator: {
    backgroundColor: '#9E9E9E',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  message: {
    fontSize: 14,
    lineHeight: 19,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
