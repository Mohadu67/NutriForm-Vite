import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import OptionCard from '../../components/onboarding/OptionCard';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

const LEVELS = [
  {
    value: 'sedentary',
    label: 'Pas beaucoup',
    bars: 1,
  },
  {
    value: 'light',
    label: '1 à 2 entraînements par semaine',
    bars: 2,
  },
  {
    value: 'moderate',
    label: '3 à 5 entraînements par semaine',
    bars: 3,
  },
  {
    value: 'active',
    label: '6 à 7 entraînements par semaine',
    bars: 4,
  },
];

function ActivityBars({ count, maxBars = 4 }) {
  return (
    <View style={barStyles.container}>
      {Array.from({ length: maxBars }).map((_, i) => (
        <View
          key={i}
          style={[
            barStyles.bar,
            {
              height: 10 + i * 4,
              backgroundColor: i < count ? '#22c55e' : '#e7e5e4',
            },
          ]}
        />
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 6,
    borderRadius: 2,
  },
});

export default function ActivityLevelScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();

  const handleSelect = (value) => {
    updateData({ activityLevel: value });
    navigation.navigate('HealthConcerns');
  };

  return (
    <OnboardingLayout
      currentStep={7}
      onBack={() => navigation.goBack()}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        À quelle fréquence{'\n'}faites-vous de{'\n'}l'exercice ?
      </Text>

      <View style={styles.options}>
        {LEVELS.map((level) => (
          <OptionCard
            key={level.value}
            label={level.label}
            icon={<ActivityBars count={level.bars} />}
            selected={data.activityLevel === level.value}
            onPress={() => handleSelect(level.value)}
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
    marginBottom: 28,
    marginTop: 8,
  },
  options: {
    gap: 0,
  },
});
