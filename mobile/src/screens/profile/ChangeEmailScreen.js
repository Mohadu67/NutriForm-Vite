import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

export default function ChangeEmailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState({});

  const currentEmail = user?.email || '';

  // Validation email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = useCallback(async () => {
    const newErrors = {};

    if (!newEmail.trim()) {
      newErrors.newEmail = 'Nouvel email requis';
    } else if (!isValidEmail(newEmail)) {
      newErrors.newEmail = 'Email invalide';
    } else if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      newErrors.newEmail = 'Le nouvel email doit etre different';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis pour confirmer';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setSaving(true);

      // Appel API pour demander le changement d'email
      await apiClient.post(endpoints.auth.requestEmailChange, {
        newEmail: newEmail.toLowerCase().trim(),
        password,
      });

      setEmailSent(true);
    } catch (error) {
      console.error('[CHANGE_EMAIL] Error:', error);
      const message = error.response?.data?.message || 'Erreur lors de la demande';
      Alert.alert('Erreur', message);
    } finally {
      setSaving(false);
    }
  }, [newEmail, password, currentEmail]);

  // Ecran de confirmation apres envoi
  if (emailSent) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.textLight]}>
            Verification envoyee
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.successContainer}>
          <View style={[styles.successIconBox, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="mail-open" size={48} color="#10B981" />
          </View>

          <Text style={[styles.successTitle, isDark && styles.textLight]}>
            Email de verification envoye !
          </Text>

          <Text style={[styles.successText, isDark && styles.textMuted]}>
            Un email de confirmation a ete envoye a :
          </Text>

          <Text style={[styles.successEmail, isDark && styles.textLight]}>
            {newEmail}
          </Text>

          <Text style={[styles.successInfo, isDark && styles.textMuted]}>
            Cliquez sur le lien dans l'email pour confirmer le changement d'adresse.
            Le lien expire dans 24 heures.
          </Text>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Votre email actuel ({currentEmail}) restera actif jusqu'a la confirmation.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>Compris</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendLink}
            onPress={() => {
              setEmailSent(false);
              setPassword('');
            }}
          >
            <Text style={[styles.resendText, isDark && styles.textMuted]}>
              Utiliser une autre adresse
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.textLight]}>
            Changer l'email
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconBox, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="mail" size={32} color="#3B82F6" />
            </View>
          </View>

          <Text style={[styles.description, isDark && styles.textMuted]}>
            Un email de confirmation sera envoye a votre nouvelle adresse pour valider le changement.
          </Text>

          {/* Current Email */}
          <View style={[styles.currentEmailCard, isDark && styles.cardDark]}>
            <Text style={[styles.currentLabel, isDark && styles.textMuted]}>Email actuel</Text>
            <Text style={[styles.currentValue, isDark && styles.textLight]}>{currentEmail}</Text>
          </View>

          {/* Form */}
          <View style={[styles.formCard, isDark && styles.cardDark]}>
            {/* New Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>
                Nouvel email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDark && styles.inputDark,
                  errors.newEmail && styles.inputError
                ]}
                value={newEmail}
                onChangeText={(text) => {
                  setNewEmail(text);
                  setErrors(e => ({ ...e, newEmail: null }));
                }}
                placeholder="nouvelle@adresse.com"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              {errors.newEmail && (
                <Text style={styles.errorText}>{errors.newEmail}</Text>
              )}
              {newEmail && isValidEmail(newEmail) && newEmail.toLowerCase() !== currentEmail.toLowerCase() && (
                <View style={styles.validIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.validText}>Email valide</Text>
                </View>
              )}
            </View>

            {/* Password for confirmation */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>
                Mot de passe actuel
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    isDark && styles.inputDark,
                    errors.password && styles.inputError
                  ]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrors(e => ({ ...e, password: null }));
                  }}
                  placeholder="Confirmez avec votre mot de passe"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
              <Text style={[styles.helpText, isDark && styles.textMuted]}>
                Pour votre securite, confirmez votre identite
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!isValidEmail(newEmail) || !password || newEmail.toLowerCase() === currentEmail.toLowerCase()) && styles.submitBtnDisabled
            ]}
            onPress={handleSubmit}
            disabled={saving || !isValidEmail(newEmail) || !password || newEmail.toLowerCase() === currentEmail.toLowerCase()}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Envoyer le lien de confirmation</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={18} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.infoText, isDark && styles.textMuted]}>
              Vous devrez cliquer sur le lien envoye par email pour finaliser le changement
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#12151A',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerDark: {
    borderBottomColor: '#2A2E36',
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 32,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textMuted: {
    color: '#8A8E96',
  },

  // Content
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Icon
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Current email
  currentEmailCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardDark: {
    backgroundColor: '#1A1D24',
    borderColor: '#2A2E36',
  },
  currentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  // Form
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputDark: {
    backgroundColor: '#22262E',
    color: '#FFFFFF',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  validIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  validText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // Success screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  successEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  successInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 16,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  resendLink: {
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
});
