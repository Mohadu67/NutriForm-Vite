import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const PasswordInput = ({
  label,
  placeholder = 'Mot de passe',
  value,
  onChangeText,
  error,
  disabled = false,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return isDark ? '#333333' : theme.colors.border.light;
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>
      )}
      <View style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        disabled && styles.disabled,
        { borderColor: getBorderColor() },
        style,
      ]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#666666' : theme.colors.text.light}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={!showPassword}
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
            {...rest}
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={isDark ? '#888888' : theme.colors.text.light}
            />
          </TouchableOpacity>
        </View>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  labelDark: {
    color: theme.colors.text.inverse,
  },
  container: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  containerLight: {
    backgroundColor: theme.colors.background.light,
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  disabled: {
    opacity: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.md,
    padding: 0,
    paddingVertical: theme.spacing.sm,
  },
  inputLight: {
    color: theme.colors.text.primary,
  },
  inputDark: {
    color: theme.colors.text.inverse,
  },
  toggleButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  error: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeight.medium,
  },
});

export default PasswordInput;
