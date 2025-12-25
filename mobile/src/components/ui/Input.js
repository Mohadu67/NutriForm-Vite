import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, useColorScheme } from 'react-native';
import { theme } from '../../theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  disabled = false,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return isDark ? '#333' : '#E0E0E0';
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>
      )}
      <View
        style={[
          styles.container,
          isDark ? styles.containerDark : styles.containerLight,
          disabled && styles.disabled,
          { borderColor: getBorderColor() },
          style,
        ]}
      >
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#666' : '#999'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          {...rest}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  labelDark: {
    color: '#E0E0E0',
  },
  container: {
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#2A2A2A',
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    fontSize: 16,
    padding: 0,
    letterSpacing: 0.2,
  },
  inputLight: {
    color: '#1a1a1a',
  },
  inputDark: {
    color: '#FFFFFF',
  },
  error: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 6,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default Input;
