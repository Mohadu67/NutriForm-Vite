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
import ErrorModal from '../../components/ui/ErrorModal';
import SuccessModal from '../../components/ui/SuccessModal';

const ForgotPasswordScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

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

    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setModalSuccess(`Un lien de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte de réception.`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue';
      setModalError(errorMessage);
    } finally {
      setIsSubmitting(false);
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

      {/* Error Modal */}
      <ErrorModal
        visible={!!modalError}
        onClose={() => setModalError(null)}
        title="Oups!"
        message={modalError}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={!!modalSuccess}
        onClose={() => {
          setModalSuccess(null);
          navigation.navigate('Login');
        }}
        title="Email envoyé!"
        message={modalSuccess}
      />
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
});

export default ForgotPasswordScreen;
