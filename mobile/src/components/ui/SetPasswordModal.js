import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const SetPasswordModal = ({ visible, onClose, onSubmit }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = password.length >= 8 && password === confirm;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(password);
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.message || 'Erreur lors de la définition du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirm('');
    setError('');
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, isDark && styles.modalDark]}>
          {/* Icon */}
          <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
            <Ionicons name="lock-closed" size={28} color="#FFFFFF" />
          </View>

          {/* Title */}
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Définis ton mot de passe
          </Text>

          {/* Message */}
          <Text style={[styles.message, isDark && styles.messageDark]}>
            Tu t'es connecté avec Google. Définis un mot de passe pour pouvoir aussi te connecter par email.
          </Text>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Minimum 8 caractères"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isDark ? '#888' : '#666'}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {confirm.length > 0 && password !== confirm && (
              <Text style={styles.mismatch}>Les mots de passe ne correspondent pas</Text>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.buttonPrimary, !isValid && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!isValid || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonTextPrimary}>Définir le mot de passe</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonSecondary, isDark && styles.buttonSecondaryDark]}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonTextSecondary, isDark && styles.buttonTextSecondaryDark]}>
                Plus tard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalDark: {
    backgroundColor: '#1A1D24',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconCircleDark: {
    backgroundColor: '#D4895A',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  titleDark: {
    color: '#E9ECF1',
  },
  message: {
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  messageDark: {
    color: '#C5C9D1',
  },
  inputContainer: {
    width: '100%',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FAFAFA',
  },
  inputWrapperDark: {
    borderColor: '#333',
    backgroundColor: '#252830',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputDark: {
    color: '#E9ECF1',
  },
  eyeBtn: {
    paddingRight: 14,
    paddingVertical: 10,
  },
  mismatch: {
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  buttonPrimary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  buttonSecondaryDark: {
    backgroundColor: 'transparent',
  },
  buttonTextSecondary: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextSecondaryDark: {
    color: '#666',
  },
});

export default SetPasswordModal;
