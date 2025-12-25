import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const SocialAuthButtons = ({
  onAppleSignIn,
  onGoogleSignIn,
  isLoading = false,
  disabled = false
}) => {
  const isIOS = Platform.OS === 'ios';

  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.buttonsContainer}>
        {isIOS && (
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton, disabled && styles.disabled]}
            onPress={onAppleSignIn}
            disabled={isLoading || disabled}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton, disabled && styles.disabled]}
          onPress={onGoogleSignIn}
          disabled={isLoading || disabled}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#333333" size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  dividerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.light,
    paddingHorizontal: theme.spacing.md,
    textTransform: 'uppercase',
  },
  buttonsContainer: {
    gap: theme.spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    minHeight: 48,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  googleButtonText: {
    color: '#333333',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default SocialAuthButtons;
