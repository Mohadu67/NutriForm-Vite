import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const ErrorModal = ({ visible, onClose, title, message, onResendEmail, isResending }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, isDark && styles.modalDark]}>
          {/* Icon */}
          <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </View>

          {/* Title */}
          <Text style={[styles.title, isDark && styles.titleDark]}>
            {title || 'Oups !'}
          </Text>

          {/* Message */}
          <Text style={[styles.message, isDark && styles.messageDark]}>
            {message || 'Quelque chose s\'est mal passé. Veuillez réessayer plus tard.'}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Resend Email Button (optional) */}
            {onResendEmail && (
              <TouchableOpacity
                style={[styles.buttonSecondary, isDark && styles.buttonSecondaryDark]}
                onPress={onResendEmail}
                disabled={isResending}
                activeOpacity={0.8}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <View style={styles.resendContent}>
                    <Ionicons name="mail-outline" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.buttonTextSecondary, isDark && styles.buttonTextSecondaryDark]}>
                      Renvoyer l'email
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonTextPrimary}>Fermer</Text>
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
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconCircleDark: {
    backgroundColor: '#D32F2F',
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
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  messageDark: {
    color: '#C5C9D1',
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
    backgroundColor: theme.colors.error,
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
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  buttonSecondaryDark: {
    backgroundColor: '#2A1F1F',
    borderColor: '#4A2F2F',
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
});

export default ErrorModal;
