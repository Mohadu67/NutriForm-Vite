import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import NextButton from '../../components/onboarding/NextButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { isDark } = useTheme();
  const { finishOnboarding } = useOnboarding();

  return (
    <LinearGradient
      colors={isDark ? ['#1a2a1f', '#0e0e11'] : ['#e8f5e9', '#fcfbf9']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Hero image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
            Une version de vous{'\n'}plus saine et plus{'\n'}heureuse
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
            Prenez le contrôle de votre alimentation{'\n'}et atteignez vos objectifs santé
          </Text>

          {/* Social proof */}
          <View style={[styles.proofContainer, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.08)',
          }]}>
            <Text style={styles.proofNumber}>HarmoNith</Text>
            <Text style={[styles.proofText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
              Votre compagnon nutrition personnalisé
            </Text>
          </View>
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <NextButton
            label="Commencer"
            onPress={() => navigation.navigate('Objective')}
          />
          <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>
              Passer pour le moment
            </Text>
          </TouchableOpacity>
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
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  proofContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  proofNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#22c55e',
    marginBottom: 4,
  },
  proofText: {
    fontSize: 14,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
