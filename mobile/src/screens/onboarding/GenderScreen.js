import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 24 * 2 - 16) / 2;

const GENDERS = [
  { value: 'male', label: 'Homme', icon: 'man-outline', color: '#0ea5e9' },
  { value: 'female', label: 'Femme', icon: 'woman-outline', color: '#ec4899' },
];

export default function GenderScreen({ navigation }) {
  const { isDark } = useTheme();
  const { data, updateData } = useOnboarding();

  const handleSelect = (value) => {
    updateData({ gender: value });
    navigation.navigate('BirthYear');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      onBack={() => navigation.goBack()}
    >
      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        Quel est votre genre ?
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        Votre genre nous aide à adapter nos conseils{'\n'}nutritionnels à votre morphologie.
      </Text>

      <View style={styles.cardsRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g.value}
            onPress={() => handleSelect(g.value)}
            activeOpacity={0.7}
            style={[
              styles.genderCard,
              {
                backgroundColor: data.gender === g.value
                  ? (isDark ? 'rgba(34,197,94,0.12)' : '#e8f5e9')
                  : (isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f4'),
                borderColor: data.gender === g.value ? '#22c55e' : 'transparent',
                borderWidth: 2,
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: g.color + '15' }]}>
              <Ionicons name={g.icon} size={56} color={g.color} />
            </View>
            <Text style={[styles.genderLabel, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => handleSelect('prefer_not_say')}
        activeOpacity={0.7}
        style={[
          styles.otherOption,
          {
            backgroundColor: data.gender === 'prefer_not_say'
              ? (isDark ? 'rgba(34,197,94,0.12)' : '#e8f5e9')
              : (isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f4'),
            borderColor: data.gender === 'prefer_not_say' ? '#22c55e' : 'transparent',
            borderWidth: 2,
          },
        ]}
      >
        <Text style={[styles.otherLabel, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
          Je préfère ne pas dire
        </Text>
      </TouchableOpacity>
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
    marginBottom: 32,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  genderCard: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  genderLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  otherOption: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  otherLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});
