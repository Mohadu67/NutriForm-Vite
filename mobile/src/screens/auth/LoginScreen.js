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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { Input, Button } from '../../components/ui';
import { AuthHeader, PasswordInput, SocialAuthButtons } from '../../components/auth';

const LoginScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { login, loginWithApple, loginWithGoogle, error, clearError, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);

  useEffect(() => {
    clearError();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email ou pseudo requis';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setShowResendEmail(false);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      console.error('[LoginScreen] Login failed:', err);
      // Vérifier si l'erreur est liée à un email non vérifié
      const errorMessage = err?.message?.toLowerCase() || '';
      if (
        errorMessage.includes('email non vérifié') ||
        errorMessage.includes('email not verified') ||
        errorMessage.includes('compte non vérifié') ||
        errorMessage.includes('vérifier votre email') ||
        errorMessage.includes('verify your email')
      ) {
        setShowResendEmail(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsSubmitting(true);
      const authService = require('../../api/auth').default;
      await authService.resendVerificationEmail();
      Alert.alert(
        'Email envoyé',
        'Un nouvel email de vérification a été envoyé. Vérifie ta boîte mail et tes spams.',
        [{ text: 'OK' }]
      );
      setShowResendEmail(false);
    } catch (error) {
      console.error('[LoginScreen] Resend email failed:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer l\'email. Contacte le support si le problème persiste.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await loginWithApple();
    } catch (err) {
      if (err.message !== 'ERR_CANCELED') {
        Alert.alert('Erreur', err.message || 'Erreur de connexion Apple');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      if (err.message !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Erreur', err.message || 'Erreur de connexion Google');
      }
    }
  };

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
            title="Connexion"
            subtitle="Bienvenue ! Connectez-vous pour continuer"
            icon="log-in"
          />

          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
                {showResendEmail && (
                  <TouchableOpacity
                    onPress={handleResendEmail}
                    disabled={isSubmitting}
                    style={styles.resendButton}
                  >
                    <Text style={styles.resendButtonText}>
                      {isSubmitting ? 'Envoi en cours...' : '📧 Renvoyer l\'email de vérification'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Input
              label="Email ou pseudo"
              placeholder="votre@email.com ou pseudo"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              error={errors.email}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PasswordInput
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              error={errors.password}
            />

            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={isSubmitting || isLoading}
              disabled={isSubmitting || isLoading}
              style={styles.loginButton}
            />

            <SocialAuthButtons
              onAppleSignIn={handleAppleSignIn}
              onGoogleSignIn={handleGoogleSignIn}
              isLoading={isLoading}
              disabled={isSubmitting}
            />

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, isDark && styles.registerTextDark]}>
                Pas encore de compte ?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Inscrivez-vous</Text>
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
    marginTop: -theme.spacing.xs,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  loginButton: {
    marginTop: theme.spacing.sm,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  registerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  registerTextDark: {
    color: '#888888',
  },
  registerLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  resendButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: theme.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.medium,
  },
});

export default LoginScreen;
