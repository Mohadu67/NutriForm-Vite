/**
 * HealthConnectOnboarding - Modal d'onboarding pour Health Connect
 * S'affiche une seule fois au premier lancement pour proposer l'activation
 */

import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { theme } from '../theme';
import useHealthData from '../hooks/useHealthData';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = '@health_connect_onboarding_shown';
const { width } = Dimensions.get('window');

export default function HealthConnectOnboarding() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { isAuthenticated } = useAuth();
  const {
    isAvailable,
    hasPermission,
    requestPermission,
    isLoading,
  } = useHealthData();

  useEffect(() => {
    checkAndShowOnboarding();
  }, [isAuthenticated, isAvailable]);

  const checkAndShowOnboarding = async () => {
    // Ne montrer que sur Android et si l'utilisateur est authentifié
    if (Platform.OS !== 'android' || !isAuthenticated || !isAvailable) {
      return;
    }

    // Si l'utilisateur a déjà les permissions, ne pas afficher
    if (hasPermission) {
      return;
    }

    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(STORAGE_KEY);

      // Si pas encore vu, afficher après 2 secondes (laisser l'app se charger)
      if (!hasSeenOnboarding) {
        setTimeout(() => {
          setVisible(true);
        }, 2000);
      }
    } catch (error) {
      console.error('[HealthConnectOnboarding] Error checking storage:', error);
    }
  };

  const handleClose = async () => {
    // Marquer comme vu
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const handleEnableNow = async () => {
    const granted = await requestPermission();

    if (granted) {
      await handleClose();
    } else {
      // Si refusé, on ferme quand même mais l'utilisateur pourra réactiver plus tard dans les paramètres
      await handleClose();
    }
  };

  const handleMaybeLater = async () => {
    await handleClose();
  };

  const steps = [
    {
      icon: 'fitness',
      color: theme.colors.primary,
      title: 'Synchronisez vos données de santé',
      description: 'Connectez Harmonith à Health Connect pour un suivi automatique de votre activité physique.',
    },
    {
      icon: 'analytics',
      color: theme.colors.accent,
      title: 'Suivez vos progrès',
      description: 'Visualisez vos pas, calories brûlées, fréquence cardiaque et plus encore, directement dans l\'app.',
    },
    {
      icon: 'rocket',
      color: theme.colors.success,
      title: 'Programmes personnalisés',
      description: 'Recevez des recommandations adaptées à votre niveau d\'activité réel et vos objectifs.',
    },
  ];

  const currentStepData = steps[currentStep];

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleMaybeLater}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Icône principale */}
            <View style={[styles.iconContainer, { backgroundColor: currentStepData.color + '20' }]}>
              <Ionicons
                name={currentStepData.icon}
                size={60}
                color={currentStepData.color}
              />
            </View>

            {/* Titre */}
            <Text style={styles.title}>{currentStepData.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{currentStepData.description}</Text>

            {/* Indicateurs de progression */}
            <View style={styles.progressContainer}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>

            {/* Avantages */}
            {currentStep === 2 && (
              <View style={styles.benefitsContainer}>
                <BenefitItem
                  icon="shield-checkmark"
                  text="Vos données restent privées et sécurisées"
                />
                <BenefitItem
                  icon="phone-portrait"
                  text="Synchronisation automatique en arrière-plan"
                />
                <BenefitItem
                  icon="time"
                  text="Vous pouvez désactiver à tout moment"
                />
              </View>
            )}

            {/* Boutons */}
            {currentStep < steps.length - 1 ? (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleMaybeLater}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Plus tard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setCurrentStep(currentStep + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.primaryButtonText}>Suivant</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleMaybeLater}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Plus tard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, styles.primaryButtonLarge]}
                  onPress={handleEnableNow}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Activation...' : 'Activer maintenant'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

function BenefitItem({ icon, text }) {
  return (
    <View style={styles.benefitItem}>
      <Ionicons name={icon} size={20} color={theme.colors.success} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonLarge: {
    paddingVertical: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});
