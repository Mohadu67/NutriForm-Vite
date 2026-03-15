import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const RegisterSuccessModal = ({ visible, onClose, email, onResendEmail }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResendEmail();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, isDark && styles.modalDark]}>
          {/* Icon */}
          <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
            <Ionicons name="checkmark-sharp" size={32} color="#FFFFFF" />
          </View>

          {/* Title */}
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Inscription réussie !
          </Text>

          {/* Message */}
          <Text style={[styles.message, isDark && styles.messageDark]}>
            Un email de vérification a été envoyé à
          </Text>
          <Text style={styles.email}>
            {email}
          </Text>

          {/* Instructions */}
          <Text style={[styles.instructions, isDark && styles.instructionsDark]}>
            Vérifie ta boîte mail (et tes spams) pour activer ton compte.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => {
                const mailUrl = Platform.OS === 'ios' ? 'message://' : 'mailto:';
                Linking.openURL(mailUrl).catch(() => {
                  // Si l'app mail n'est pas disponible, continuer
                  onClose();
                });
              }}
              disabled={isResending}
              activeOpacity={0.8}
            >
              <View style={styles.resendContent}>
                <Ionicons name="mail-open-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.buttonTextPrimary}>Ouvrir ma boîte mail</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonSecondary, isDark && styles.buttonSecondaryDark]}
              onPress={handleResend}
              disabled={isResending}
              activeOpacity={0.8}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <View style={styles.resendContent}>
                  <Ionicons name="refresh-outline" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.buttonTextSecondary, isDark && styles.buttonTextSecondaryDark]}>
                    Renvoyer l'email
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={styles.skipButton}
            >
              <Text style={[styles.skipText, isDark && styles.skipTextDark]}>Continuer sans vérifier</Text>
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
    maxWidth: 340,
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
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconCircleDark: {
    backgroundColor: '#388E3C',
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
    fontSize: 15,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  messageDark: {
    color: '#C5C9D1',
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  instructionsDark: {
    color: '#8A8E96',
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
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#F9C4A3',
  },
  buttonSecondaryDark: {
    backgroundColor: '#2A2420',
    borderColor: '#4A3A30',
  },
  resendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextSecondaryDark: {
    color: theme.colors.primaryLight,
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  skipTextDark: {
    color: '#666666',
  },
});

export default RegisterSuccessModal;
