import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import NextButton from '../../components/onboarding/NextButton';
import healthService from '../../services/healthService';
import { useTheme } from '../../theme';

const FEATURES = [
  {
    icon: 'footsteps-outline',
    title: 'Pas quotidiens',
    desc: 'Suivez votre activité tout au long de la journée',
    color: '#22c55e',
  },
  {
    icon: 'flame-outline',
    title: 'Calories brûlées',
    desc: 'Comptez les calories dépensées',
    color: '#f59e0b',
  },
  {
    icon: 'heart-outline',
    title: 'Fréquence cardiaque',
    desc: 'Surveillez votre rythme cardiaque',
    color: '#ef4444',
  },
  {
    icon: 'map-outline',
    title: 'Distance parcourue',
    desc: 'Mesurez vos déplacements',
    color: '#0ea5e9',
  },
  {
    icon: 'scale-outline',
    title: 'Poids & mensurations',
    desc: 'Synchronisez votre suivi corporel',
    color: '#8b5cf6',
  },
];

const PLATFORM_NAME = Platform.OS === 'ios' ? 'Apple Santé' : 'Health Connect';
const PLATFORM_ICON = Platform.OS === 'ios' ? 'heart-circle' : 'fitness';

export default function HealthConnectScreen({ navigation }) {
  const { isDark } = useTheme();
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const initialized = await healthService.initialize();
      setIsAvailable(initialized);
      if (initialized) {
        const perms = await healthService.checkPermissions();
        const granted = perms.length > 0;
        setHasPermission(granted);
        setIsEnabled(granted);
      }
    } catch {
      setIsAvailable(false);
    }
  };

  const handleToggle = async (value) => {
    if (value && isAvailable && !hasPermission) {
      // Activer → demander les permissions
      setIsRequesting(true);
      try {
        const perms = await healthService.requestPermissions();
        const granted = perms.length > 0 || Platform.OS === 'ios';
        setHasPermission(granted);
        setIsEnabled(granted);
      } catch {
        setIsEnabled(false);
      } finally {
        setIsRequesting(false);
      }
    } else if (!value) {
      // Désactiver → rediriger vers paramètres
      openHealthSettings();
    }
  };

  const openHealthSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('x-apple-health://').catch(() => {
        Linking.openSettings();
      });
    } else {
      Linking.openSettings();
    }
  };

  return (
    <OnboardingLayout
      currentStep={9}
      onBack={() => navigation.goBack()}
    >
      {/* Header icon */}
      <View style={styles.headerIcon}>
        <View style={[styles.iconBig, {
          backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#e8f5e9',
        }]}>
          <Ionicons name={PLATFORM_ICON} size={48} color="#22c55e" />
        </View>
      </View>

      <Text style={[styles.title, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
        Connectez {PLATFORM_NAME}
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
        Synchronisez vos données de santé pour un suivi complet.
      </Text>

      {/* Main toggle */}
      {isAvailable && (
        <View style={[styles.mainToggle, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
        }]}>
          <View style={styles.toggleLeft}>
            <Ionicons name={PLATFORM_ICON} size={28} color="#22c55e" />
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleTitle, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
                {PLATFORM_NAME}
              </Text>
              <Text style={[styles.toggleStatus, { color: hasPermission ? '#22c55e' : (isDark ? '#7a7a88' : '#a8a29e') }]}>
                {hasPermission ? 'Connecté' : 'Non connecté'}
              </Text>
            </View>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: isDark ? '#3a3a44' : '#e7e5e4', true: '#22c55e' }}
            thumbColor="#fff"
            disabled={isRequesting}
          />
        </View>
      )}

      {/* Features list */}
      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={[styles.featureRow, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
            opacity: hasPermission ? 1 : 0.6,
          }]}>
            <View style={[styles.featureIcon, { backgroundColor: f.color + '15' }]}>
              <Ionicons name={f.icon} size={22} color={f.color} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: isDark ? '#f3f3f6' : '#1c1917' }]}>
                {f.title}
              </Text>
              <Text style={[styles.featureDesc, { color: isDark ? '#7a7a88' : '#a8a29e' }]}>
                {f.desc}
              </Text>
            </View>
            {hasPermission && (
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            )}
          </View>
        ))}
      </View>

      {/* Open settings link */}
      {isAvailable && (
        <TouchableOpacity onPress={openHealthSettings} style={styles.settingsLink}>
          <Ionicons name="settings-outline" size={16} color={isDark ? '#c1c1cb' : '#57534e'} />
          <Text style={[styles.settingsText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
            Ouvrir les paramètres {PLATFORM_NAME}
          </Text>
        </TouchableOpacity>
      )}

      {/* Privacy note */}
      <View style={[styles.privacyNote, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(34,197,94,0.06)',
      }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color="#22c55e" />
        <Text style={[styles.privacyText, { color: isDark ? '#c1c1cb' : '#57534e' }]}>
          Vos données restent privées et ne sont jamais partagées.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Continue button */}
      <NextButton
        label={hasPermission ? 'Continuer' : (isAvailable ? 'Continuer sans activer' : 'Continuer')}
        onPress={() => navigation.navigate('PlanCreation')}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  iconBig: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTextContainer: {
    gap: 2,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  features: {
    gap: 6,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 8,
  },
  settingsText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
