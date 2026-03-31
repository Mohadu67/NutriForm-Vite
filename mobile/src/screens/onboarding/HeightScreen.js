import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import HorizontalRuler from '../../components/onboarding/HorizontalRuler';
import NextButton from '../../components/onboarding/NextButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

export default function HeightScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();
  const [unit, setUnit] = useState('cm');

  const heightCm = data.height || 170;

  const displayValue = unit === 'cm'
    ? heightCm
    : Math.floor(heightCm / 30.48); // rough feet

  const displayFeetInches = unit === 'ft'
    ? `${Math.floor(heightCm / 30.48)}'${Math.round((heightCm % 30.48) / 2.54)}"`
    : null;

  return (
    <OnboardingLayout
      currentStep={3}
      onBack={() => navigation.goBack()}
      scrollable={false}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        Quelle est votre{'\n'}taille actuelle ?
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        Ces données permettent de calculer vos besoins caloriques.
      </Text>

      {/* Unit toggle */}
      <View style={[styles.toggleContainer, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }]}>
        {['ft', 'cm'].map((u) => (
          <TouchableOpacity
            key={u}
            onPress={() => setUnit(u)}
            style={[
              styles.toggleBtn,
              unit === u && {
                backgroundColor: isDark ? '#f3f3f6' : '#1c1917',
              },
            ]}
          >
            <Text style={[
              styles.toggleText,
              {
                color: unit === u
                  ? (isDark ? '#1c1917' : '#fff')
                  : (isDark ? '#c1c1cb' : '#57534e'),
                fontWeight: unit === u ? '700' : '500',
              },
            ]}>
              {u.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.rulerSection}>
        <HorizontalRuler
          min={100}
          max={220}
          value={heightCm}
          step={1}
          unit="cm"
          onValueChange={(v) => updateData({ height: v })}
        />
      </View>

      <NextButton
        onPress={() => navigation.navigate('Weight')}
        disabled={!data.height}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    padding: 4,
    alignSelf: 'center',
    marginBottom: 24,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 21,
  },
  toggleText: {
    fontSize: 14,
  },
  rulerSection: {
    flex: 1,
    justifyContent: 'center',
  },
});
