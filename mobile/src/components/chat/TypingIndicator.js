import React, { useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';
import { blurIntensity, glassStyles } from '../../theme/glassmorphism';
import useChatAnimations from '../../hooks/useChatAnimations';

export default function TypingIndicator({ visible }) {
  const { isDark } = useTheme();
  const { createTypingAnimation } = useChatAnimations();
  const { dot1, dot2, dot3, animateTyping } = createTypingAnimation();

  useEffect(() => {
    if (visible) {
      animateTyping();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <BlurView
        intensity={blurIntensity.medium}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.bubble, isDark ? glassStyles.dark : glassStyles.light]}
      >
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot1.opacity,
                transform: [{ translateY: dot1.translateY }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot2.opacity,
                transform: [{ translateY: dot2.translateY }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot3.opacity,
                transform: [{ translateY: dot3.translateY }],
              },
            ]}
          />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
  },
});
