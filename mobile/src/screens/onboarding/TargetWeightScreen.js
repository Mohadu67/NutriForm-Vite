import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import HorizontalRuler from '../../components/onboarding/HorizontalRuler';
import NextButton from '../../components/onboarding/NextButton';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

export default function TargetWeightScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();

  const currentWeight = data.weight || 70;
  const targetWeight = data.targetWeight || Math.max(40, currentWeight - 10);

  const diff = currentWeight - targetWeight;
  const percent = currentWeight > 0 ? ((diff / currentWeight) * 100).toFixed(1) : 0;
  const isLoss = diff > 0;
  const isGain = diff < 0;

  return (
    <OnboardingLayout
      currentStep={5}
      onBack={() => navigation.goBack()}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        Quel est votre{'\n'}poids cible ?
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        Cela nous aide à définir un plan réaliste pour vous.
      </Text>

      {/* Current weight reference */}
      <View style={styles.currentRef}>
        <Text style={[styles.currentIcon, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>◀◀</Text>
        <Text style={[styles.currentText, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>
          {currentWeight}
        </Text>
      </View>

      <HorizontalRuler
        min={30}
        max={250}
        value={targetWeight}
        step={1}
        unit="kg"
        onValueChange={(v) => updateData({ targetWeight: v })}
      />

      {/* Health info card */}
      <View style={[styles.infoCard, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
      }]}>
        {isLoss && (
          <>
            <Text style={styles.infoTitle}>
              Bon pour la santé : <Text style={{ color: '#f59e0b' }}>perdre {percent}%</Text>
            </Text>
            <Text style={[styles.infoText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
              Les preuves scientifiques montrent qu'une perte d'au moins 10% du poids corporel peut améliorer certaines affections liées à l'obésité.
            </Text>
          </>
        )}
        {isGain && (
          <>
            <Text style={styles.infoTitle}>
              Objectif : <Text style={{ color: '#22c55e' }}>prendre {Math.abs(diff)} kg</Text>
            </Text>
            <Text style={[styles.infoText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
              Nous allons vous aider à atteindre votre objectif de prise de poids de manière saine.
            </Text>
          </>
        )}
        {!isLoss && !isGain && (
          <>
            <Text style={styles.infoTitle}>
              Objectif : <Text style={{ color: '#22c55e' }}>maintenir votre poids</Text>
            </Text>
            <Text style={[styles.infoText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
              Maintenir un poids stable est excellent pour la santé à long terme.
            </Text>
          </>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <NextButton
        onPress={() => {
          if (data.objective === 'weight_loss' && targetWeight < currentWeight) {
            navigation.navigate('WeightLossPace');
          } else {
            navigation.navigate('ActivityLevel');
          }
        }}
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
  currentRef: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 4,
  },
  currentIcon: {
    fontSize: 12,
  },
  currentText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
