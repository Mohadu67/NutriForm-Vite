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

import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { Input, Button } from '../../components/ui';
import { AuthHeader, PasswordInput, SocialAuthButtons } from '../../components/auth';
import ErrorModal from '../../components/ui/ErrorModal';
import SuccessModal from '../../components/ui/SuccessModal';
import authService from '../../api/auth';

// Module-level variable to persist email across component remounts
let lastAttemptedEmail = '';

const LoginScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Use error from AuthContext - it persists across component remounts
  const { login, loginWithApple, loginWithGoogle, error, clearError, isLoading } = useAuth();

  const [email, setEmail] = useState(lastAttemptedEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [isUnverifiedEmail, setIsUnverifiedEmail] = useState(false);

  // Check if error is about unverified email
  useEffect(() => {
    if (error) {
      const errorLower = error.toLowerCase();
      const isUnverified =
        errorLower.includes('email non vérifié') ||
        errorLower.includes('email not verified') ||
        errorLower.includes('compte non vérifié') ||
        errorLower.includes('vérifier votre email') ||
        errorLower.includes('verify your email');
      setIsUnverifiedEmail(isUnverified);
    } else {
      setIsUnverifiedEmail(false);
    }
  }, [error]);

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
    lastAttemptedEmail = email.trim().toLowerCase();

    try {
      await login(lastAttemptedEmail, password);
    } catch (err) {
      // Error is already set in AuthContext by the login function
      // No need to set local state - it would be lost on remount anyway
      console.log('🔴 Login error caught in screen:', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      const emailToSend = lastAttemptedEmail || email.trim().toLowerCase();
      console.log('📧 Resending verification to:', emailToSend);
      await authService.resendVerificationEmail({ email: emailToSend });
      setModalSuccess('Un nouvel email de vérification a été envoyé. Vérifie ta boîte mail et tes spams.');
      clearError();
    } catch (err) {
      console.error('[LoginScreen] Resend email failed:', err?.response?.data?.message || err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await loginWithApple();
    } catch (err) {
      if (err.message !== 'ERR_CANCELED') {
        // Error already set in AuthContext
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      if (err.message !== 'SIGN_IN_CANCELLED') {
        // Error already set in AuthContext
      }
    }
  };

  return (
    <>
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
                disabled={isSubmitting || isLoading || !email.trim() || !password}
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

      {/* Error Modal - uses error from AuthContext which persists across remounts */}
      <ErrorModal
        visible={!!error}
        onClose={clearError}
        title="Oups!"
        message={error}
        onResendEmail={isUnverifiedEmail ? handleResendEmail : null}
        isResending={isResending}
      />

      {/* Success Modal */}
      {modalSuccess && (
        <SuccessModal
          visible={true}
          onClose={() => setModalSuccess(null)}
          title="Succès!"
          message={modalSuccess}
        />
      )}
    </>
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
});

export default LoginScreen;
