import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { Input, Button } from '../../components/ui';
import { AuthHeader, PasswordInput } from '../../components/auth';

const RegisterScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { register, error, clearError, isLoading } = useAuth();

  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    clearError();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!pseudo.trim()) {
      newErrors.pseudo = 'Pseudo requis';
    } else if (pseudo.trim().length < 3) {
      newErrors.pseudo = 'Minimum 3 caractères';
    } else if (pseudo.trim().length > 20) {
      newErrors.pseudo = 'Maximum 20 caractères';
    }

    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!acceptPrivacy) {
      newErrors.privacy = 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userEmail = email.trim().toLowerCase();
      const result = await register({
        pseudo: pseudo.trim(),
        email: userEmail,
        password,
      });

      if (result?.requiresVerification) {
        setSuccessMessage(result.message);
        setRegisteredEmail(userEmail);
        setIsSuccess(true);
      }
    } catch (err) {
      console.error('[RegisterScreen] Registration failed:', err);
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsSubmitting(true);
      // Appeler l'API pour renvoyer l'email
      const authService = require('../../api/auth').default;
      await authService.resendVerificationEmail();
      alert('Email renvoyé ! Vérifie ta boîte mail.');
    } catch (error) {
      console.error('[RegisterScreen] Resend email failed:', error);
      alert('Erreur lors de l\'envoi de l\'email. Contacte le support si le problème persiste.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="mail" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.successTitle, isDark && styles.successTitleDark]}>
            Inscription réussie !
          </Text>
          <Text style={[styles.successMessage, isDark && styles.successMessageDark]}>
            {successMessage || 'Un email de vérification a été envoyé. Vérifie ta boîte mail pour activer ton compte.'}
          </Text>
          <Button
            title="Retour à la connexion"
            onPress={() => navigation.navigate('Login')}
            style={styles.successButton}
          />
          <TouchableOpacity
            onPress={handleResendEmail}
            disabled={isSubmitting}
            style={styles.resendButton}
          >
            <Text style={styles.resendButtonText}>
              {isSubmitting ? 'Envoi en cours...' : 'Je n\'ai pas reçu l\'email'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader
            title="Inscription"
            subtitle="Créez votre compte pour commencer"
            icon="person-add"
          />

          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <Input
              label="Pseudo"
              placeholder="Votre pseudo"
              value={pseudo}
              onChangeText={(text) => {
                setPseudo(text);
                if (errors.pseudo) setErrors({ ...errors, pseudo: null });
              }}
              error={errors.pseudo}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PasswordInput
              label="Mot de passe"
              placeholder="Minimum 8 caractères"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              error={errors.password}
            />

            <PasswordInput
              label="Confirmer le mot de passe"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
              }}
              error={errors.confirmPassword}
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                setAcceptPrivacy(!acceptPrivacy);
                if (errors.privacy) setErrors({ ...errors, privacy: null });
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  isDark && styles.checkboxDark,
                  acceptPrivacy && styles.checkboxChecked,
                  errors.privacy && styles.checkboxError,
                ]}
              >
                {acceptPrivacy && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.checkboxLabel, isDark && styles.checkboxLabelDark]}>
                J'accepte les{' '}
                <Text style={styles.checkboxLink}>conditions d'utilisation</Text>
                {' '}et la{' '}
                <Text style={styles.checkboxLink}>politique de confidentialité</Text>
              </Text>
            </TouchableOpacity>
            {errors.privacy && (
              <Text style={styles.privacyError}>{errors.privacy}</Text>
            )}

            <Button
              title="S'inscrire"
              onPress={handleRegister}
              loading={isSubmitting || isLoading}
              disabled={isSubmitting || isLoading || !acceptPrivacy}
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, isDark && styles.loginTextDark]}>
                Déjà un compte ?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Connectez-vous</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#1A1A1A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing['2xl'],
  },
  errorBanner: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  errorBannerText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxDark: {
    borderColor: '#666666',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxError: {
    borderColor: theme.colors.error,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  checkboxLabelDark: {
    color: '#888888',
  },
  checkboxLink: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  privacyError: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginLeft: 40,
  },
  registerButton: {
    marginTop: theme.spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  loginText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  loginTextDark: {
    color: '#888888',
  },
  loginLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semiBold,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  successTitleDark: {
    color: '#FFFFFF',
  },
  successMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  successMessageDark: {
    color: '#888888',
  },
  successButton: {
    width: '100%',
  },
  resendButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  resendButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
