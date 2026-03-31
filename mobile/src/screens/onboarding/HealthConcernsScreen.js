import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import OptionCard from '../../components/onboarding/OptionCard';
import NextButton from '../../components/onboarding/NextButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

const CONCERNS = [
  { value: 'none', label: 'Aucun', emoji: '🚫' },
  { value: 'high_cholesterol', label: 'Cholestérol élevé', emoji: '🩸' },
  { value: 'hypertension', label: 'Hypertension', emoji: '❤️' },
  { value: 'diabetes', label: 'Diabète', emoji: '💉' },
  { value: 'heart_problems', label: 'Problèmes cardiaques', emoji: '🫀' },
];

export default function HealthConcernsScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();

  const selected = data.healthConcerns || [];

  const handleToggle = (value) => {
    if (value === 'none') {
      updateData({ healthConcerns: ['none'] });
      return;
    }

    let updated = selected.filter((v) => v !== 'none');
    if (updated.includes(value)) {
      updated = updated.filter((v) => v !== value);
    } else {
      updated = [...updated, value];
    }
    if (updated.length === 0) updated = ['none'];
    updateData({ healthConcerns: updated });
  };

  const handleSubmit = async () => {
    navigation.navigate('HealthConnect');
  };

  return (
    <OnboardingLayout
      currentStep={8}
      onBack={() => navigation.goBack()}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        Des préoccupations{'\n'}de santé ?
      </Text>

      <View style={styles.options}>
        {CONCERNS.map((c) => (
          <OptionCard
            key={c.value}
            label={c.label}
            icon={<Text style={styles.emoji}>{c.emoji}</Text>}
            selected={selected.includes(c.value)}
            onPress={() => handleToggle(c.value)}
            multiSelect
          />
        ))}
      </View>

      <NextButton
        onPress={handleSubmit}
        disabled={selected.length === 0}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 28,
    marginTop: 8,
  },
  options: {
    gap: 0,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 28,
  },
});
