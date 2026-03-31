import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 180;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const FACTS = [
  { stat: '+95%', label: 'précision', desc: 'Suivi précis' },
  { stat: '+100M', label: 'repas suivis', desc: 'Choix plus sains' },
  { stat: '86%', label: 'utilisateurs satisfaits', desc: 'Résultats durables' },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function PlanCreationScreen({ navigation }) {
  const { isDark } = useTheme();
  const { submitOnboarding } = useOnboarding();
  const progress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Animate progress from 0 to 100
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const listener = progress.addListener(({ value }) => {
      const p = Math.round(value * 100);
      setPercent(p);
      if (p > 33 && p < 66) setFactIndex(1);
      else if (p >= 66) setFactIndex(2);
    });

    animation.start();

    // Submit onboarding data to backend
    submitOnboarding()
      .then(() => {
        // Wait for animation to finish before navigating
        setTimeout(() => {
          navigation.replace('PersonalPlan');
        }, 4500);
      })
      .catch((err) => {
        setError('Une erreur est survenue. Réessayez.');
      });

    return () => {
      progress.removeListener(listener);
    };
  }, []);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const fact = FACTS[factIndex];

  return (
    <LinearGradient
      colors={isDark ? ['#0e0e11', '#0e0e11'] : ['#ffffff', '#ffffff']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Progress circle */}
          <View style={styles.circleContainer}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
              {/* Background circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={isDark ? '#2a2a33' : '#e8f5e9'}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              {/* Progress circle */}
              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke="#22c55e"
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90, ${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.percentOverlay}>
              <Text style={[styles.percentText, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
                {percent}%
              </Text>
            </View>
          </View>

          <Text style={[styles.creatingText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
            Création de votre plan personnalisé
          </Text>

          {/* Animated fact */}
          <View style={styles.factContainer}>
            <Text style={styles.factStat}>{fact.stat}</Text>
            <Text style={styles.factLabel}>{fact.label}</Text>
            <Text style={[styles.factDesc, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
              {fact.desc}
            </Text>
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    marginBottom: 24,
    position: 'relative',
  },
  percentOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  creatingText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 48,
  },
  factContainer: {
    alignItems: 'center',
  },
  factStat: {
    fontSize: 36,
    fontWeight: '800',
    color: '#22c55e',
    marginBottom: 4,
  },
  factLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  factDesc: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
  },
});
