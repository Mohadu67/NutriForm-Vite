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
import apiClient from '../../api/client';
import { endpoints } from '../../api/endpoints';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation du mot de passe
  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
    return checks;
  };

  const passwordChecks = validatePassword(newPassword);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = useCallback(async () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Mot de passe actuel requis';
    }
    if (!newPassword) {
      newErrors.newPassword = 'Nouveau mot de passe requis';
    } else if (!isPasswordValid) {
      newErrors.newPassword = 'Le mot de passe ne respecte pas les criteres';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (currentPassword === newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe doit etre different';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setSaving(true);
      await apiClient.put(endpoints.auth.changePassword, {
        currentPassword,
        newPassword,
      });

      Alert.alert(
        'Succes',
        'Votre mot de passe a ete modifie avec succes',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('[CHANGE_PASSWORD] Error:', error);
      const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      Alert.alert('Erreur', message);
    } finally {
      setSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword, isPasswordValid, navigation]);

  const renderPasswordCheck = (label, isValid) => (
    <View style={styles.checkRow}>
      <Ionicons
        name={isValid ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={isValid ? '#10B981' : isDark ? '#555' : '#CCC'}
      />
      <Text style={[
        styles.checkLabel,
        isValid && styles.checkLabelValid,
        isDark && styles.textMuted
      ]}>
        {label}
      </Text>
    </View>
  );

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
            Changer le mot de passe
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
            <View style={[styles.iconBox, { backgroundColor: '#8B5CF620' }]}>
              <Ionicons name="lock-closed" size={32} color="#8B5CF6" />
            </View>
          </View>

          <Text style={[styles.description, isDark && styles.textMuted]}>
            Entrez votre mot de passe actuel puis choisissez un nouveau mot de passe securise.
          </Text>

          {/* Form */}
          <View style={[styles.formCard, isDark && styles.cardDark]}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>
                Mot de passe actuel
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    isDark && styles.inputDark,
                    errors.currentPassword && styles.inputError
                  ]}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    setErrors(e => ({ ...e, currentPassword: null }));
                  }}
                  placeholder="Entrez votre mot de passe actuel"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowCurrent(!showCurrent)}
                >
                  <Ionicons
                    name={showCurrent ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>
                Nouveau mot de passe
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    isDark && styles.inputDark,
                    errors.newPassword && styles.inputError
                  ]}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setErrors(e => ({ ...e, newPassword: null }));
                  }}
                  placeholder="Choisissez un nouveau mot de passe"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowNew(!showNew)}
                >
                  <Ionicons
                    name={showNew ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}

              {/* Password requirements */}
              <View style={styles.checksContainer}>
                {renderPasswordCheck('Au moins 8 caracteres', passwordChecks.length)}
                {renderPasswordCheck('Une majuscule', passwordChecks.uppercase)}
                {renderPasswordCheck('Une minuscule', passwordChecks.lowercase)}
                {renderPasswordCheck('Un chiffre', passwordChecks.number)}
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDark && styles.textMuted]}>
                Confirmer le mot de passe
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    isDark && styles.inputDark,
                    errors.confirmPassword && styles.inputError
                  ]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrors(e => ({ ...e, confirmPassword: null }));
                  }}
                  placeholder="Confirmez le nouveau mot de passe"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? '#666' : '#999'}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <View style={styles.matchIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.matchText}>Les mots de passe correspondent</Text>
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!isPasswordValid || !currentPassword || newPassword !== confirmPassword) && styles.submitBtnDisabled
            ]}
            onPress={handleSubmit}
            disabled={saving || !isPasswordValid || !currentPassword || newPassword !== confirmPassword}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Modifier le mot de passe</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotLink}>
            <Text style={[styles.forgotText, isDark && styles.textMuted]}>
              Mot de passe oublie ?
            </Text>
          </TouchableOpacity>
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
  cardDark: {
    backgroundColor: '#1A1D24',
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
    paddingRight: 50,
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
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },

  // Checks
  checksContainer: {
    marginTop: 12,
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkLabel: {
    fontSize: 13,
    color: '#999',
  },
  checkLabelValid: {
    color: '#10B981',
  },

  // Match indicator
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  matchText: {
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

  // Forgot
  forgotLink: {
    alignItems: 'center',
    padding: 8,
  },
  forgotText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
});
