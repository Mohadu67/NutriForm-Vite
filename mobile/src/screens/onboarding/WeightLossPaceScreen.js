import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import OptionCard from '../../components/onboarding/OptionCard';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

const PACES = [
  {
    value: 0.25,
    label: 'Lent et progressif',
    detail: '0,25 kg / semaine',
    emoji: '🐢',
    desc: 'Changements durables et sans stress',
  },
  {
    value: 0.5,
    label: 'Recommandé',
    detail: '0,5 kg / semaine',
    emoji: '⭐',
    desc: 'Équilibre idéal entre résultats et confort',
    recommended: true,
  },
  {
    value: 0.75,
    label: 'Accéléré',
    detail: '0,75 kg / semaine',
    emoji: '🚀',
    desc: 'Résultats plus rapides, efforts soutenus',
  },
  {
    value: 1.0,
    label: 'Intensif',
    detail: '1 kg / semaine',
    emoji: '⚡',
    desc: 'Maximum recommandé, discipline requise',
  },
];

function EstimatedDate({ weight, targetWeight, pace }) {
  if (!weight || !targetWeight || !pace || targetWeight >= weight) return null;

  const diff = weight - targetWeight;
  const weeks = Math.ceil(diff / pace);
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);

  const formatted = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Text style={styles.estimatedDate}>
      Objectif atteint vers le {formatted}
    </Text>
  );
}

export default function WeightLossPaceScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();

  const currentPace = data.weightLossPace || 0.5;
  const weight = data.weight || 70;
  const targetWeight = data.targetWeight || weight;

  const handleSelect = (value) => {
    updateData({ weightLossPace: value });
    navigation.navigate('ActivityLevel');
  };

  return (
    <OnboardingLayout
      currentStep={6}
      onBack={() => navigation.goBack()}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        À quel rythme{'\n'}souhaitez-vous perdre ?
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        Un rythme modéré donne de meilleurs résultats sur le long terme.
      </Text>

      <View style={styles.options}>
        {PACES.map((pace) => {
          const isSelected = currentPace === pace.value;
          return (
            <OptionCard
              key={pace.value}
              label={pace.label}
              icon={<Text style={styles.emoji}>{pace.emoji}</Text>}
              selected={isSelected}
              onPress={() => handleSelect(pace.value)}
              subtitle={
                <View>
                  <Text style={[styles.paceDetail, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
                    {pace.detail}
                  </Text>
                  <Text style={[styles.paceDesc, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>
                    {pace.desc}
                  </Text>
                </View>
              }
            />
          );
        })}
      </View>

      {/* Estimated date */}
      <View style={[styles.dateCard, {
        backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.06)',
      }]}>
        <Text style={styles.dateIcon}>📅</Text>
        <EstimatedDate
          weight={weight}
          targetWeight={targetWeight}
          pace={currentPace}
        />
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
    marginBottom: 24,
  },
  options: {
    gap: 0,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 28,
  },
  paceDetail: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  paceDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  dateIcon: {
    fontSize: 20,
  },
  estimatedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
});
