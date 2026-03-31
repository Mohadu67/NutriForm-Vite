import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 10;

export default function OnboardingLayout({
  children,
  currentStep = 0,
  totalSteps = TOTAL_STEPS,
  onBack,
  showBack = true,
  scrollable = true,
}) {
  const { isDark, theme } = useTheme();

  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? { contentContainerStyle: styles.scrollContent, showsVerticalScrollIndicator: false, bounces: false }
    : { style: styles.fixedContent };

  return (
    <LinearGradient
      colors={isDark ? ['#1a2a1f', '#0e0e11', '#0e0e11'] : ['#e8f5e9', '#f1f8e9', '#fcfbf9']}
      locations={[0, 0.35, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header: back + progress */}
        <View style={styles.header}>
          {showBack && onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
            >
              <Ionicons name="chevron-back" size={22} color={isDark ? '#f3f3f6' : '#1c1917'} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: i <= currentStep
                      ? '#22c55e'
                      : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.backPlaceholder} />
        </View>

        <Container {...containerProps}>
          {children}
        </Container>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  fixedContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
