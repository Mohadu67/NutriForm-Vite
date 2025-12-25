import React, { useState } from 'react';
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

import authService from '../../api/auth';
import { theme } from '../../theme';
import { Input, Button } from '../../components/ui';
import { AuthHeader } from '../../components/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setIsSuccess(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.successTitle, isDark && styles.successTitleDark]}>
            Email envoyé !
          </Text>
          <Text style={[styles.successMessage, isDark && styles.successMessageDark]}>
            Un lien de réinitialisation a été envoyé à {email}. Vérifiez votre boîte de réception.
          </Text>
          <Button
            title="Retour à la connexion"
            onPress={() => navigation.navigate('Login')}
            style={styles.successButton}
          />
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? '#FFFFFF' : theme.colors.text.primary}
            />
          </TouchableOpacity>

          <AuthHeader
            title="Mot de passe oublié"
            subtitle="Entrez votre email pour recevoir un lien de réinitialisation"
            icon="lock-closed"
          />

          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
                if (error) setError(null);
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title="Envoyer le lien"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
            />

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, isDark && styles.loginTextDark]}>
                Vous vous souvenez ?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Connexion</Text>
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
  backButton: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    zIndex: 10,
    padding: theme.spacing.sm,
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
  submitButton: {
    marginTop: theme.spacing.md,
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
    fontWeight: theme.fontWeight.semibold,
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
    backgroundColor: theme.colors.success,
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
});

export default ForgotPasswordScreen;
