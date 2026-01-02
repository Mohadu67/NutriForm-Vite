import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import apiClient from '../../api/client';
import useHealthData from '../../hooks/useHealthData';

/**
 * SettingsScreen - Ecran parametres
 * Gestion des preferences utilisateur
 */
export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // Health data hook
  const {
    isAvailable: healthAvailable,
    hasPermission: healthPermission,
    requestPermission: requestHealthPermission,
    isLoading: healthLoading,
  } = useHealthData();

  // Settings states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [healthSyncEnabled, setHealthSyncEnabled] = useState(false);
  const [menstrualTrackingEnabled, setMenstrualTrackingEnabled] = useState(false);

  // Charger les parametres sauvegardes
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await AsyncStorage.getItem('userSettings');
        if (settings) {
          const parsed = JSON.parse(settings);
          setPushNotifications(parsed.pushNotifications ?? true);
          setEmailNotifications(parsed.emailNotifications ?? true);
          setWeeklyReport(parsed.weeklyReport ?? true);
          setSoundEnabled(parsed.soundEnabled ?? true);
          setVibrationEnabled(parsed.vibrationEnabled ?? true);
          setHealthSyncEnabled(parsed.healthSyncEnabled ?? false);
          setMenstrualTrackingEnabled(parsed.menstrualTrackingEnabled ?? false);
        }
      } catch (error) {
        console.error('[SETTINGS] Error loading:', error);
      }
    };
    loadSettings();
  }, []);

  // Sauvegarder un parametre
  const saveSetting = useCallback(async (key, value) => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed[key] = value;
      await AsyncStorage.setItem('userSettings', JSON.stringify(parsed));
    } catch (error) {
      console.error('[SETTINGS] Error saving:', error);
    }
  }, []);

  // Gerer le toggle des notifications push
  const handlePushNotificationsToggle = useCallback(async (value) => {
    setPushNotifications(value);
    saveSetting('pushNotifications', value);

    if (value) {
      // Demander la permission et enregistrer
      await notificationService.registerForPushNotifications();
    }
  }, [saveSetting]);

  // Gerer le toggle des emails
  const handleEmailNotificationsToggle = useCallback(async (value) => {
    setEmailNotifications(value);
    saveSetting('emailNotifications', value);

    // Mettre a jour cote serveur
    try {
      await apiClient.patch('/profile/preferences', { emailNotifications: value });
    } catch (error) {
      console.error('[SETTINGS] Error updating email pref:', error);
    }
  }, [saveSetting]);

  // Gerer le toggle du rapport hebdo
  const handleWeeklyReportToggle = useCallback(async (value) => {
    setWeeklyReport(value);
    saveSetting('weeklyReport', value);

    try {
      await apiClient.patch('/profile/preferences', { weeklyReport: value });
    } catch (error) {
      console.error('[SETTINGS] Error updating weekly report pref:', error);
    }
  }, [saveSetting]);

  // Gerer les sons
  const handleSoundToggle = useCallback((value) => {
    setSoundEnabled(value);
    saveSetting('soundEnabled', value);
  }, [saveSetting]);

  // Gerer les vibrations
  const handleVibrationToggle = useCallback((value) => {
    setVibrationEnabled(value);
    saveSetting('vibrationEnabled', value);
  }, [saveSetting]);

  // Gerer la synchronisation des donnees de sante
  const handleHealthSyncToggle = useCallback(async (value) => {
    if (value && !healthPermission) {
      // Demander les permissions
      const granted = await requestHealthPermission();
      if (!granted) {
        Alert.alert(
          'Permissions requises',
          `Pour synchroniser vos donnees de sante, veuillez autoriser l'acces dans ${Platform.OS === 'ios' ? 'Sante' : 'Health Connect'}.`,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Ouvrir les parametres',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }
    }
    setHealthSyncEnabled(value);
    saveSetting('healthSyncEnabled', value);
  }, [saveSetting, healthPermission, requestHealthPermission]);

  // Gerer le suivi menstruel
  const handleMenstrualTrackingToggle = useCallback(async (value) => {
    if (value && !healthSyncEnabled) {
      Alert.alert(
        'Synchronisation requise',
        'Veuillez d\'abord activer la synchronisation des donnees de sante.'
      );
      return;
    }
    setMenstrualTrackingEnabled(value);
    saveSetting('menstrualTrackingEnabled', value);
  }, [saveSetting, healthSyncEnabled]);

  // Ouvrir les parametres de sante du telephone
  const openHealthSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('x-apple-health://');
    } else {
      // Health Connect settings
      Linking.openSettings();
    }
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Supprimer mon compte',
      'ATTENTION : Cette action est irreversible.\n\nLa suppression de votre compte entraine :\n\n• La suppression definitive de toutes vos donnees personnelles\n• L\'annulation de votre abonnement Premium actif\n• La perte de vos XP, badges et historique\n\nVos donnees seront supprimees sous 30 jours.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer definitivement',
          style: 'destructive',
          onPress: () => {
            // Confirmation supplementaire
            Alert.alert(
              'Confirmation finale',
              'Etes-vous vraiment sur de vouloir supprimer votre compte ? Cette action ne peut pas etre annulee.',
              [
                { text: 'Non, annuler', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await apiClient.delete('/auth/account');
                      Alert.alert(
                        'Compte supprime',
                        'Votre compte a ete supprime avec succes. Vous allez etre deconnecte.',
                        [
                          {
                            text: 'OK',
                            onPress: () => logout(),
                          },
                        ]
                      );
                    } catch (error) {
                      console.error('[SETTINGS] Error deleting account:', error);
                      Alert.alert(
                        'Erreur',
                        'Une erreur est survenue lors de la suppression du compte. Veuillez reessayer ou contacter le support a support@harmonith.fr'
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [logout]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Vider le cache',
      'Cela supprimera les donnees temporaires de l\'application.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            // TODO: Vider le cache
            Alert.alert('Succes', 'Le cache a ete vide');
          },
        },
      ]
    );
  }, []);

  const openPrivacyPolicy = () => {
    Linking.openURL('https://harmonith.fr/privacy-policy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://harmonith.fr/cgv');
  };

  const openMentionsLegales = () => {
    Linking.openURL('https://harmonith.fr/mentions-legales');
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications',
          label: 'Notifications push',
          type: 'switch',
          value: pushNotifications,
          onValueChange: handlePushNotificationsToggle,
        },
        {
          icon: 'mail',
          label: 'Emails de rappel',
          type: 'switch',
          value: emailNotifications,
          onValueChange: handleEmailNotificationsToggle,
        },
        {
          icon: 'document-text',
          label: 'Rapport hebdomadaire',
          type: 'switch',
          value: weeklyReport,
          onValueChange: handleWeeklyReportToggle,
        },
      ],
    },
    {
      title: 'Sons et vibrations',
      items: [
        {
          icon: 'volume-high',
          label: 'Sons',
          type: 'switch',
          value: soundEnabled,
          onValueChange: handleSoundToggle,
        },
        {
          icon: 'phone-portrait',
          label: 'Vibrations',
          type: 'switch',
          value: vibrationEnabled,
          onValueChange: handleVibrationToggle,
        },
      ],
    },
    {
      title: 'Donnees de sante',
      items: [
        {
          icon: 'fitness',
          label: 'Synchroniser avec ' + (Platform.OS === 'ios' ? 'Sante' : 'Health Connect'),
          subtitle: healthAvailable
            ? (healthPermission ? 'Connecte' : 'Non connecte')
            : 'Non disponible',
          type: 'switch',
          value: healthSyncEnabled,
          onValueChange: handleHealthSyncToggle,
          disabled: !healthAvailable,
        },
        {
          icon: 'calendar',
          label: 'Suivi menstruel',
          subtitle: 'Synchroniser les donnees de cycle',
          type: 'switch',
          value: menstrualTrackingEnabled,
          onValueChange: handleMenstrualTrackingToggle,
          disabled: !healthSyncEnabled,
        },
        {
          icon: 'settings',
          label: 'Gerer les permissions',
          subtitle: Platform.OS === 'ios' ? 'Ouvrir l\'app Sante' : 'Ouvrir Health Connect',
          type: 'link',
          onPress: openHealthSettings,
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          icon: 'lock-closed',
          label: 'Changer le mot de passe',
          type: 'link',
          onPress: () => navigation.navigate('ChangePassword'),
        },
        {
          icon: 'mail',
          label: 'Changer l\'email',
          type: 'link',
          subtitle: user?.email,
          onPress: () => navigation.navigate('ChangeEmail'),
        },
      ],
    },
    {
      title: 'Stockage',
      items: [
        {
          icon: 'trash',
          label: 'Vider le cache',
          type: 'button',
          onPress: handleClearCache,
        },
      ],
    },
    {
      title: 'Informations legales',
      items: [
        {
          icon: 'shield-checkmark',
          label: 'Politique de confidentialite',
          type: 'link',
          onPress: openPrivacyPolicy,
        },
        {
          icon: 'document',
          label: 'Conditions Generales de Vente',
          type: 'link',
          onPress: openTermsOfService,
        },
        {
          icon: 'information-circle',
          label: 'Mentions legales',
          type: 'link',
          onPress: openMentionsLegales,
        },
      ],
    },
    {
      title: 'Zone dangereuse',
      items: [
        {
          icon: 'trash',
          label: 'Supprimer mon compte',
          type: 'danger',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingItem = (item, index, itemsLength) => {
    const isLast = index === itemsLength - 1;

    return (
      <TouchableOpacity
        key={item.label}
        style={[
          styles.settingItem,
          !isLast && styles.settingItemBorder,
          isDark && !isLast && styles.settingItemBorderDark,
        ]}
        onPress={item.type !== 'switch' ? item.onPress : undefined}
        disabled={item.type === 'switch'}
        activeOpacity={item.type === 'switch' ? 1 : 0.7}
      >
        <View style={[
          styles.settingIcon,
          { backgroundColor: item.type === 'danger' ? '#FEF2F2' : `${theme.colors.primary}15` }
        ]}>
          <Ionicons
            name={item.icon}
            size={20}
            color={item.type === 'danger' ? '#EF4444' : theme.colors.primary}
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[
            styles.settingLabel,
            isDark && styles.settingLabelDark,
            item.type === 'danger' && styles.settingLabelDanger,
          ]}>
            {item.label}
          </Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, isDark && styles.settingSubtitleDark]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#E5E7EB', true: `${theme.colors.primary}60` }}
            thumbColor={item.value ? theme.colors.primary : '#F4F4F5'}
            ios_backgroundColor="#E5E7EB"
            disabled={item.disabled}
          />
        )}
        {(item.type === 'link' || item.type === 'button') && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? '#555' : '#CCC'}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
          Parametres
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              {section.title}
            </Text>
            <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
              {section.items.map((item, index) =>
                renderSettingItem(item, index, section.items.length)
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  sectionTitleDark: {
    color: '#888888',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionCardDark: {
    backgroundColor: '#2A2A2A',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemBorderDark: {
    borderBottomColor: '#333',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  settingLabelDark: {
    color: '#FFFFFF',
  },
  settingLabelDanger: {
    color: '#EF4444',
  },
  settingSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  settingSubtitleDark: {
    color: '#888888',
  },
});
