import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';

export default function NextButton({
  label = 'Suivant',
  onPress,
  disabled = false,
  loading = false,
  style,
}) {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: disabled
            ? isDark ? '#2a2a33' : '#d6d3d1'
            : isDark ? '#f3f3f6' : '#1c1917',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isDark ? '#1c1917' : '#fff'} size="small" />
      ) : (
        <Text style={[
          styles.label,
          {
            color: disabled
              ? isDark ? '#7a7a88' : '#a8a29e'
              : isDark ? '#1c1917' : '#ffffff',
          },
        ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
