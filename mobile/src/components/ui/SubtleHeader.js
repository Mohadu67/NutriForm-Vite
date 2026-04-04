import React from 'react';
import { Animated, StyleSheet, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Score-based color mapping (warm brand palette only).
 *
 * 0-20  : #c9a88c (stone muted — needs work)
 * 20-40 : #d4a96a (warm amber — getting started)
 * 40-60 : #f0a47a (peach — doing ok)
 * 60-80 : #e8956a (deep peach — good week)
 * 80-100: #72baa1 (teal — crushing it)
 */
function getScoreColor(score, isDark) {
  const colors = [
    { min: 0,  light: 'rgba(201, 168, 140, 0.35)', dark: 'rgba(201, 168, 140, 0.15)' },
    { min: 20, light: 'rgba(212, 169, 106, 0.35)', dark: 'rgba(212, 169, 106, 0.15)' },
    { min: 40, light: 'rgba(240, 164, 122, 0.35)', dark: 'rgba(240, 164, 122, 0.15)' },
    { min: 60, light: 'rgba(232, 149, 106, 0.40)', dark: 'rgba(232, 149, 106, 0.18)' },
    { min: 80, light: 'rgba(114, 186, 161, 0.35)', dark: 'rgba(114, 186, 161, 0.15)' },
  ];

  let color = colors[0];
  for (const c of colors) {
    if (score >= c.min) color = c;
  }
  return isDark ? color.dark : color.light;
}

/**
 * SubtleHeader — animated background that shrinks on scroll.
 * Color reflects the user's weekly wellness score.
 *
 * Props:
 * - scrollY: Animated.Value from parent scroll
 * - score: 0-100 weekly wellness score (from backend)
 */
export default function SubtleHeader({ scrollY, score = 50 }) {
  const isDark = useColorScheme() === 'dark';
  const bgColor = getScoreColor(score, isDark);

  const height = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 250],
        outputRange: [265, 80],
        extrapolate: 'clamp',
      })
    : 265;

  return (
    <Animated.View style={[styles.container, { height }]}>
      <LinearGradient
        colors={[bgColor, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
});
