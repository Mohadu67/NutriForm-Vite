import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Insuffisance', color: '#0ea5e9' };
  if (bmi < 25) return { label: 'Normal', color: '#22c55e' };
  if (bmi < 30) return { label: 'Surpoids', color: '#f59e0b' };
  return { label: 'Obésité', color: '#ef4444' };
}

export default function BMIDisplay({ weight, height }) {
  const { isDark } = useTheme();

  if (!weight || !height) return null;

  const bmi = weight / ((height / 100) ** 2);
  const bmiRounded = bmi.toFixed(1);
  const category = getBMICategory(bmi);

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff' },
    ]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
          Votre IMC :
        </Text>
        <Text style={[styles.bmiValue, { color: category.color }]}>
          {bmiRounded}
        </Text>
        <View style={[styles.badge, { backgroundColor: category.color + '20' }]}>
          <Text style={[styles.badgeText, { color: category.color }]}>
            {category.label}
          </Text>
        </View>
      </View>

      {/* Message d'encouragement */}
      <Text style={[styles.message, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        {bmi >= 30
          ? 'Nous comprenons vos objectifs et vous accompagnerons à chaque étape. Créons ensemble un plan personnalisé pour atteindre un poids plus sain !'
          : bmi >= 25
          ? 'Quelques ajustements peuvent faire une grande différence. On vous accompagne !'
          : bmi < 18.5
          ? 'Nous vous aiderons à atteindre un poids santé avec un plan adapté.'
          : 'Votre poids est dans la norme. Continuons à optimiser votre santé !'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  bmiValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
  },
});
