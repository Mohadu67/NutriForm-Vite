import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';

/**
 * SettingsScreen - Ecran parametres
 * Gestion des preferences utilisateur
 */
export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useAuth();

  // Settings states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irreversible. Toutes vos donnees seront supprimees.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // TODO: Appeler API de suppression
            console.log('Delete account');
          },
        },
      ]
    );
  }, []);

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
    Linking.openURL('https://harmonith.fr/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://harmonith.fr/terms');
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
          onValueChange: setPushNotifications,
        },
        {
          icon: 'mail',
          label: 'Emails de rappel',
          type: 'switch',
          value: emailNotifications,
          onValueChange: setEmailNotifications,
        },
        {
          icon: 'document-text',
          label: 'Rapport hebdomadaire',
          type: 'switch',
          value: weeklyReport,
          onValueChange: setWeeklyReport,
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
          onValueChange: setSoundEnabled,
        },
        {
          icon: 'phone-portrait',
          label: 'Vibrations',
          type: 'switch',
          value: vibrationEnabled,
          onValueChange: setVibrationEnabled,
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
          label: 'Conditions d\'utilisation',
          type: 'link',
          onPress: openTermsOfService,
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
