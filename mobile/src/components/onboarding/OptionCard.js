import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export default function OptionCard({
  label,
  subtitle,
  icon,
  selected = false,
  onPress,
  style,
  multiSelect = false,
}) {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: selected
            ? isDark ? 'rgba(34,197,94,0.15)' : '#e8f5e9'
            : isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f4',
          borderColor: selected ? '#22c55e' : 'transparent',
          borderWidth: selected ? 1.5 : 1.5,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.label,
            { color: isDark ? '#f3f3f6' : '#1c1917' },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
        {subtitle && <View>{subtitle}</View>}
      </View>
      {multiSelect && (
        <View style={[
          styles.checkbox,
          {
            backgroundColor: selected ? '#22c55e' : 'transparent',
            borderColor: selected ? '#22c55e' : isDark ? '#7a7a88' : '#d6d3d1',
          },
        ]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
