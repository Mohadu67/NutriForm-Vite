import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import HorizontalRuler from '../../components/onboarding/HorizontalRuler';
import BMIDisplay from '../../components/onboarding/BMIDisplay';
import NextButton from '../../components/onboarding/NextButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

export default function WeightScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();

  const weight = data.weight || 70;

  return (
    <OnboardingLayout
      currentStep={4}
      onBack={() => navigation.goBack()}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        Quel est votre{'\n'}poids actuel ?
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        Ces données permettent de calculer vos besoins caloriques.
      </Text>

      <HorizontalRuler
        min={30}
        max={250}
        value={weight}
        step={1}
        unit="kg"
        onValueChange={(v) => updateData({ weight: v })}
      />

      {/* IMC dynamique */}
      <BMIDisplay weight={weight} height={data.height} />

      <View style={{ flex: 1 }} />

      <NextButton
        onPress={() => navigation.navigate('TargetWeight')}
        disabled={!data.weight}
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
    marginBottom: 16,
  },
});
