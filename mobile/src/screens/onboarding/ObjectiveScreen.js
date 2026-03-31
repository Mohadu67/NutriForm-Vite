import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import OptionCard from '../../components/onboarding/OptionCard';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

const OBJECTIVES = [
  { value: 'weight_loss', label: 'Perdre du poids', emoji: '⚖️' },
  { value: 'eat_healthier', label: 'Manger et vivre plus sainement', emoji: '🥗' },
  { value: 'stay_fit', label: 'Rester en forme', emoji: '💪' },
  { value: 'meal_advice', label: 'Recevoir des conseils de repas', emoji: '🍽️' },
  { value: 'manage_blood_sugar', label: 'Gérer la glycémie', emoji: '🩺' },
];

export default function ObjectiveScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();

  const handleSelect = (value) => {
    updateData({ objective: value });
    navigation.navigate('Gender');
  };

  return (
    <OnboardingLayout
      currentStep={0}
      onBack={() => navigation.goBack()}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        Quel est votre objectif{'\n'}principal ?
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        Cela nous aide à personnaliser votre plan.
      </Text>

      <View style={styles.options}>
        {OBJECTIVES.map((obj) => (
          <OptionCard
            key={obj.value}
            label={obj.label}
            icon={<Text style={styles.emoji}>{obj.emoji}</Text>}
            selected={data.objective === obj.value}
            onPress={() => handleSelect(obj.value)}
          />
        ))}
      </View>
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
    marginBottom: 28,
  },
  options: {
    gap: 0,
  },
  emoji: {
    fontSize: 28,
  },
});
